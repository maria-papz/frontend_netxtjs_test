/**
 * Core Workflow Types
 */
export type WorkflowType = "CYSTAT" | "ECB" | "EUROSTAT";
export type WorkflowStep = "setup" | "config" | "mapping";

/**
 * Data Structure Types
 */
export interface DataVariable {
  code: string;
  text?: string;
  valueTexts?: string[];
  values?: (string | number)[]; // Array of actual values that correspond to valueTexts
}

export interface Category {
  id: string;
  label: string;
}

export interface Dimension {
  id: string;
  label?: string;
  categories: Category[];
}

export interface DataSampleDimension {
  id: string;
  label?: string;
}

export interface DataSampleItem {
  dimensions?: {
    time?: DataSampleDimension;
    [key: string]: DataSampleDimension | undefined;
  };
  value: string;
}

export interface DataSample {
  period: string;
  value: string;
}

export interface DataStructure {
  title?: string;
  variables?: DataVariable[];
  dimensions?: Dimension[];
  periods?: string[];
  time_code?: string;
  frequency?: string;
  data_sample?: DataSampleItem[] | DataSample[];
  dimension_labels?: Record<string, string>;
}

/**
 * Indicator Types
 */
export interface Indicator {
  id: number;
  name: string;
  code?: string;
  category?: string;
  frequency?: string;
  base_year?: string;
  unit?: string;
  description?: string;
}

export interface IndicatorMapping {
  indicator_id: number;
  indicator_name?: string;
  key_indices?: Record<string, string>;
  dimension_values?: Record<string, string>;
}

export interface FormIndicator {
  id: number;
  name: string;
  mappings: Record<string, string>;
}

export interface VariableOption {
  value: string;
  label: string;
  actualValue?: string; // The actual value to be sent to the API
}

/**
 * Mapping and Configuration Payloads
 */
export interface CodeMapping {
  code: string;
  value: string;
}

export interface DimensionMapping {
  dimension_id: string;
  value: string;
}

export interface IndicatorMappingPayload {
  indicator_id: number;
  code_mappings?: CodeMapping[];
  dimension_mappings?: DimensionMapping[];
}

export interface CystatConfigPayload {
  workflow_id: number;
  url: string;
  frequency: string;
  start_period?: string;
  cystat_request_id?: number;
}

export interface EcbConfigPayload {
  workflow_id: number;
  table: string;
  parameters: string;
  frequency: string;
  indicator_id: number;
  ecb_request_id?: number;
  is_update: boolean;
}

export interface EurostatConfigPayload {
  workflow_id: number;
  url: string;
  frequency: string;
  eurostat_request_id?: number;
}

/**
 * Form Value Types
 */
export interface CystatFormValues {
  url: string;
  frequency: string;
  start_period?: string;
}

export interface EcbFormValues {
  table: string;
  parameters: string;
  frequency: string;
}

export interface EurostatFormValues {
  url: string;
  frequency: string;
}

/**
 * Main Workflow Data Interface
 */
export interface WorkflowData {
  id?: number;
  name?: string;
  workflow_type: WorkflowType;
  schedule_cron: string;
  is_active: boolean;

  // Common fields
  data_structure?: DataStructure;

  // CyStat specific
  url?: string;
  frequency?: string;
  start_period?: string;
  cystat_request_id?: number;
  indicators?: Indicator[];
  indicator_mappings?: IndicatorMapping[];

  // ECB specific
  table?: string;
  parameters?: string;
  ecb_request_id?: number;
  indicator_id?: number;
  indicator?: Indicator;
  selectedIndicatorId?: number;

  // Eurostat specific
  dataset_code?: string;
  eurostat_request_id?: number;
}

/**
 * Component Props Types
 */
export interface WorkflowDialogProps {
  initialWorkflow?: WorkflowData;
  onWorkflowChange?: (workflow?: WorkflowData) => void;
}

export interface WorkflowDialogRef {
  openDialog: (workflow?: WorkflowData) => void;
}

export interface WorkflowConfigFormProps {
  workflowData: WorkflowData;
  onNext: (data: Partial<WorkflowData>) => void;
  onBack: () => void;
  isEditing?: boolean;
}

export interface IndicatorMappingFormProps {
  workflowData: WorkflowData;
  onComplete: (data?: Partial<WorkflowData>) => void;
  onBack: () => void;
  isEditing?: boolean;
}

export interface EcbIndicatorSelectionProps {
  workflowData: WorkflowData;
  selectedIndicatorId?: number;
  onSelectionComplete: (updatedWorkflowData: WorkflowData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export interface EurostatConfigFormProps {
  workflowData: WorkflowData;
  onNext: (data: Partial<WorkflowData>) => void;
  onBack: () => void;
  isEditing?: boolean;
}

export interface EurostatIndicatorMappingProps {
  workflowData: WorkflowData;
  onComplete: (data?: Partial<WorkflowData>) => void;
  onBack: () => void;
  isEditing?: boolean;
}

/**
 * Workflow History Types
 */
export interface WorkflowHistoryDialogProps {
  workflowId: number;
  workflowName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface StatusBadgeProps {
  variant: "default" | "destructive" | "outline";
  className: string;
  icon: React.ReactNode;
  label: string;
}

export interface DetailItem {
  period: string;
  old_value: string;
  new_value: string;
}

export interface ActionLog {
  id: number;
  indicator_id: string;
  indicator_code?: string;
  indicator_name: string;
  action_type: string;
  timestamp: string;
  details: DetailItem[];
}

export interface WorkflowRun {
  id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  success: boolean | null;
  error_message: string | null;
  action_logs: ActionLog[];
}

/**
 * Workflow List Types
 */
export interface WorkflowItem {
  id: number;
  name: string;
  workflow_type: string;
  schedule_cron: string;
  is_active: boolean;
  next_run: string | null;
  last_run: string | null;
  last_run_success: boolean | null;
  indicator_codes?: string[];
}

export interface WorkflowHistoryItem {
  id: number;
  name: string;
}

export interface IndicatorsResponse {
  indicators: Indicator[];
}
