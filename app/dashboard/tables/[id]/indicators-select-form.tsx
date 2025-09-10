"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import React from "react";
import { useAddIndicatorsToTableMutation } from "@/redux/services/tablesApiSlice";
import { useParams, useRouter } from "next/navigation";
import { FrequencyGroupedIndicators } from "@/types/dashboard";

interface IndicatorsSelectFormProps {
  searchResults: FrequencyGroupedIndicators;
}

const IndicatorsSelectForm: React.FC<IndicatorsSelectFormProps> = ({
  searchResults,
}) => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  // Create a dynamic form schema based on searchResults
  const generateSchema = (results: FrequencyGroupedIndicators) => {
    const schema: Record<string, z.ZodType<boolean | undefined>> = {}; // Using explicit ZodType to support optional booleans
    Object.values(results)
      .flat()
      .forEach((item) => {
        schema[`indicator-${item.id}`] = z.boolean().optional();
      });
    return z.object(schema);
  };

  const formSchema = generateSchema(searchResults);
  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean[]>>(
    () =>
      Object.keys(searchResults).reduce((acc, frequency) => {
        acc[frequency] = searchResults[frequency].map(() => false);
        return acc;
      }, {} as Record<string, boolean[]>)
  );

  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(
    null
  );

  const toggleSelectAll = (frequency: string) => {
    if (selectedFrequency && selectedFrequency !== frequency) {
      toast({
        title: "Select options from a single frequency",
        description: "Please deselect items from the other frequency first.",
      });
      return;
    }

    if (!selectedItems[frequency]) return;

    const allSelected = selectedItems[frequency].every(Boolean);
    setSelectedItems((prevSelectedItems) => ({
      ...prevSelectedItems,
      [frequency]: prevSelectedItems[frequency].map(() => !allSelected),
    }));

    setSelectedFrequency(!allSelected ? frequency : null);
  };

  const toggleItem = (frequency: string, index: number) => {
    if (selectedFrequency && selectedFrequency !== frequency) {
      toast({
        title: "Select options from a single frequency",
        description: "Please deselect items from the other frequency first.",
        variant: "destructive",
      });
      return;
    }

    setSelectedItems((prevSelectedItems) => {
      if (!prevSelectedItems[frequency]) return prevSelectedItems; // Ensure frequency exists
      const updatedItems = prevSelectedItems[frequency].map((item, idx) =>
        idx === index ? !item : item
      );
      const isFrequencySelected = updatedItems.some(Boolean);

      setSelectedFrequency(isFrequencySelected ? frequency : null);

      return {
        ...prevSelectedItems,
        [frequency]: updatedItems,
      };
    });
  };

  const [addIndicatorsToTable, { isLoading }] = useAddIndicatorsToTableMutation();

  const onSubmit = async () => {
    const selectedIndicatorIds: number[] = [];

    Object.entries(selectedItems).forEach(([frequency, items]) => {
      items.forEach((isSelected, index) => {
        if (isSelected) {
          const indicatorId = searchResults[frequency][index].id;
          selectedIndicatorIds.push(indicatorId);
        }
      });
    });

    if (selectedIndicatorIds.length === 0) {
      toast({
        title: "No indicators selected",
        description: "Please select at least one indicator to add to the table.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addIndicatorsToTable({
        tableId: id,
        indicators: selectedIndicatorIds
      }).unwrap();

      toast({
        title: "Indicators added successfully!",
        description: `Added ${selectedIndicatorIds.length} indicators to the table.`,
      });

      router.replace(`/dashboard/tables/${id}/`);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to add indicators";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-row gap-5">
          {Object.entries(searchResults).map(([frequency, items]) => (
            <div key={frequency} className="flex flex-col gap-2">
              <h3 className="frequency-title">
                Frequency in years - {frequency}
              </h3>
              <div className="flex flex-row gap-4 items-center">
                <p>Select All</p>
                <Checkbox
                  id={`selectall-${frequency}`}
                  checked={selectedItems[frequency]?.every(Boolean) || false}
                  onCheckedChange={() => toggleSelectAll(frequency)}
                />
              </div>
              <ScrollArea className="h-[200px] w-[350px]">
                {items.map((item, index) => (
                  <FormField
                    key={`${frequency}-${index}`}
                    control={form.control}
                    name={`indicator-${item.id}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={selectedItems[frequency]?.[index] ?? false}
                            onCheckedChange={() => {
                              if (selectedItems[frequency]?.[index] !== undefined) {
                                toggleItem(frequency, index);
                                field.onChange(!selectedItems[frequency][index]);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{item.name}</FormLabel>
                          <FormDescription>{item.code}</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </ScrollArea>
            </div>
          ))}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding indicators...
            </>
          ) : (
            "Add to Table"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default IndicatorsSelectForm;
