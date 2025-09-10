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
  useConfigureCystatWorkflowMutation,
  useFetchCystatStructureMutation,
  useFetchEcbStructureMutation
} from "@/redux/services/workflowApiSlice";
import EurostatConfigForm from "./eurostat-config-form";
import {
  WorkflowConfigFormProps,
  CystatFormValues,
  EcbFormValues,
  CystatConfigPayload,
  DataStructure,
  DataSample,
  WorkflowData
} from "@/types/workflow";

const cystatSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  frequency: z.string().min(1, "Frequency is required"),
  start_period: z.string().optional(),
});

const ecbSchema = z.object({
  table: z.string().min(1, "Table is required"),
  parameters: z.string().min(1, "Parameters are required"),
  frequency: z.string().min(1, "Frequency is required"),
});

export default function WorkflowConfigForm({ workflowData, onNext, onBack, isEditing = false }: WorkflowConfigFormProps) {
  const [configureCystatWorkflow, { isLoading: isConfiguringCystat }] = useConfigureCystatWorkflowMutation();
  const [fetchCystatStructure, { isLoading: isFetchingCystat }] = useFetchCystatStructureMutation();
  const [fetchEcbStructure, { isLoading: isFetchingEcb }] = useFetchEcbStructureMutation();
  const [processingSubmit, setProcessingSubmit] = useState(false);
  const [dataStructure, setDataStructure] = useState<DataStructure | null>(null);

  // Store the request IDs separately to ensure they're preserved
  const [cystatRequestId, setCystatRequestId] = useState<number | undefined>(workflowData?.cystat_request_id);
  const [ecbRequestId, setEcbRequestId] = useState<number | undefined>(workflowData?.ecb_request_id);

  console.log("Initial workflowData:", workflowData);

  const cystatForm = useForm<CystatFormValues>({
    resolver: zodResolver(cystatSchema),
    defaultValues: {
      url: workflowData.url || "",
      frequency: workflowData.frequency || "Monthly",
      start_period: workflowData.start_period || "",
    },
  });

  const ecbForm = useForm<EcbFormValues>({
    resolver: zodResolver(ecbSchema),
    defaultValues: {
      table: workflowData.table || "",
      parameters: workflowData.parameters || "",
      frequency: workflowData.frequency || "Monthly",
    },
  });

  // Update the ECB form initialization to better handle editing and default frequency
  useEffect(() => {
    if (workflowData.workflow_type === "ECB") {
      if (isEditing) {
        // Reset form with existing values when in edit mode
        ecbForm.reset({
          table: workflowData.table || "",
          parameters: workflowData.parameters || "",
          frequency: workflowData.frequency || "Monthly",
        });

        // If we have data structure already, set it
        if (workflowData.data_structure) {
          setDataStructure(workflowData.data_structure as DataStructure);
        }

        // Set ecb request ID
        if (workflowData.ecb_request_id) {
          setEcbRequestId(workflowData.ecb_request_id);
        }
      } else if (dataStructure?.frequency) {
        // When not editing, use the detected frequency from data structure as default
        ecbForm.setValue("frequency", dataStructure.frequency);
      }
    }
  }, [isEditing, workflowData, ecbForm, dataStructure]);

  // Fetch data structure when URL changes for CyStat
  const watchCystatUrl = cystatForm.watch("url");

  useEffect(() => {
    if (!watchCystatUrl || !watchCystatUrl.startsWith('http') || workflowData.workflow_type !== "CYSTAT") return;

    const fetchStructure = async () => {
      try {
        const response = await fetchCystatStructure({ url: watchCystatUrl }).unwrap();
        setDataStructure(response);

        // Update form if we get period data
        if (response.periods && response.periods.length > 0) {
          cystatForm.setValue("start_period", response.periods[0]);
        }
      } catch (error: unknown) {
        console.error("Error fetching CyStat data structure:", error);
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
  }, [watchCystatUrl, fetchCystatStructure, cystatForm, workflowData.workflow_type]);

  // Fetch data structure when table/parameters change for ECB
  const watchEcbTable = ecbForm.watch("table");
  const watchEcbParams = ecbForm.watch("parameters");

  useEffect(() => {
    if (!watchEcbTable || !watchEcbParams || workflowData.workflow_type !== "ECB") return;

    const fetchStructure = async () => {
      try {
        const response = await fetchEcbStructure({
          table: watchEcbTable,
          parameters: watchEcbParams
        }).unwrap();

        setDataStructure(response);

        // Update frequency if detected from response
        if (response.frequency) {
          ecbForm.setValue("frequency", response.frequency);
        }
      } catch (error: unknown) {
        console.error("Error fetching ECB data structure:", error);
        const errorData = error && typeof error === 'object' && 'data' in error
          ? (error.data as { error?: string })
          : { error: "Unknown error" };

        toast({
          variant: "destructive",
          title: "Error fetching data structure",
          description: errorData.error || "Could not fetch data from the ECB API",
        });
      }
    };

    // Debounce the fetch when both table and parameters are provided
    if (watchEcbTable && watchEcbParams) {
      const timer = setTimeout(fetchStructure, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchEcbTable, watchEcbParams, fetchEcbStructure, ecbForm, workflowData.workflow_type]);

  // Adjust frequency default value based on time_code for CyStat
  useEffect(() => {
    if (workflowData.workflow_type === "CYSTAT" && dataStructure?.time_code) {
      const timeCode = dataStructure.time_code.toLowerCase();
      if (timeCode.includes("month")) {
        cystatForm.setValue("frequency", "Monthly");
      } else if (timeCode.includes("quarter")) {
        cystatForm.setValue("frequency", "Quarterly");
      } else if (timeCode.includes("year")) {
        cystatForm.setValue("frequency", "Yearly");
      }
    }
  }, [dataStructure, cystatForm, workflowData.workflow_type]);

  // Add custom back handler to preserve data
  const handleBack = () => {
    // Gather current form data based on workflow type
    let dataToPreserve: Partial<WorkflowData> = { ...workflowData };

    if (workflowData.workflow_type === "CYSTAT") {
      const currentFormData = cystatForm.getValues();
      dataToPreserve = {
        ...dataToPreserve,
        url: currentFormData.url,
        frequency: currentFormData.frequency,
        start_period: currentFormData.start_period,
        cystat_request_id: cystatRequestId,
        data_structure: dataStructure || undefined
      };
    } else if (workflowData.workflow_type === "ECB") {
      const currentFormData = ecbForm.getValues();
      dataToPreserve = {
        ...dataToPreserve,
        table: currentFormData.table,
        parameters: currentFormData.parameters,
        frequency: currentFormData.frequency,
        ecb_request_id: ecbRequestId,
        data_structure: dataStructure || undefined
      };
    }

    console.log("Preserving data when going back:", dataToPreserve);

    // Execute the provided onBack with the preserved data
    onBack();
  };

  const handleCystatSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate form
    const validationResult = await cystatForm.trigger();
    if (!validationResult) {
      return; // Stop if validation fails
    }

    // Get form values
    const values = cystatForm.getValues();

    if (!workflowData.id) {
      toast({
        variant: "destructive",
        title: "Workflow ID missing",
        description: "Please go back to step 1 and create a workflow first",
      });
      return;
    }

    // Prevent double submission
    if (processingSubmit || isConfiguringCystat) {
      return;
    }

    setProcessingSubmit(true);

    try {
      console.log(`${isEditing ? "Updating" : "Configuring"} CyStat workflow with ID:`, workflowData.id);

      // If we already have a request ID, use it to indicate this is an update
      const configData: CystatConfigPayload = {
        workflow_id: workflowData.id,
        url: values.url,
        frequency: values.frequency,
        start_period: values.start_period,
        cystat_request_id: cystatRequestId // Pass the existing request ID if available
      };

      console.log("Sending CyStat config data:", configData);

      const response = await configureCystatWorkflow(configData).unwrap();

      console.log("Config response:", response);

      // Save the request ID for future use
      if (response.cystat_request_id) {
        setCystatRequestId(response.cystat_request_id);
      }

      // Make sure we pass all necessary data forward including the original workflowData
      const nextData: Partial<WorkflowData> = {
        ...workflowData,
        ...values,
        cystat_request_id: response.cystat_request_id || cystatRequestId,
        data_structure: dataStructure || undefined
      };

      console.log("Moving to next step with data:", nextData);

      // Add a small delay before transition
      setTimeout(() => {
        onNext(nextData);
        setProcessingSubmit(false);
      }, 100);

    } catch (error: unknown) {
      console.error(`Error ${isEditing ? "updating" : "configuring"} CyStat workflow:`, error);
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

  const handleEcbSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate form
    const validationResult = await ecbForm.trigger();
    if (!validationResult) {
      return; // Stop if validation fails
    }

    // Get form values
    const values = ecbForm.getValues();

    if (!workflowData.id) {
      toast({
        variant: "destructive",
        title: "Workflow ID missing",
        description: "Please go back to step 1 and create a workflow first",
      });
      return;
    }

    // Prevent double submission
    if (processingSubmit) {
      return;
    }

    setProcessingSubmit(true);

    try {
      console.log("Preparing ECB workflow data for next step");

      // For ECB, we don't send config to the server until after indicator selection
      // Just prepare the data for the next step, preserving indicator data if in edit mode
      const nextData: Partial<WorkflowData> = {
        ...workflowData,
        table: values.table,
        parameters: values.parameters,
        frequency: values.frequency,
        data_structure: dataStructure || undefined,
        ecb_request_id: ecbRequestId, // Preserve any existing request ID
        // Preserve indicator information when editing
        indicator: workflowData.indicator,
        indicator_id: workflowData.indicator_id,
        selectedIndicatorId: workflowData.indicator_id || workflowData.selectedIndicatorId
      };

      console.log("Moving to indicator selection step with data:", nextData);

      // Add a small delay before transition
      setTimeout(() => {
        onNext(nextData);
        setProcessingSubmit(false);
      }, 100);

    } catch (error: unknown) {
      console.error("Error preparing ECB workflow data:", error);
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Failed to prepare the workflow configuration",
      });
      setProcessingSubmit(false);
    }
  };

  // Render the appropriate form based on workflow type
  if (workflowData.workflow_type === "ECB") {
    return (
      <Form {...ecbForm}>
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <FormField
              control={ecbForm.control}
              name="table"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>ECB Table</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="e.g., STS"
                        {...field}
                      />
                      {isFetchingEcb && <Loader2 className="animate-spin h-4 w-4" />}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the ECB data table code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={ecbForm.control}
              name="parameters"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Parameters</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., M.I9.N.ECPE.CFOOD0.3.000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the query parameters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {dataStructure && (
            <Card className="p-4 bg-muted rounded-md">
              <h3 className="font-semibold mb-2">Data Source: {dataStructure.title || "ECB Data"}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Frequency: {dataStructure.frequency || "Unknown"}</div>
                <div>Periods: {dataStructure.periods?.length || 0}</div>
                {dataStructure.data_sample && dataStructure.data_sample.length > 0 && (
                  <div className="col-span-2">
                    <h4 className="text-xs font-medium mb-1">Sample Data:</h4>
                    <div className="text-xs overflow-auto max-h-20">
                      {dataStructure.data_sample.map((item, i: number) => {
                        // Handle both DataSample and DataSampleItem types
                        const isDataSample = 'period' in item;
                        return (
                          <div key={i} className="flex justify-between">
                            <span>{isDataSample ? (item as DataSample).period : 'Complex structure'}</span>
                            <span>{item.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <FormField
            control={ecbForm.control}
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
              onClick={handleEcbSubmit}
              disabled={processingSubmit || !dataStructure}
            >
              {processingSubmit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </Form>
    );
  } else if (workflowData.workflow_type === "EUROSTAT") {
    return (
      <EurostatConfigForm
        workflowData={workflowData}
        onNext={onNext}
        onBack={onBack}
        isEditing={isEditing}
      />
    );
  }

  // Default to CyStat form
  return (
    <Form {...cystatForm}>
      <div className="space-y-6">
        <FormField
          control={cystatForm.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CyStat API URL</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://example.cystat.gov.cy/api/..."
                    {...field}
                  />
                  {isFetchingCystat && <Loader2 className="animate-spin h-4 w-4" />}
                </div>
              </FormControl>
              <FormDescription>
                Enter the URL of the CyStat API endpoint
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {dataStructure && (
          <Card className="p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Data Source: {dataStructure.title}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Variables: {dataStructure.variables?.length || 0}</div>
              <div>Time format: {dataStructure.time_code || "Unknown"}</div>
              <div>Total periods: {dataStructure.periods?.length || 0}</div>
            </div>
          </Card>
        )}

        <FormField
          control={cystatForm.control}
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

        {dataStructure?.periods && dataStructure.periods.length > 0 && (
          <FormField
            control={cystatForm.control}
            name="start_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Period</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || (dataStructure.periods?.[0] ?? '')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dataStructure.periods?.map((period: string) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    )) ?? []}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the earliest period to fetch data from
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
            onClick={handleCystatSubmit}
            disabled={isConfiguringCystat || processingSubmit || !dataStructure}
          >
            {isConfiguringCystat || processingSubmit ? (
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
