"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  useConfigureEurostatWorkflowMutation,
  useFetchEurostatStructureMutation
} from "@/redux/services/workflowApiSlice";
import {
  EurostatConfigFormProps,
  EurostatFormValues,
  EurostatConfigPayload,
  DataStructure,
  DataSampleItem,
  WorkflowData
} from "@/types/workflow";

const eurostatSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  frequency: z.string().min(1, "Frequency is required"),
});

export default function EurostatConfigForm({
  workflowData,
  onNext,
  onBack,
  isEditing = false
}: EurostatConfigFormProps) {
  const [configureEurostatWorkflow, { isLoading: isConfiguring }] = useConfigureEurostatWorkflowMutation();
  const [fetchEurostatStructure, { isLoading: isFetching }] = useFetchEurostatStructureMutation();
  const [processingSubmit, setProcessingSubmit] = useState(false);
  const [dataStructure, setDataStructure] = useState<DataStructure | null>(null);
  const [eurostatRequestId, setEurostatRequestId] = useState<number | undefined>(workflowData?.eurostat_request_id);

  const form = useForm<EurostatFormValues>({
    resolver: zodResolver(eurostatSchema),
    defaultValues: {
      url: workflowData.url || "",
      frequency: workflowData.frequency || "Monthly",
    },
  });

  // Update form when editing or when dataStructure changes
  useEffect(() => {
    if (isEditing && workflowData.workflow_type === "EUROSTAT") {
      form.reset({
        url: workflowData.url || "",
        frequency: workflowData.frequency || "Monthly",
      });

      if (workflowData.data_structure) {
        setDataStructure(workflowData.data_structure as DataStructure);
      }

      if (workflowData.eurostat_request_id) {
        setEurostatRequestId(workflowData.eurostat_request_id);
      }
    } else if (!isEditing && dataStructure?.frequency) {
      // When not editing, use the detected frequency from dataStructure as default
      form.setValue("frequency", dataStructure.frequency);
    }
  }, [isEditing, workflowData, form, dataStructure]);

  // Fetch data structure when URL and dataset code change
  const watchUrl = form.watch("url");

  useEffect(() => {
    if (!watchUrl || !watchUrl.startsWith('http')|| workflowData.workflow_type !== "EUROSTAT") return;

    const fetchStructure = async () => {
      try {
        // Clean the URL before fetching structure
        let cleanUrl = watchUrl;
        const timeParamRegex = /&c\[TIME_PERIOD\]=[^&]*/;
        const timeParamMatch = cleanUrl.match(timeParamRegex);
        if (timeParamMatch && timeParamMatch[0]) {
          cleanUrl = cleanUrl.replace(timeParamMatch[0], '');
          console.log(`Removed TIME_PERIOD parameter for fetching. Original: ${watchUrl}, Cleaned: ${cleanUrl}`);
        }

        const response = await fetchEurostatStructure({
          url: cleanUrl, // Use the cleaned URL for fetching
        }).unwrap();

        setDataStructure(response);


      } catch (error: unknown) {
        console.error("Error fetching Eurostat data structure:", error);
        const errorData = error && typeof error === 'object' && 'data' in error
          ? (error.data as { error?: string })
          : { error: "Unknown error" };

        toast({
          variant: "destructive",
          title: "Error fetching data structure",
          description: errorData.error || "Could not fetch data from the provided URL",
        });
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchStructure, 1000);
    return () => clearTimeout(timer);
  }, [watchUrl, fetchEurostatStructure, form, workflowData.workflow_type]);

  // Handle back button click
  const handleBack = () => {
    // Gather current form data
    let dataToPreserve: Partial<WorkflowData> = { ...workflowData };

    const currentFormData = form.getValues();
    dataToPreserve = {
      ...dataToPreserve,
      url: currentFormData.url,
      frequency: currentFormData.frequency,
      eurostat_request_id: eurostatRequestId,
      data_structure: dataStructure || undefined
    };

    console.log("Preserving data when going back:", dataToPreserve);

    // Execute the provided onBack with the preserved data
    onBack();
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate form
    const validationResult = await form.trigger();
    if (!validationResult) {
      return; // Stop if validation fails
    }

    // Get form values
    const values = form.getValues();

    if (!workflowData.id) {
      toast({
        variant: "destructive",
        title: "Workflow ID missing",
        description: "Please go back to step 1 and create a workflow first",
      });
      return;
    }

    // Prevent double submission
    if (processingSubmit || isConfiguring) {
      return;
    }

    setProcessingSubmit(true);

    try {
      console.log(`${isEditing ? "Updating" : "Configuring"} Eurostat workflow with ID:`, workflowData.id);

      // Clean the URL - remove the time period parameter
      let cleanUrl = values.url;
      const timeParamRegex = /&c\[TIME_PERIOD\]=[^&]*/;
      const timeParamMatch = cleanUrl.match(timeParamRegex);
      if (timeParamMatch && timeParamMatch[0]) {
        cleanUrl = cleanUrl.replace(timeParamMatch[0], '');
        console.log(`Removed TIME_PERIOD parameter from URL. Original: ${values.url}, Cleaned: ${cleanUrl}`);
      }

      // If we already have a request ID, use it to indicate this is an update
      const configData: EurostatConfigPayload = {
        workflow_id: workflowData.id,
        url: cleanUrl, // Use the cleaned URL without TIME_PERIOD parameter
        frequency: values.frequency,
        eurostat_request_id: eurostatRequestId // Pass the existing request ID if available
      };

      console.log("Sending Eurostat config data:", configData);

      const response = await configureEurostatWorkflow(configData).unwrap();

      console.log("Config response:", response);

      // Save the request ID for future use
      if (response.eurostat_request_id) {
        setEurostatRequestId(response.eurostat_request_id);
      }

      // Make sure we pass all necessary data forward including the original workflowData
      const nextData: Partial<WorkflowData> = {
        ...workflowData,
        ...values,
        url: cleanUrl, // Use the cleaned URL
        eurostat_request_id: response.eurostat_request_id || eurostatRequestId,
        data_structure: dataStructure || undefined
      };

      console.log("Moving to next step with data:", nextData);

      // Add a small delay before transition
      setTimeout(() => {
        onNext(nextData);
        setProcessingSubmit(false);
      }, 100);

    } catch (error: unknown) {
      console.error(`Error ${isEditing ? "updating" : "configuring"} Eurostat workflow:`, error);
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error.data as { error?: string })
        : { error: `Failed to ${isEditing ? "update" : "configure"} the workflow` };

      toast({
        variant: "destructive",
        title: isEditing ? "Update Error" : "Configuration Error",
        description: errorData.error || `Failed to ${isEditing ? "update" : "configure"} the workflow`,
      });
      setProcessingSubmit(false);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eurostat API URL</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/..."
                    {...field}
                  />
                  {isFetching && <Loader2 className="animate-spin h-4 w-4" />}
                </div>
              </FormControl>
              <FormDescription>
                Enter the URL of the Eurostat API endpoint
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        {dataStructure && (
          <Card className="p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Data Source: {dataStructure.title || "Eurostat Data"}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Dimensions: {dataStructure.dimensions?.length || 0}</div>
              <div>Periods: {dataStructure.periods?.length || 0}</div>
              {dataStructure.data_sample && dataStructure.data_sample.length > 0 && (
                <div className="col-span-2">
                  <h4 className="text-xs font-medium mb-1">Sample Data:</h4>
                  <div className="text-xs overflow-auto max-h-36">
                    {dataStructure.data_sample.map((item: DataSampleItem, i: number) => (
                      <div key={i} className="border-t border-gray-200 pt-1 pb-1 first:border-t-0">
                        <div className="flex justify-between font-medium">
                          <span>Date: {item.dimensions?.time?.id || "N/A"}</span>
                          <span>Value: {item.value}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {item.dimensions && Object.entries(item.dimensions).map(([dimKey, dimValue]) => (
                            dimKey !== 'time' && dimValue && (
                              <div key={dimKey} className="flex justify-between">
                                <span>{dataStructure.dimension_labels?.[dimKey] || dimKey}:</span>
                                <span>{dimValue.label || dimValue.id}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Frequency</FormLabel>
                <Select
                onValueChange={field.onChange}
                value={field.value}
                >
                <FormControl>
                  <SelectTrigger>
                  <SelectValue placeholder="Select update frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
                </Select>
              <FormDescription>
                Choose the frequency of this data
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isConfiguring || processingSubmit || !dataStructure}
          >
            {isConfiguring || processingSubmit ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Configuring..."}
              </>
            ) : (
              isEditing ? "Update & Next" : "Next"
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
}
