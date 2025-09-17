import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem,  SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogCategories } from "./category-dialog";
import { DialogCountries } from "./country-dialog";
import { DialogRegions } from "./region-dialog";
import { DialogUnits } from "./unit-dialog";
import {
  useGetCategoriesQuery,
  useGetRegionsQuery,
  useGetCountriesQuery,
  useGetIndicatorCodesQuery,
  useGetUnitsQuery,
  useUpdateIndicatorMutation
} from "@/redux/services/indicatorsApiSlice";
import {
  LocationType,
  FrequencyType,
  FrequencyDictionary
} from "@/types/dashboard";


// Define proper types for API responses
// Using centralized Category type from dashboard.ts
import { Category, Region } from "@/types/dashboard";

interface UnitItem {
  name: string;
  symbol?: string;
  description?: string;
}

interface CountryItem {
  name: string;
  code?: string;
}

// Using centralized Region type from dashboard.ts

type FormData = {
  locationType: LocationType;
  name: string;
  code: string;
  description: string;
  source?: string;
  frequency: FrequencyType;
  other_frequency?: string;
  seasonallyAdjusted?: string;
  baseYear?: string;
  isCustom?: string;
  country?: string;
  region?: string;
  category: string;
  currentPrices?: string;
  unit?: string;
};

type CreateIndicatorFormProps = {
  id:string,
  name: string;
  code: string;
  description: string;
  source?: string;
  frequency: string;
  otherFrequency?: string;
  seasonallyAdjusted?: string;
  baseYear?: number;
  isCustom?: string;
  country?: string;
  region?: string;
  category: string;
  currentPrices?: string;
  unit?: string;
};




const EditIndicatorForm: React.FC<CreateIndicatorFormProps> = ({
  id,
  name,
  code,
  description,
  source,
  frequency,
  otherFrequency,
  seasonallyAdjusted,
  baseYear,
  isCustom,
  country,
  region,
  category,
  currentPrices,
  unit,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  // Helper function to handle region which might be a string or an array
  const getRegionValue = (regionData: string | string[] | undefined): string => {
    if (!regionData) return "";

    // If it's an array, get the first element
    if (Array.isArray(regionData)) {
      return regionData.length > 0 ? regionData[0] : "";
    }

    // Otherwise, return the string value
    return regionData;
  };

  const [countr, setCountry] = useState<string | undefined>(country);
  const [reg, setRegion] = useState<string | undefined>(country ? undefined : getRegionValue(region));

  // Replace axios calls with RTK Query hooks
  const { data: countries = [] } = useGetCountriesQuery({});
  const { data: regions = [] } = useGetRegionsQuery({});
  const { data: categories = [] } = useGetCategoriesQuery({}); // This will be typed as Category[]
  const { data: units = [] } = useGetUnitsQuery({});
  const { data: codes = [] } = useGetIndicatorCodesQuery({});
  const [updateIndicator, { isLoading }] = useUpdateIndicatorMutation();

  // Type assertions to handle the types properly
  // Check if frequency is a key in FrequencyDictionary or a display name
  const typedFrequency = (() => {
    // Check if it's already a valid key (case-insensitive)
    if (Object.keys(FrequencyDictionary).some(key => key.toLowerCase() === frequency.toLowerCase())) {
      const exactKey = Object.keys(FrequencyDictionary).find(
        key => key.toLowerCase() === frequency.toLowerCase()
      ) as FrequencyType;
      return exactKey;
    }

    // Check if it's a display value (case-insensitive)
    const frequencyKey = Object.entries(FrequencyDictionary).find(
      ([, value]) => value.toLowerCase() === frequency.toLowerCase()
    )?.[0] as FrequencyType | undefined;

    if (frequencyKey) {
      return frequencyKey;
    }

    return "CUSTOM";
  })();

  const indicatorSchema = z.object({
    name: z.string().min(1, "Name is required").default(name || ""),
    code: z.string()
      .refine((val) => val === code || !(codes as string[]).includes(val), {
        message: "Code must be unique",
      })
      .refine((val) => !val.includes(" "), {
        message: "Code cannot contain spaces",
      })
      .refine((val) => !val.includes("@"), {
        message: "Code cannot contain @ character",
      })
      .default(code || ""),
    description: z.string().min(1, "Description is required").default(description || ""),
    source: z.string().optional().default(source || ""),
    frequency: z.enum(Object.keys(FrequencyDictionary) as [FrequencyType, ...FrequencyType[]]).default(typedFrequency),
    other_frequency: z.string().optional().default(otherFrequency || ""),
    seasonallyAdjusted: z.string().default(seasonallyAdjusted?.toString() || "false"),
    baseYear: z.string().refine((val) => {
      if (val === "") return true;
      const year = Number(val);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year > 1500 && year <= currentYear;
    }, {
      message: "Base Year must be over 1500 and less or equal to current year",
    }).default(baseYear?.toString() || "").optional(),
    isCustom: z.string().default(isCustom?.toString() || "false"),
    country: z.string().optional().default(country || ""),
    region: z.string().optional().default(country ? "" : getRegionValue(region)),
    category: z.string().min(1, "Category is required").default(category?.toString() || ""),
    unit: z.string().optional().default(unit || ""),
    currentPrices: z.string().default(currentPrices?.toString() || "true"),
    locationType: z.enum(["country", "region"] as const).default(countr ? "country" : "region"),
  });



  const form = useForm<z.infer<typeof indicatorSchema>>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      name: name || "",
      code: code || "",
      description: description || "",
      source: source || "",
      frequency: typedFrequency || "CUSTOM",
      other_frequency: otherFrequency || "",
      seasonallyAdjusted: seasonallyAdjusted?.toString() || "false",
      baseYear: baseYear?.toString() || "",
      isCustom: isCustom?.toString() || "false",
      country: country || "",
      region: country ? "" : getRegionValue(region),
      category: category?.toString() || "",
      unit: unit || "",
      currentPrices: currentPrices?.toString() || "true",
      locationType: countr ? "country" : "region",
    }
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await updateIndicator({
        id,
        name: data.name,
        code: data.code,
        description: data.description,
        source: data.source,
        frequency: frequency ? typedFrequency : data.frequency, // Use original frequency if already set
        other_frequency: frequency && typedFrequency === "CUSTOM" ? otherFrequency : data.other_frequency,
        seasonally_adjusted: data.seasonallyAdjusted,
        base_year: data.baseYear ? parseFloat(data.baseYear.toString()) : undefined,
        is_custom: data.isCustom,
        country: data.country,
        region: data.region,
        category: data.category,
        current_prices: data.currentPrices,
        location_type: data.locationType,
        unit: data.unit,
      }).unwrap();

      toast({
        title: `Indicator Updated Successfully!`,
        description: `${data.name} has been updated.`,
      });

      // Navigate back to the specific indicator page instead of the list
      router.push(`/dashboard/indicators/${id}`);
    } catch (error: unknown) {
      console.error("Error updating Indicator:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data ?
        String(error.data.error) : "Failed to update indicator";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => handleSubmit(data))} className="space-y-4">
        <ScrollArea className="h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} defaultValue={name || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} defaultValue={code || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} defaultValue={description || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input {...field} defaultValue={description || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={field.onChange} defaultValue={category ? category.toString() : undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories as Category[]).map((category) => (
                          <SelectItem key={category.name} value={category.name} title={category.description || ""}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DialogCategories
                      onCategoryAdded={() => {
                        // Trigger refetch if needed when a new category is added
                      }}
                    />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                        <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={field.onChange} defaultValue={unit || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {(units as UnitItem[]).map((unit) => (
                          <SelectItem
                            key={unit.name}
                            value={unit.name}
                            title={`${unit.symbol ? `Symbol: ${unit.symbol}` : ''}${unit.symbol && unit.description ? ' - ' : ''}${unit.description || ''}`}
                          >
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DialogUnits
                      onUnitAdded={() => {
                        // Trigger refetch if needed when a new unit is added
                      }}
                    />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={country}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.name} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={country ? undefined : getRegionValue(region)}>
                      <SelectTrigger>
                      <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                        {region.name}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
              /> */}
              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "region") {
                          if (value === "region") {
                            setCountry(undefined);
                          }
                          else if (value === "country"){
                            setRegion(undefined);
                          }
                          }
                        }}
                        defaultValue={countr ? "country" : (reg ? "region" : undefined)}
                        >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="region">Region</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(form.watch("locationType") === "country" || countr) && (
                <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                  <div className="flex items-center space-x-2">
                    <Select
                      onValueChange={(value) => {
                        // Extract the country name from the unique value format: index|||name|||code
                        const parts = value.split('|||');
                        const countryName = parts[1];
                        field.onChange(countryName);
                        setCountry(countryName);
                        }}
                        defaultValue={country ? `${(countries as CountryItem[]).findIndex(c => c.name === country)}|||${country}|||${(countries as CountryItem[]).find(c => c.name === country)?.code || ''}` : undefined}
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {(countries as CountryItem[]).map((country, index) => {
                          const uniqueId = `${index}|||${country.name}|||${country.code || ''}`;
                          return (
                            <SelectItem
                              key={uniqueId}
                              value={uniqueId}
                              title={country.code ? `Code: ${country.code}` : ""}
                            >
                              {country.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <DialogCountries
                      onCountryAdded={() => {
                        // Trigger refetch if needed when a new country is added
                      }}
                    />
                    </div>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
                />
              )}
              {(form.watch("locationType") === "region" || reg) && (
                <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Region</FormLabel>
                    <FormControl>
                    <div className="flex items-center space-x-2">
                    <Select onValueChange={field.onChange} defaultValue={country ? undefined : getRegionValue(region)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {(regions as Region[]).map((region) => (
                          <SelectItem
                            key={region.name}
                            value={region.name}
                            title={region.description || ""}
                          >
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DialogRegions
                      onRegionAdded={() => {
                        // Trigger refetch if needed when a new region is added
                      }}
                    />
                    </div>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
                />
              )}
              <FormField
                control={form.control}
                name="baseYear"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Year</FormLabel>
                  <FormControl>
                    <Input {...field} defaultValue={baseYear?.toString()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
            <FormItem>
            <FormLabel>Frequency</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!frequency} // Disable if frequency exists
              >
            <SelectTrigger>
              <SelectValue placeholder="Select a frequency" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FrequencyDictionary).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
              </Select>
            </FormControl>
            {!!frequency && (
              <p className="text-sm text-muted-foreground">
                Frequency cannot be changed after it has been set.
              </p>
            )}
            <FormMessage />
            </FormItem>
            )}
            />

            {form.watch("frequency") === "CUSTOM" && (
              <FormField
                control={form.control}
                name="other_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Frequency</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Specify custom frequency"
                        defaultValue={otherFrequency || ""}
                        disabled={!!frequency && form.watch("frequency") !== "CUSTOM"} // Disable if frequency is set and not CUSTOM
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="seasonallyAdjusted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seasonally Adjusted</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={seasonallyAdjusted?.toString() || "false"}>
                      <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isCustom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Indicator</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={isCustom?.toString()||"false"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPrices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Prices</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={currentPrices?.toString() || "true"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Indicator"}
        </Button>
      </form>
    </Form>
  );
};

export default EditIndicatorForm;
