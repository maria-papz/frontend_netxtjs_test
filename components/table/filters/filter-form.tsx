"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Accordion } from "@radix-ui/react-accordion"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FilterGroup, FilterItem, FilterSelections } from "@/types/dashboard"

interface FilterFormProps {
  items: FilterGroup[]
  onSubmit: (data: FilterSelections) => void
}

// Create a dynamic schema based on available filter groups
const createFormSchema = () => {
  const schema: Record<string, z.ZodTypeAny> = {
    category: z.array(z.string()).optional(),
    unit: z.array(z.string()).optional(),
    base_year: z.array(z.string()).optional(),
    frequency: z.array(z.string()).optional(),
    country: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    seasonally_adjusted: z.array(z.string()).optional(),
    custom_indicator: z.array(z.string()).optional(),
    current_prices: z.array(z.string()).optional(),
    source: z.array(z.string()).optional(),
  };

  return z.object(schema);
};

const FormSchema = createFormSchema();
type FormSchemaType = z.infer<typeof FormSchema>;

export function FilterForm({ items, onSubmit }: FilterFormProps) {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: Object.fromEntries(
      items.map(group => [group.group, []])
    ) as FormSchemaType,
  });

  function handleSubmit(selected: FormSchemaType) {
    // Call the parent callback with properly typed data
    onSubmit(selected as FilterSelections);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <ScrollArea className="h-[calc(100vh-200px)] overflow-y-auto">
          <Accordion type="single" collapsible>
            {items.map((group) => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger>{group.group}</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    key={group.group}
                    control={form.control}
                    name={group.group as keyof FormSchemaType}
                    render={() => (
                      <FormItem>
                        <div className="flex justify-end">
                          <div className="flex items-center space-x-2">
                            <span className="ml-2 font-bold">Select all  </span>
                            <Checkbox
                              onCheckedChange={(checked) => {
                                const allIds = group.items.map((item: FilterItem) => item.id);
                                form.setValue(
                                  group.group as keyof FormSchemaType,
                                  checked ? allIds : []
                                );
                              }}
                            />
                          </div>
                        </div>
                        {group.items.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name={group.group as keyof FormSchemaType}
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={Array.isArray(field.value) && field.value.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(Array.isArray(field.value) ? field.value : []), item.id])
                                          : field.onChange(
                                            (Array.isArray(field.value) ? field.value : []).filter(
                                              (value: string) => value !== item.id
                                            )
                                          );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
        <Button type="submit">Apply</Button>
      </form>
    </Form>
  );
}
