"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAllIndicatorsQuery } from "@/redux/services/indicatorsApiSlice";
import { useConfigureEcbWorkflowMutation } from "@/redux/services/workflowApiSlice";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isFrequencyCompatible, getFrequencyFilterExplanation } from "@/utils/frequency-utils";
import {
  EcbIndicatorSelectionProps,
  Indicator as BaseIndicator,
  IndicatorsResponse,
  EcbConfigPayload,
  WorkflowData
} from "@/types/workflow";

// Extended Indicator type to include permission properties
interface Indicator extends BaseIndicator {
  edit?: boolean;
  delete?: boolean;
  is_favourite?: boolean;
  access_level?: string;
}

export default function EcbIndicatorSelection({
  workflowData,
  selectedIndicatorId,
  onSelectionComplete,
  onCancel,
  isEditing = false
}: EcbIndicatorSelectionProps) {
  // Use the getAllIndicators query to get indicators with proper type and permissions data
  const { data: indicatorsResponse, isLoading } = useGetAllIndicatorsQuery(undefined, {
    // Properly type the response data
    selectFromResult: ({ data, isLoading }) => ({
      data: data as IndicatorsResponse | undefined,
      isLoading
    }),
  });
  const [configureEcbWorkflow, { isLoading: isConfiguring }] = useConfigureEcbWorkflowMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndicator, setSelectedIndicator] = useState<number | undefined>(undefined);
  const [processingSubmit, setProcessingSubmit] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);

  // Get the workflow frequency for filtering
  const workflowFrequency = workflowData.frequency;

  // Set initial selection when data is loaded - improved for editing
  useEffect(() => {
    if (!initialLoadComplete && indicatorsResponse?.indicators) {
      // When editing, prioritize the workflowData.indicator_id first, then fall back to selectedIndicatorId
      const indicatorId = isEditing
        ? (workflowData.indicator_id || selectedIndicatorId)
        : selectedIndicatorId;

      if (indicatorId) {
        console.log(`Setting initial indicator selection to ${indicatorId} for ${isEditing ? 'edit' : 'new'} mode`);
        setSelectedIndicator(indicatorId);

        // If editing, scroll to the selected indicator after a short delay
        if (isEditing) {
          setTimeout(() => {
            const element = document.getElementById(`indicator-${indicatorId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      }

      setInitialLoadComplete(true);
      setTotalCount(indicatorsResponse.indicators.length);
    }
  }, [indicatorsResponse, isEditing, workflowData, selectedIndicatorId, initialLoadComplete]);

  // Get and memoize indicators from the response
  const indicators = useMemo((): Indicator[] => {
    return (indicatorsResponse?.indicators as Indicator[]) || [];
  }, [indicatorsResponse]);

  // Filter indicators based on search term, frequency, and edit permissions - memoize this
  const filteredIndicators = useMemo(() => {
    let filtered = [...indicators];

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        indicator =>
          indicator.name.toLowerCase().includes(lowerSearchTerm) ||
          (indicator.code && indicator.code.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Filter by frequency
    if (workflowFrequency) {
      filtered = filtered.filter(indicator =>
        isFrequencyCompatible(workflowFrequency, indicator.frequency)
      );
    }

    // Filter by edit permissions - only show indicators that the user has permission to edit
    // The API returns an 'edit' property directly in the indicator object
    filtered = filtered.filter(indicator =>
      indicator.edit === true
    );

    // Update filtered count
    setFilteredCount(filtered.length);

    return filtered;
  }, [indicators, searchTerm, workflowFrequency]);

  // Group indicators by category - memoize this too
  const indicatorGroups = useMemo(() => {
    const groups: Record<string, Indicator[]> = {};

    filteredIndicators.forEach(indicator => {
      const category = indicator.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(indicator);
    });

    return groups;
  }, [filteredIndicators]);

  // Handle indicator selection
  const handleSelectIndicator = (indicatorId: number) => {
    setSelectedIndicator(indicatorId);
  };

  // Handle form submission - this will now configure the ECB workflow
  const handleSubmit = async () => {
    if (!selectedIndicator) return;

    // Get the selected indicator object
    const indicator = indicators.find(
      (ind) => ind.id === selectedIndicator
    );

    if (!indicator) {
      toast({
        variant: "destructive",
        title: "Selection Error",
        description: "The selected indicator could not be found. Please try again."
      });
      return;
    }

    // Check frequency compatibility before submitting
    if (workflowFrequency && !isFrequencyCompatible(workflowFrequency, indicator.frequency)) {
      toast({
        variant: "destructive",
        title: "Frequency Mismatch",
        description: `The selected indicator (${indicator.frequency}) does not match the workflow frequency (${workflowFrequency}).`
      });
      return;
    }

    // Prevent double submission
    if (processingSubmit || isConfiguring) {
      return;
    }

    setProcessingSubmit(true);

    try {
      // Now we send the complete ECB configuration including the selected indicator
      const configData: EcbConfigPayload = {
        workflow_id: workflowData.id!,
        table: workflowData.table || "",
        parameters: workflowData.parameters || "",
        frequency: workflowData.frequency || "",
        indicator_id: indicator.id,
        ecb_request_id: workflowData.ecb_request_id, // Pass for updates if available
        is_update: isEditing
      };

      console.log(`${isEditing ? "Updating" : "Configuring"} ECB workflow:`, configData);

      const response = await configureEcbWorkflow(configData).unwrap();

      console.log("ECB config response:", response);

      // Prepare the updated workflow data with the selected indicator and response data
      const updatedWorkflowData: WorkflowData = {
        ...workflowData,
        indicator: indicator,
        indicator_id: indicator.id, // Ensure both fields are set
        selectedIndicatorId: indicator.id,
        ecb_request_id: response.ecb_request_id || workflowData.ecb_request_id
      };

      toast({
        title: isEditing ? "ECB Workflow Updated" : "ECB Workflow Configured",
        description: `${indicator.name} has been ${isEditing ? "updated as" : "selected as"} the target indicator.`
      });

      // Small delay before transition
      setTimeout(() => {
        onSelectionComplete(updatedWorkflowData);
        setProcessingSubmit(false);
      }, 100);
    } catch (error: unknown) {
      console.error(`Error ${isEditing ? "updating" : "configuring"} ECB workflow:`, error);
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error.data as { error?: string })
        : { error: `Failed to ${isEditing ? "update" : "configure"} the ECB workflow` };

      toast({
        variant: "destructive",
        title: isEditing ? "Update Error" : "Configuration Error",
        description: errorData.error || `Failed to ${isEditing ? "update" : "configure"} the ECB workflow`,
      });
      setProcessingSubmit(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const frequencyFilterActive = !!workflowFrequency;

  // If we're editing and have a selected indicator, show a notice at the top
  const selectedIndicatorData = selectedIndicator
    ? indicators.find((ind) => ind.id === selectedIndicator)
    : null;

  return (

    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">
          {isEditing ? "Edit ECB Target Indicator" : "Select ECB Target Indicator"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose which indicator will receive data from the ECB source
        </p>
      </div>

      {isEditing && selectedIndicatorData && (
        <div className="p-4 bg-secondary/10 rounded-md border border-secondary/30">
          <p className="text-sm font-medium">
            Currently mapped to: <span className="text-secondary">{selectedIndicatorData.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">({selectedIndicatorData.code})</span>
          </p>
        </div>
      )}

      {frequencyFilterActive && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Frequency filter active</AlertTitle>
          <AlertDescription>
            {getFrequencyFilterExplanation(workflowFrequency)}.
            Showing {filteredCount} of {totalCount} indicators.
          </AlertDescription>
        </Alert>
      )}

      <Alert variant="default" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Permission filter active</AlertTitle>
        <AlertDescription>
          Only showing indicators that you have permission to edit. Edit permission is required to link indicators with workflows.
        </AlertDescription>
      </Alert>


      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search indicators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {Object.entries(indicatorGroups).length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            {frequencyFilterActive
              ? `No indicators with ${workflowFrequency} frequency match your search criteria`
              : "No indicators match your search criteria"}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(indicatorGroups).map(([category, categoryIndicators]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryIndicators.map(indicator => (
                    <Card
                      key={indicator.id}
                      id={`indicator-${indicator.id}`}
                      className={cn(
                        "cursor-pointer overflow-hidden transition-colors",
                        selectedIndicator === indicator.id
                          ? "border-secondary bg-secondary/5"
                          : "hover:border-muted-foreground/30"
                      )}
                      onClick={() => handleSelectIndicator(indicator.id)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{indicator.name}</CardTitle>
                          <Checkbox
                            checked={selectedIndicator === indicator.id}
                            onCheckedChange={() => handleSelectIndicator(indicator.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <CardDescription className="text-xs">
                          Code: {indicator.code}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    frequencyFilterActive &&
                                    isFrequencyCompatible(workflowFrequency, indicator.frequency) &&
                                    "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                  )}
                                >
                                  {indicator.frequency}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                Data frequency
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {indicator.base_year && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs">
                                    Base {indicator.base_year}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Base year
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {indicator.unit && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs">
                                    {indicator.unit}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Measurement unit
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedIndicator || processingSubmit || isConfiguring}
        >
          {processingSubmit || isConfiguring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Configuring..."}
            </>
          ) : (
            isEditing ? "Update Indicator Mapping" : "Select & Configure"
          )}
        </Button>
      </div>
    </div>
  );
}
