"use client";

import { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Steps, Step } from "@/components/ui/steps";
import WorkflowSetupForm from "./workflow-setup-form";
import WorkflowConfigForm from "./workflow-config-form";
import WorkflowIndicatorMapping from "./workflow-indicator-mapping";
import EurostatIndicatorMapping from "./eurostat-indicator-mapping";
import { PlusCircle } from "lucide-react";
import { useGetWorkflowDetailsQuery } from "@/redux/services/workflowApiSlice";
import EcbIndicatorSelection from "./ecb-indicator-selection";
import {
  WorkflowType,
  WorkflowStep,
  WorkflowData,
  WorkflowDialogProps,
  WorkflowDialogRef
} from "@/types/workflow";

const WorkflowDialog = forwardRef<WorkflowDialogRef, WorkflowDialogProps>(({ initialWorkflow, onWorkflowChange }, ref) => {
  const router = useRouter();

  // State
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WorkflowStep>("setup");
  const [isEditing, setIsEditing] = useState(false);
  const [editWorkflowId, setEditWorkflowId] = useState<number | undefined>(undefined);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    workflow_type: "CYSTAT",
    schedule_cron: "0 0 1 * *",
    is_active: true,
  });

  // Add state to track original ID when going back
  const [originalId, setOriginalId] = useState<number | undefined>(undefined);

  // Fetch workflow details when editing
  const { data: workflowDetails, isLoading: isLoadingDetails } =
    useGetWorkflowDetailsQuery(editWorkflowId, {
      skip: !editWorkflowId || !isEditing,
    });

  // Initialize editing mode when a workflow is provided
  useEffect(() => {
    if (initialWorkflow && initialWorkflow.id) {
      setEditWorkflowId(initialWorkflow.id);
      setIsEditing(true);
    } else {
      setEditWorkflowId(undefined);
      setIsEditing(false);
    }
  }, [initialWorkflow]);

  // When workflow details are loaded, populate the form
  useEffect(() => {
    if (workflowDetails && isEditing) {
      console.log("Received workflow details:", workflowDetails);

      // Set initial workflow data based on type
      if (workflowDetails.workflow_type === "CYSTAT") {
        setWorkflowData({
          id: workflowDetails.id,
          name: workflowDetails.name,
          workflow_type: workflowDetails.workflow_type as WorkflowType,
          schedule_cron: workflowDetails.schedule_cron,
          is_active: workflowDetails.is_active,
          url: workflowDetails.url,
          frequency: workflowDetails.frequency,
          start_period: workflowDetails.start_period,
          cystat_request_id: workflowDetails.cystat_request_id,
          data_structure: workflowDetails.data_structure,
          indicators: workflowDetails.indicators || [],
          indicator_mappings: workflowDetails.indicator_mappings || []
        });
      } else if (workflowDetails.workflow_type === "ECB") {
        // Log ECB workflow details to help debug
        console.log("ECB workflow details:", {
          indicator_id: workflowDetails.indicator_id,
          indicator: workflowDetails.indicator
        });

        setWorkflowData({
          id: workflowDetails.id,
          name: workflowDetails.name,
          workflow_type: workflowDetails.workflow_type as WorkflowType,
          schedule_cron: workflowDetails.schedule_cron,
          is_active: workflowDetails.is_active,
          table: workflowDetails.table,
          parameters: workflowDetails.parameters,
          frequency: workflowDetails.frequency,
          ecb_request_id: workflowDetails.ecb_request_id,
          indicator_id: workflowDetails.indicator_id,
          indicator: workflowDetails.indicator,
          selectedIndicatorId: workflowDetails.indicator_id, // Explicitly set this for ECB workflows
          data_structure: workflowDetails.data_structure
        });
      } else if (workflowDetails.workflow_type === "EUROSTAT") {
        // Handle Eurostat workflow type
        console.log("Eurostat workflow details:", workflowDetails);

        setWorkflowData({
          id: workflowDetails.id,
          name: workflowDetails.name,
          workflow_type: workflowDetails.workflow_type as WorkflowType,
          schedule_cron: workflowDetails.schedule_cron,
          is_active: workflowDetails.is_active,
          url: workflowDetails.url,
          frequency: workflowDetails.frequency,
          start_period: workflowDetails.start_period,
          eurostat_request_id: workflowDetails.eurostat_request_id,
          data_structure: workflowDetails.data_structure,
          indicators: workflowDetails.indicators || [],
          indicator_mappings: workflowDetails.indicator_mappings || []
        });
      }
      setOriginalId(workflowDetails.id);
    }
  }, [workflowDetails, isEditing]);

  // Expose the openDialog method via ref
  useImperativeHandle(ref, () => ({
    openDialog: (workflow?: WorkflowData) => {
      if (workflow && workflow.id) {
        setEditWorkflowId(workflow.id);
        setIsEditing(true);
      } else {
        resetWorkflowData();
        setIsEditing(false);
      }
      setOpen(true);
    }
  }));

  const stepIndex: Record<WorkflowStep, number> = {
    "setup": 0,
    "config": 1,
    "mapping": 2
  };

  const resetWorkflowData = () => {
    setWorkflowData({
      workflow_type: "CYSTAT",
      schedule_cron: "0 0 1 * *",
      is_active: true,
    });
    setOriginalId(undefined);
    setEditWorkflowId(undefined);
    setIsEditing(false);
    setStep("setup");
  };

  // Enhanced goToNextStep to handle ID preservation
  const goToNextStep = useCallback((newStep: WorkflowStep, data: Partial<WorkflowData>) => {
    console.log(`Moving to ${newStep} with data:`, data);

    // When moving forward from setup to config, store the original ID if it exists
    if (step === "setup" && newStep === "config" && data.id) {
      setOriginalId(data.id);
    }

    setWorkflowData(prev => {
      // Always preserve the IDs when going back
      if (newStep === "setup" && originalId) {
        return {
          ...prev,
          ...data,
          id: originalId,
          // Preserve request IDs based on workflow type
          cystat_request_id: data.cystat_request_id || prev.cystat_request_id,
          ecb_request_id: data.ecb_request_id || prev.ecb_request_id,
          eurostat_request_id: data.eurostat_request_id || prev.eurostat_request_id
        };
      }
      return { ...prev, ...data };
    });

    setStep(newStep);
  }, [step, originalId]);

  const handleComplete = useCallback(() => {
    toast({
      title: isEditing ? "Workflow Updated" : "Workflow Created",
      description: `Your workflow has been ${isEditing ? "updated" : "set up"} successfully!`,
    });

    // Reset all state
    setOpen(false);
    resetWorkflowData();
    if (onWorkflowChange) onWorkflowChange();

    router.refresh();
  }, [router, isEditing, onWorkflowChange]);

  // Handle dialog open/close with ID reset
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && step !== "setup") {
      // In edit mode, only confirm if we're in the middle of the process (not on setup screen)
      if (isEditing) {
        const confirmClose = window.confirm("Are you sure you want to close? Your workflow changes will be lost.");
        if (!confirmClose) {
          return;
        }
      } else if (!isEditing) {
        // In create mode, always confirm
        const confirmClose = window.confirm("Are you sure you want to close? Your workflow progress will be lost.");
        if (!confirmClose) {
          return;
        }
      }
    }

    if (!newOpen) {
      // Only reset if this isn't an edit or we explicitly confirmed losing changes
      if (!isEditing) {
        resetWorkflowData();
      } else {
        // For edit mode, just reset to step 1 but keep the workflow data
        setStep("setup");
      }

      if (onWorkflowChange) onWorkflowChange();
    }

    setOpen(newOpen);
  }, [step, onWorkflowChange, isEditing]);

  // Render forms based on current step
  const renderStepContent = () => {
    if (isEditing && isLoadingDetails) {
      return <div className="p-8 text-center">Loading workflow details...</div>;
    }

    switch (step) {
      case "setup":
        return (
          <WorkflowSetupForm
            initialData={workflowData}
            onNext={(data) => goToNextStep("config", data)}
            isEditing={isEditing}
          />
        );
      case "config":
        return (
          <WorkflowConfigForm
            workflowData={workflowData}
            onNext={(data) => goToNextStep("mapping", data)}
            onBack={() => goToNextStep("setup", workflowData)}  // Pass workflowData to preserve all IDs
            isEditing={isEditing}
          />
        );
      case "mapping":
        return (
          <>
            {workflowData.workflow_type === "ECB" && (
              <EcbIndicatorSelection
                workflowData={workflowData}
                selectedIndicatorId={workflowData.indicator_id} // Use indicator_id instead of selectedIndicatorId
                onSelectionComplete={(updatedWorkflowData) => {
                  setWorkflowData(updatedWorkflowData);
                  handleComplete();
                }}
                onCancel={() => goToNextStep("config", workflowData)}
                isEditing={isEditing}
              />
            )}
            {workflowData.workflow_type === "EUROSTAT" && (
              <EurostatIndicatorMapping
                workflowData={workflowData}
                onComplete={handleComplete}
                onBack={() => goToNextStep("config", workflowData)}
                isEditing={isEditing}
              />
            )}
            {workflowData.workflow_type === "CYSTAT" && (
              <WorkflowIndicatorMapping
                workflowData={workflowData}
                onComplete={handleComplete}
                onBack={() => goToNextStep("config", workflowData)}
                isEditing={isEditing}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  const currentStepIndex = stepIndex[step];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90%] sm:max-w-[600px] md:max-w-[700px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {isEditing ? "Edit Workflow" : "Create New Workflow"}
            {step === "config" && " - Configure Data Source"}
            {step === "mapping" && " - Map Indicators"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup" && (isEditing ? "Update your workflow settings" : "Set up a new data import workflow")}
            {step === "config" && "Configure the data source connection"}
            {step === "mapping" && "Map indicators to the data source"}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Steps value={currentStepIndex} className="mb-8">
            <Step value={0} data-value={currentStepIndex} label="Setup" description="Basic configuration" />
            <Step value={1} data-value={currentStepIndex} label="Data Source" description="Connect to source" />
            <Step value={2} data-value={currentStepIndex} label="Indicators" description="Map data fields" />
          </Steps>

          <div className="mt-6">
            {renderStepContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

WorkflowDialog.displayName = "WorkflowDialog";

// Re-export the WorkflowData type for backward compatibility
export type { WorkflowData, WorkflowType, WorkflowStep } from "@/types/workflow";

export default WorkflowDialog;
