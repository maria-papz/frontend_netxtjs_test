"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, PlusCircle, Trash2 } from "lucide-react";
import {
  useCreateCystatIndicatorMappingMutation
} from "@/redux/services/workflowApiSlice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import WorkflowIndicatorSelection from "./workflow-indicator-selection";
import {
  IndicatorMappingFormProps,
  DataVariable,
  Indicator,
  IndicatorMapping,
  CodeMapping,
  IndicatorMappingPayload,
  VariableOption
} from "@/types/workflow";

export default function WorkflowIndicatorMapping({
  workflowData,
  onComplete,
  onBack,
  isEditing = false
}: IndicatorMappingFormProps) {
  const [createCystatIndicatorMapping, { isLoading: isCreating }] = useCreateCystatIndicatorMappingMutation();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isSelectingIndicators, setIsSelectingIndicators] = useState<boolean>(false);
  const [formInitialized, setFormInitialized] = useState<boolean>(false);

  const { data_structure, indicators, indicator_mappings } = workflowData;
  console.log("Workflow Data:", workflowData);
  const dataVariables = data_structure?.variables || [];

  // Log the data we're working with
  useEffect(() => {
    if (isEditing) {
      console.log("Editing workflow with indicator mappings:", indicator_mappings);
      console.log("Indicators available:", indicators);
    }
  }, [isEditing, indicator_mappings, indicators]);

  // Filter out time-based variables (QUARTER, MONTH, YEAR)
  const mappableVariables = dataVariables.filter(
    (variable: DataVariable) => !['QUARTER', 'MONTH', 'YEAR'].includes(variable.code)
  );

  // Define the form schema type
  const indicatorSchema = z.object({
    id: z.number(),
    name: z.string(),
    mappings: z.record(z.string())
  });

  const formSchema = z.object({
    indicators: z.array(indicatorSchema)
  });

  type FormValues = z.infer<typeof formSchema>;

  // Initialize the form with data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      indicators: []
    }
  });

  const { control, reset } = form;
  const { fields, remove, append } = useFieldArray({
    control,
    name: "indicators"
  });

  // When editing, populate form with existing mappings from the workflow data
  useEffect(() => {
    if (!formInitialized && isEditing &&
        indicator_mappings &&
        indicator_mappings.length > 0 &&
        mappableVariables.length > 0) {

      console.log("Initializing form with existing mappings:", indicator_mappings);

      const existingMappings = indicator_mappings.map((mapping: IndicatorMapping) => {
        // Find the corresponding indicator in the indicators array
        const matchedIndicator = indicators?.find(
          (ind: Indicator) => ind.id === mapping.indicator_id
        );

        // Create a mappings object from the key_indices
        const mappings: Record<string, string> = {};

        // For each mappable variable, extract the value from key_indices
        mappableVariables.forEach((variable: DataVariable) => {
          const code = variable.code;
          // Use the mapping's key_indices or empty string as fallback
          mappings[code] = mapping.key_indices?.[code] || "";
        });

        return {
          id: mapping.indicator_id,
          name: matchedIndicator?.name || mapping.indicator_name || "Unknown Indicator",
          mappings
        };
      });

      console.log("Setting form with mappings:", existingMappings);

      if (existingMappings.length > 0) {
        reset({ indicators: existingMappings });
        setFormInitialized(true);
      }
    }
  }, [isEditing, indicator_mappings, indicators, mappableVariables, reset, formInitialized]);

  // Handle empty form when there are indicators but no mappings yet
  useEffect(() => {
    if (!formInitialized &&
        indicators &&
        indicators.length > 0 &&
        (!indicator_mappings || indicator_mappings.length === 0)) {

      console.log("Setting initial form with available indicators:", indicators);

      const initialIndicators = indicators.map((indicator: Indicator) => ({
        id: indicator.id,
        name: indicator.name,
        mappings: mappableVariables.reduce((acc: Record<string, string>, variable: DataVariable) => {
          acc[variable.code] = "";
          return acc;
        }, {})
      }));

      if (initialIndicators.length > 0) {
        reset({ indicators: initialIndicators });
        setFormInitialized(true);
      }
    }
  }, [indicators, indicator_mappings, mappableVariables, reset, formInitialized]);

  // Handle indicator selection from the selection screen
  const handleIndicatorSelection = (selectedIds: number[], selectedIndicators: Indicator[]) => {
    // Create new form fields for the selected indicators
    selectedIndicators.forEach(indicator => {
      // Check if this indicator is already in the form
      const existingIndex = fields.findIndex(field => field.id === indicator.id);
      if (existingIndex === -1) {
        // Only add indicators that aren't already in the form
        append({
          id: indicator.id,
          name: indicator.name,
          mappings: mappableVariables.reduce((acc: Record<string, string>, variable: DataVariable) => {
            acc[variable.code] = "";
            return acc;
          }, {})
        });
      }
    });

    // Switch back to the mapping view
    setIsSelectingIndicators(false);
  };

  // Validation function to check if all codes for all indicators have values
  const validateAllFieldsHaveValues = () => {
    const errors: Record<string, string[]> = {};
    const values = form.getValues();

    // Check each indicator and its mappings
    fields.forEach((field, indicatorIndex) => {
      const indicatorErrors: string[] = [];

      mappableVariables.forEach((variable: DataVariable) => {
        const code = variable.code;
        const fieldValue = values.indicators[indicatorIndex]?.mappings?.[code] || '';

        if (!fieldValue) {
          indicatorErrors.push(variable.code);
        }
      });

      if (indicatorErrors.length > 0) {
        errors[indicatorIndex] = indicatorErrors;
      }
    });

    return errors;
  };

  // Handle removing an indicator
  const handleRemoveIndicator = (index: number) => {
    // Remove the indicator from the form
    remove(index);

    // Update the errors state
    const newErrors = { ...formErrors };
    delete newErrors[index.toString()];

    // Adjust error indices for indicators after the removed one
    const updatedErrors: Record<string, string[]> = {};
    Object.entries(newErrors).forEach(([errorIndex, errorCodes]) => {
      const currentIndex = parseInt(errorIndex);
      if (currentIndex > index) {
        updatedErrors[(currentIndex - 1).toString()] = errorCodes;
      } else {
        updatedErrors[errorIndex] = errorCodes;
      }
    });

    setFormErrors(updatedErrors);

    toast({
      title: "Indicator removed",
      description: "The indicator has been removed from mapping."
    });
  };

  const onSubmit = async () => {
    // Final validation for all fields
    const errors = validateAllFieldsHaveValues();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);

      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select values for all codes for all indicators.",
      });
      return;
    }

    const values = form.getValues();
    const indicatorMappings: IndicatorMappingPayload[] = values.indicators.map((indicator) => {
      const codeMappings: CodeMapping[] = Object.entries(indicator.mappings).map(([code, value]) => {
        return {
          code,
          value // We use the index value from the form
        };
      });

      return {
        indicator_id: indicator.id,
        code_mappings: codeMappings
      };
    });

    try {
      await createCystatIndicatorMapping({
        cystat_request_id: workflowData.cystat_request_id,
        indicator_mappings: indicatorMappings,
        is_update: isEditing
      }).unwrap();

      toast({
        title: isEditing ? "Workflow mappings updated" : "Workflow mapping completed",
        description: isEditing
          ? "Your indicator mappings have been updated successfully."
          : "Your indicators have been successfully mapped. The workflow is now ready to run.",
      });

      onComplete();
    } catch (error: unknown) {
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error.data as { error?: string })
        : { error: `Failed to ${isEditing ? "update" : "map"} indicators` };

      toast({
        variant: "destructive",
        title: isEditing ? "Error updating mapping" : "Error creating mapping",
        description: errorData.error || `Failed to ${isEditing ? "update" : "map"} indicators`,
      });
    }
  };

  // Get all variable values for a specific variable code
  const getVariableValues = (variable: DataVariable): VariableOption[] => {
    const values: VariableOption[] = [];
    const valueTexts = variable.valueTexts || [];
    const actualValues = variable.values || [];

    for (let i = 0; i < valueTexts.length; i++) {
      // Use the actual value as the value if available, otherwise use the index
      const actualValue = i < actualValues.length ? String(actualValues[i]) : String(i);
      values.push({
        value: String(i), // We still use index as our form value
        label: valueTexts[i],
        actualValue: actualValue // Store the actual value for API submission
      });
    }

    return values;
  };

  // If in indicator selection mode, render the selection component
  if (isSelectingIndicators) {
    return (
      <WorkflowIndicatorSelection
        preSelectedIndicators={fields.map(field => field.id)}
        workflowFrequency={workflowData.frequency}
        onSelectionComplete={handleIndicatorSelection}
        onCancel={() => setIsSelectingIndicators(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Map Indicators to Data Fields</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select which data fields correspond to each indicator.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSelectingIndicators(true)}
        >
          <PlusCircle className="w-4 h-4 mr-1" /> Add Indicators
        </Button>
      </div>

      {mappableVariables.length === 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No mappable variables found</AlertTitle>
          <AlertDescription>
            Could not find any mappable variables in the data source.
          </AlertDescription>
        </Alert>
      ) : fields.length > 0 ? (
        <Form {...form}>
          <form>
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className={formErrors[index] && formErrors[index].length > 0
                    ? "border-destructive"
                    : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md">{field.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIndicator(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {formErrors[index] && formErrors[index].length > 0 && (
                        <Alert variant="destructive" className="mt-2 py-2">
                          <AlertTitle className="text-sm">Missing values</AlertTitle>
                          <AlertDescription className="text-xs">
                            Please select values for: {formErrors[index].join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mappableVariables.map((variable: DataVariable) => (
                          <FormField
                            key={variable.code}
                            control={control}
                            name={`indicators.${index}.mappings.${variable.code}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{variable.text || variable.code}</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={
                                        formErrors[index] &&
                                        formErrors[index]?.includes(variable.code)
                                          ? "border-destructive"
                                          : ""
                                      }
                                    >
                                      <SelectValue placeholder="Select a value" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getVariableValues(variable).map((option: VariableOption) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select the value that corresponds to this indicator
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </form>
        </Form>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No indicators selected</AlertTitle>
          <AlertDescription>
            {isEditing && indicator_mappings && indicator_mappings.length > 0 ?
              "Loading your existing mappings..." :
              "Please add indicators to continue with the mapping."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isCreating || fields.length === 0}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating Mappings..." : "Creating Mappings..."}
            </>
          ) : (
            isEditing ? "Update Mappings" : "Finish Setup"
          )}
        </Button>
      </div>
    </div>
  );
}
