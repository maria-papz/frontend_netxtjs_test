"use client";

import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FrequencyType, getFrequencyByDisplayName, getFrequencyDisplayName, FrequencyDictionary, Category, Region } from "@/types/dashboard";
import {
  useCreateIndicatorMutation,
  useGetCategoriesQuery,
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetUnitsQuery
} from "@/redux/services/indicatorsApiSlice";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export interface CreateIndicatorFormProps {
  codes: string[];
  afterSubmit?: (indicatorId: string) => void;
  isCustom?: boolean;
  fixedFrequency?: string | null;
}

// Explicitly define the return type as JSX.Element
const CreateIndicatorForm = ({codes, afterSubmit, isCustom = false, fixedFrequency}: CreateIndicatorFormProps): JSX.Element => {
  const router = useRouter();
  const { toast } = useToast();
  const [countries, setCountries] = useState<{ id: number; code: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: number; name: string; symbol?: string; description?: string }[]>([]);
  const [regions, setRegions] = useState<{ id: number; name: string; description?: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; description?: string }[]>([]);
  console.log("form code",codes)
  const indicatorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string()
      .refine((val) => !codes.includes(val), {
        message: "Code must be unique",
      })
      .refine((val) => !val.includes(" "), {
        message: "Code cannot contain spaces",
      })
      .refine((val) => !val.includes("@"), {
        message: "Code cannot contain @ character",
      }),
    description: z.string().min(1, "Description is required"),
    source: z.string().optional(),
    frequency: z.enum([
      "MINUTE",
      "HOURLY",
      "DAILY",
      "WEEKLY",
      "BIWEEKLY",
      "MONTHLY",
      "BIMONTHLY",
      "QUARTERLY",
      "TRIANNUAL",
      "SEMIANNUAL",
      "ANNUAL",
      "CUSTOM",
    ]).default("QUARTERLY"),
    other_frequency: z.string().optional(),
    seasonallyAdjusted: z.string().default("false"),
    baseYear: z.string().refine((val) => {
      if (val === "") return true;
      const year = Number(val);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year > 1500 && year <= currentYear;
    }, {
      message: "Base Year must be over 1500 and less or equal to current year",
    }).optional(),
    isCustom: z.string().default("false"),
    locationType: z.enum(["country", "region"]).optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    unit: z.string().optional(),
    currentPrices: z.string().default("true"),
    access_level: z.enum(["public", "unrestricted", "organization", "restricted", "org_full_public"]).default("org_full_public"),
  });
  const { data: categoriesData } = useGetCategoriesQuery({});
  const { data: regionsData } = useGetRegionsQuery({});
  const { data: countriesData } = useGetCountriesQuery(undefined);
  const { data: unitsData } = useGetUnitsQuery(undefined);
  const [createIndicator, { isLoading: isCreating }] = useCreateIndicatorMutation();

  // Set local state when data is fetched
  useEffect(() => {
    if (categoriesData) setCategories(categoriesData as Category[]);
    if (regionsData) setRegions(regionsData as Region[]);
    if (countriesData) setCountries(countriesData as { id: number; code: string; name: string }[]);
    if (unitsData) setUnits(unitsData as { id: number; name: string }[]);
  }, [categoriesData, regionsData, countriesData, unitsData]);

  const form = useForm<z.infer<typeof indicatorSchema>>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: fixedFrequency && typeof fixedFrequency === 'string' ? (() => {
      // Check if it matches a display name or enum value
      const frequencyEnumValue = getFrequencyByDisplayName(fixedFrequency);
      const isStandardFrequency = frequencyEnumValue ||
                                Object.keys(FrequencyDictionary).includes(fixedFrequency as FrequencyType);

      return {
        // If it's a standard frequency, use it; otherwise use CUSTOM
        frequency: isStandardFrequency
          ? (frequencyEnumValue || fixedFrequency) as FrequencyType
          : "CUSTOM",

        // If using CUSTOM, set the other_frequency field to the original value
        other_frequency: !isStandardFrequency ? fixedFrequency : undefined
      };
    })() : undefined
  });

  const handleSubmit = async (data: z.infer<typeof indicatorSchema>) => {
    console.log("submission", data);
    console.log("frequency", data.frequency);

    let custom_indicator = "false";
    if(afterSubmit || isCustom) {
      custom_indicator = "true";
    }

    try {
      // Ensure we're using the raw frequency value, not the display name
      const normalizedFrequency = getFrequencyByDisplayName(data.frequency) || data.frequency;

      const response = await createIndicator({
        name: data.name,
        code: data.code,
        description: data.description,
        source: data.source,
        frequency: normalizedFrequency,
        seasonally_adjusted: data.seasonallyAdjusted === "true",
        base_year: data.baseYear ? parseFloat(data.baseYear) : undefined,
        is_custom: custom_indicator,
        country: data.country ? parseInt(data.country) : undefined,
        region: data.region ? parseInt(data.region) : undefined,
        category: parseInt(data.category),
        current_prices: data.currentPrices === "true",
        unit: data.unit ? parseInt(data.unit) : undefined,
        access_level: data.access_level,
        other_frequency: data.other_frequency,
      }).unwrap();

      toast({
        title: `Indicator Created Successfully!`,
        description: `${data.name}`,
      });

      if (afterSubmit) {
        console.log("after submit", response.indicator_id);
        afterSubmit(String(response.indicator_id));
      } else {
        router.push(`/dashboard/indicators/${response.indicator_id}`);
      }
    } catch (error: unknown) {
      console.error("Error creating indicator:", error);
      const errorMessage =
        error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
          ? String(error.data.message)
          : error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : "An unknown error occurred";

      toast({
        title: "Uh Oh! Error creating indicator",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit) } className="space-y-4" >
        <ScrollArea className="h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
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
              <Input {...field} />
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
              <Input {...field} />
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
              <div className="flex items-center space-x-2">
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    title={category.name + (category.description ? ` - ${category.description}` : '')}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
                </Select>
              </FormControl>
              <DialogCategories
          onCategoryAdded={(newCategory) => {
            setCategories((prevCategories) => [...prevCategories, newCategory]);
          }}
        />
              </div>
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
              <div className="flex items-center space-x-2">
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem
                    key={unit.id}
                    value={unit.id.toString()}
                    title={unit.name + (unit.symbol ? ` (${unit.symbol})` : '') + (unit.description ? ` - ${unit.description}` : '')}
                  >
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
                </Select>
              </FormControl>
              <DialogUnits
          onUnitAdded={(newUnit) => {
            setUnits((prevUnits) => [...prevUnits, newUnit]);
          }}
        />
              </div>
              <FormMessage />
            </FormItem>
              )}
            />


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
                        }}
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
              {(form.watch("locationType") === "country") && (
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
                        field.onChange(value);
                        }}
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.id}
                            value={country.id.toString()}
                            title={country.code ? `Code: ${country.code} - ${country.name}` : country.name}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DialogCountries
          onCountryAdded={(newCountry) => {
            setCountries((prevCountries) => [...prevCountries, newCountry]);
          }}
        />
                    </div>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
                />
              )}
              {(form.watch("locationType") === "region") && (
                <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Region</FormLabel>
                    <FormControl>
                    <div className="flex items-center space-x-2">
                    <Select onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem
                            key={region.id}
                            value={region.id.toString()}
                            title={region.name + (region.description ? ` - ${region.description}` : '')}
                          >
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DialogRegions
          onRegionAdded={(newRegion) => {
            setRegions((prevRegions) => [...prevRegions, newRegion]);
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
              <Input {...field} />
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
                defaultValue={field.value?.toString()}
                disabled={!!fixedFrequency}
              >
            <SelectTrigger>
              <SelectValue placeholder="Select a frequency">
                {field.value ? getFrequencyDisplayName(field.value) : "Select a frequency"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINUTE">{getFrequencyDisplayName("MINUTE")}</SelectItem>
              <SelectItem value="HOURLY">{getFrequencyDisplayName("HOURLY")}</SelectItem>
              <SelectItem value="DAILY">{getFrequencyDisplayName("DAILY")}</SelectItem>
              <SelectItem value="WEEKLY">{getFrequencyDisplayName("WEEKLY")}</SelectItem>
              <SelectItem value="BIWEEKLY">{getFrequencyDisplayName("BIWEEKLY")}</SelectItem>
              <SelectItem value="MONTHLY">{getFrequencyDisplayName("MONTHLY")}</SelectItem>
              <SelectItem value="BIMONTHLY">{getFrequencyDisplayName("BIMONTHLY")}</SelectItem>
              <SelectItem value="QUARTERLY">{getFrequencyDisplayName("QUARTERLY")}</SelectItem>
              <SelectItem value="TRIANNUAL">{getFrequencyDisplayName("TRIANNUAL")}</SelectItem>
              <SelectItem value="SEMIANNUAL">{getFrequencyDisplayName("SEMIANNUAL")}</SelectItem>
              <SelectItem value="ANNUAL">{getFrequencyDisplayName("ANNUAL")}</SelectItem>
              <SelectItem value="CUSTOM">Custom / Other</SelectItem>
            </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
            {!!fixedFrequency && (
              <p className="text-xs text-muted-foreground">
                Frequency is fixed to match selected indicators
              </p>
            )}
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
                        disabled={!!fixedFrequency}
                      />
                    </FormControl>
                    <FormMessage />
                    {!!fixedFrequency && (
                      <p className="text-xs text-muted-foreground">
                        Frequency is fixed to match selected indicators
                      </p>
                    )}
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
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
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
            name="access_level"
            render={({ field }) => (
          <FormItem>
            <FormLabel>Access Level</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue="org_full_public">
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="organization">Organisation</SelectItem>
              <SelectItem value="org_full_public">Organisation Full, Public</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="unrestricted">Unrestricted</SelectItem>
            </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
            )}
          />
        </div>
        </ScrollArea>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Indicator"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateIndicatorForm;
