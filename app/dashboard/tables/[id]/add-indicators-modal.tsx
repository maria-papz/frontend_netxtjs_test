"use client";

import React, { useEffect, useState } from "react";
import AddIndicatorButton from "@/components/animata/button/add-indicator-button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Search, Trash } from "lucide-react";
import IndicatorsSelectForm from "./indicators-select-form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGetIndicatorsQuery } from "@/redux/services/indicatorsApiSlice";
import { useBooleanFilterMutation } from "@/redux/services/dashboardApiSlice";
import { toast } from "@/hooks/use-toast";
import {
  FilterGroup,
  AdvancedFilterResult,
  IndicatorMetadata,
  MetadataSet,
  FrequencyGroupedIndicators
} from "@/types/dashboard";


interface FilterFormProps {
  items: FilterGroup[];
  onFilterSubmit?: (data: AdvancedFilterResult) => void;
}

const AddIndicatorsModal: React.FC<FilterFormProps> = (formprops) => {
  const [searchCategories, setSearchCategories] = useState<FilterGroup[]>([]);

  // Properly type the API response
  interface IndicatorsQueryResponse {
    indicators: IndicatorMetadata[];
    metadataset: MetadataSet;
  }

  const {
    data: indicatorsData,
    isLoading: isLoadingIndicators
  } = useGetIndicatorsQuery({}) as { data?: IndicatorsQueryResponse, isLoading: boolean };

  // Use the booleanFilter mutation hook from the API slice
  const [booleanFilter, { isLoading: isSubmitting }] = useBooleanFilterMutation();

  const [searchResults, setSearchResults] = useState<AdvancedFilterResult>({});
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  useEffect(() => {
    if (indicatorsData) {
      // Helper function to create filter groups
      const createFilterGroup = <T extends string | number>(
        name: string,
        items: T[] | undefined
      ): FilterGroup | null => {
        if (!items || items.length === 0) return null;

        return {
          group: name,
          items: items
            .filter((item): item is T => item !== null)
            .map((item) => ({
              id: item.toString(),
              label: item.toString(),
            })),
        };
      };

      const metadataset = indicatorsData?.metadataset || {};

      // Create filter groups for each metadata category
      const formattedCategories = createFilterGroup('category', metadataset.category);
      const formattedBaseYears = createFilterGroup('base_year', metadataset.base_year);
      const formattedRegions = createFilterGroup('region', metadataset.region);
      const formattedCountries = createFilterGroup('country', metadataset.country);
      const formattedSources = createFilterGroup('source', metadataset.source);
      const formattedFrequencies = createFilterGroup('frequency', metadataset.frequency);
      const formattedUnits = createFilterGroup('unit', metadataset.unit);

      // Base items for the form
      const baseItems: FilterGroup[] = formprops?.items
        ? [
            ...formprops.items,
            { group: "name", items: [] },
            { group: "description", items: [] },
            { group: "code", items: [] },
          ]
        : [
            { group: "name", items: [] },
            { group: "description", items: [] },
            { group: "code", items: [] },
            { group: "seasonally_adjusted", items: [] },
            { group: "is_custom", items: [] },
            { group: "currentPrices", items: [] },
          ];

      // Combine all filter groups
      if (!formprops?.items) {
        setSearchCategories([
          ...baseItems,
          ...(formattedCategories ? [formattedCategories] : []),
          ...(formattedBaseYears ? [formattedBaseYears] : []),
          ...(formattedRegions ? [formattedRegions] : []),
          ...(formattedCountries ? [formattedCountries] : []),
          ...(formattedFrequencies ? [formattedFrequencies] : []),
          ...(formattedUnits ? [formattedUnits] : []),
          ...(formattedSources ? [formattedSources] : []),
        ]);
      } else {
        setSearchCategories(baseItems);
      }
    }
  }, [indicatorsData, formprops?.items]);

  // Create a tuple of search categories for the enum
  const searchCategoriesOptions = searchCategories.length > 0
    ? ([
        searchCategories[0]?.group ?? "default",
        ...searchCategories.slice(1).map((item) => item.group),
      ] as const)
    : (["default"] as const);

  // Define the form schema with proper typing
  const baseSchema = z.object({
    field: z.enum(searchCategoriesOptions),
    value: z.string().min(1, "value is required"),
  });

  const additionalFieldSchema = z.object({
    boolean: z.enum(["AND", "OR", "NOT"]),
    field: z.enum(searchCategoriesOptions),
    value: z.string().min(1, "value is required"),
  });

  const formSchema = z.object({
    base: baseSchema,
    additionalFields: z.array(additionalFieldSchema).optional(),
  });

  // Infer the form type from the schema
  type FormSchema = z.infer<typeof formSchema>;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  const { control, handleSubmit, watch } = form;

  // Use useFieldArray to manage dynamic fields
  const {
    fields: additionalFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "additionalFields",
  });

  async function onSubmit(values: FormSchema) {
    try {
      // Use the RTK Query mutation hook instead of axios
      const response = await booleanFilter(values).unwrap();

      setSearchResults(response);

      if (formprops?.onFilterSubmit) {
        formprops.onFilterSubmit(response);
      } else {
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Error in boolean filter:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search indicators. Please try again.",
      });
    }
  }

  return (
    <Dialog>
      <DialogTrigger>
        {formprops?.onFilterSubmit ? (
          <Button className="bg-secondary dark:bg-secondary dark:text-white dark:hover:bg-secondary/80 text-md rounded-full h-11 mr-0 font-semibold">
            Advanced
          </Button>
        ) : (
          <AddIndicatorButton text={"Indicators"} />
        )}
      </DialogTrigger>
      <DialogContent className="p-10 w-full ">
        <DialogHeader>
          <DialogTitle>Add Indicators</DialogTitle>
          <DialogDescription>
            Add multiple indicators with conditions between them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <ScrollArea className="max-h-96">
              <div className="flex flex-col gap-3">
                {/* Base Fields */}
                <div className="flex flex-row gap-5">
                  <FormField
                    control={control}
                    name="base.field"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-row gap-2">
                            {/* Group dropdown */}
                            <Select
                              value={field.value}
                              onValueChange={(selectedGroup) => {
                                field.onChange(selectedGroup);
                                // Reset value when group changes
                                form.setValue("base.value", '');
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {searchCategories.map((category) => (
                                  <SelectItem key={category.group} value={category.group}>
                                    {category.group}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="base.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          {renderValueField(field, watch("base.field"), searchCategories)}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Fields */}
                {additionalFields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-flow-col auto-cols-max gap-5"
                  >
                    <FormField
                      control={control}
                      name={`additionalFields.${index}.boolean`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                                <SelectItem value="NOT">NOT</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`additionalFields.${index}.field`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex flex-row gap-2">
                              <Select
                                value={field.value}
                                onValueChange={(selectedGroup) => {
                                  field.onChange(selectedGroup);
                                  // Reset value when group changes
                                  form.setValue(`additionalFields.${index}.value`, '');
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {searchCategories.map((category) => (
                                    <SelectItem key={category.group} value={category.group}>
                                      {category.group}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`additionalFields.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            {renderValueField(
                              field,
                              watch(`additionalFields.${index}.field`),
                              searchCategories
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}

                <div className="flex flex-col gap-4">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      append({ boolean: "AND", field: searchCategoriesOptions[0], value: "" })
                    }
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            </ScrollArea>

            <Button type="submit" disabled={isSubmitting || isLoadingIndicators}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2">
                    <Search className="h-4 w-4" />
                  </div>
                  <p>Searching...</p>
                </div>
              ) : (
                <div className="flex items-center">
                  <p>Search</p>
                  <div className="hover:scale-110 ml-2">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              )}
            </Button>
          </form>
        </Form>

        {showSearchResults && Object.keys(searchResults).length > 0 ? (
          <IndicatorsSelectForm
            searchResults={
              Object.fromEntries(
                Object.entries(searchResults).map(([frequency, indicators]) => [
                  frequency,
                  indicators.map(indicator => ({
                    ...indicator,
                    id: Number(indicator.id) // Convert string id to number
                  }))
                ])
              ) as FrequencyGroupedIndicators
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// Helper function to render different input types based on field type
function renderValueField(
  field: { value: string; onChange: (value: string) => void },
  fieldType: string | undefined,
  searchCategories: FilterGroup[]
) {
  // ...existing implementation...
  const booleanFields = ['seasonally_adjusted', 'is_custom', 'currentPrices'];
  const textFields = ['name', 'description', 'code'];

  if (!fieldType) return null;

  if (textFields.includes(fieldType)) {
    return (
      <Input
        placeholder={`Enter ${fieldType}`}
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
      />
    );
  }

  if (booleanFields.includes(fieldType)) {
    return (
      <Select
        value={field.value}
        onValueChange={field.onChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select true or false" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // Default: dropdown with items from the selected category
  const categoryItems = searchCategories.find(s => s.group === fieldType)?.items || [];

  return (
    <Select
      value={field.value}
      onValueChange={field.onChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an item" />
      </SelectTrigger>
      <SelectContent>
        {categoryItems.map(item => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default AddIndicatorsModal;
