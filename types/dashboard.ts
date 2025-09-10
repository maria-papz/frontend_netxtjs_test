// Activity Types
export interface ActivityItem {
  user: string;
  action: string;
  indicator: string;
  timestamp: string;
  details?: any[];
}

// Favorites Activity Types
export interface DataChangeDetail {
  old_value: string | number;
  new_value: string | number;
}

export interface FieldChange {
  old: string | null;
  new: string | null;
}

export interface DataActivityItem {
  indicator: string;
  indicator_id: string;
  type: 'UPDATED' | 'CREATED' | 'CHANGED FORMULA' | 'CREATED FORMULA';
  timestamp: string;
  period?: string;
  percentage_change?: number;
  details?: DataChangeDetail[];
  formula?: string;
  current_period?: string;
  current_value?: string | number;
  previous_period?: string;
  previous_value?: string | number;
}

export interface InfoActivityItem {
  indicator: string;
  indicator_id: string;
  type: 'EDITED' | 'CREATED';
  timestamp: string;
  details: {
    [key: string]: FieldChange;
  } | {
    code?: string;
  };
}

export interface FavoritesActivityData {
  data_changes: DataActivityItem[];
  info: InfoActivityItem[];
}

// User Activity Types
export interface DataUpdateDetails {
  period: string;
  old_value: string | number | null;
  new_value: string | number;
}

export interface FormulaUpdateDetails {
  old_formula: string | null;
  new_formula: string;
  base_indicators?: string[];
}

export interface IndicatorCreateDetails {
  name: string;
  code: string;
}

export interface IndicatorEditDetails {
  [key: string]: {
    old: string | number | boolean | null;
    new: string | number | boolean;
  };
}

export type ActionDetails = DataUpdateDetails[] | FormulaUpdateDetails | IndicatorCreateDetails | IndicatorEditDetails;

export interface UserAction {
  action_type: 'DATA_UPDATE' | 'FORMULA_UPDATE' | 'INDICATOR_CREATE' | 'INDICATOR_EDIT' | 'INDICATOR_DELETE';
  timestamp: string;
  details: ActionDetails;
  points_changed?: number;
}

export interface IndicatorActivity {
  indicator_id: string;
  indicator_name: string;
  indicator_code: string;
  actions: UserAction[];
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserActivityData {
  user: User;
  activity: IndicatorActivity[];
}

// Search Table Types
export interface FilterItem {
  id: string;
  label: string;
}

export interface FilterGroup {
  group: string;
  items: FilterItem[];
}

export interface IndicatorMetadata {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  category?: string[];
  base_year?: string[];
  frequency?: string[];
  source?: string[];
  region?: string[];
  country?: string[];
  unit?: string[];
  seasonally_adjusted?: boolean;
  custom_indicator?: boolean;
  current_prices?: boolean;
  is_favourite?: boolean;
}

export interface TableMetadata {
  id: string;
  indicator_code?: string[];
  indicator_category?: string[];
  indicator_base_year?: string[];
  indicator_frequency?: string[];
  indicator_source?: string[];
  indicator_regions?: string[];
  indicator_country?: string[];
  indicator_unit?: string[];
  is_favourite?: boolean;
}

export interface IndicatorsMetadataSet {
  id: string[];
  name: string[];
  regions: string[];
  country: string[];
  code: string[];
  base_year: number[];
  description: string;
  source: string;
  category: string;
  is_seasonally_adjusted: boolean;
  frequency: string;
  other_frequency?: string;
  is_custom: boolean;
  currentPrices: number;
}

export interface IndicatorsResponse {
  indicators: IndicatorSearchResult[];
  metadataset: IndicatorsMetadataSet;
}

export interface IndicatorSearchResult {
  id: string;
  name: string;
  code: string;
  description?: string;
  base_year?: string;
  frequency?: string;
  source?: string;
  region?: string;
  country?: string;
  is_seasonally_adjusted?: boolean;
  is_custom?: boolean;
  current_prices?: boolean;
  is_favourite?: boolean;
  [key: string]: unknown; // For additional properties
}

export interface MetadataSet {
  code?: string[];
  category?: string[];
  base_year?: string[];
  frequency?: string[];
  source?: string[];
  region?: string[];
  country?: string[];
  unit?: string[];

  // For tables
  indicator_category?: string[];
  indicator_base_year?: string[];
  indicator_frequency?: string[];
  indicator_source?: string[];
  indicator_regions?: string[];
  indicator_country?: string[];
  indicator_unit?: string[];
}

export interface AdvancedFilterResult {
  [frequency: string]: {
    id: string;
    code: string;
    name: string;
  }[];
}

export interface FilterSelections {
  [key: string]: string[];
}

/**
 * Type for representing a row of table data
 * Each row has a period and dynamic indicator columns
 */
export interface TableRowData {
  period: string;
  [key: string]: string | number | null;
}

// Indicator specific types for use in forms
export type LocationType = "country" | "region";

export type FrequencyType =
  | "MINUTE"
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "TRIANNUAL"
  | "SEMIANNUAL"
  | "ANNUAL"
  | "CUSTOM";

export type AccessLevelType =
  | "public"
  | "unrestricted"
  | "organization"
  | "restricted"
  | "org_full_public";

// Dictionaries for mapping between values and display names
export const FrequencyDictionary: Record<FrequencyType, string> = {
  "MINUTE": "Per Minute",
  "HOURLY": "Hourly",
  "DAILY": "Daily",
  "WEEKLY": "Weekly",
  "BIWEEKLY": "Biweekly",
  "MONTHLY": "Monthly",
  "BIMONTHLY": "Every 2 Months",
  "QUARTERLY": "Quarterly",
  "TRIANNUAL": "Every 4 Months",
  "SEMIANNUAL": "Semiannual / Biannual",
  "ANNUAL": "Annual",
  "CUSTOM": "Custom / Other"
};

export const AccessLevelDictionary: Record<AccessLevelType, string> = {
  "public": "Public Viewing",
  "unrestricted": "Unrestricted Access",
  "organization": "Organization Members",
  "restricted": "Restricted Access",
  "org_full_public": "Organization Full Public"
};

// Helper functions to convert between values and display names
export const getFrequencyDisplayName = (frequency: FrequencyType | string): string => {
  return FrequencyDictionary[frequency as FrequencyType] || frequency;
};

export const getFrequencyByDisplayName = (displayName: string): FrequencyType | undefined => {
  const entry = Object.entries(FrequencyDictionary).find(([, value]) => value === displayName);
  return entry ? entry[0] as FrequencyType : undefined;
};

export const getAccessLevelDisplayName = (level: AccessLevelType | string): string => {
  return AccessLevelDictionary[level as AccessLevelType] || level;
};

export const getAccessLevelByDisplayName = (displayName: string): AccessLevelType | undefined => {
  const entry = Object.entries(AccessLevelDictionary).find(([, value]) => value === displayName);
  return entry ? entry[0] as AccessLevelType : undefined;
};

// Types for indicator data page components
export interface IndicatorDataMetadata {
  id: string;
  unit?: string;
  name: string;
  region: string;
  country: string;
  code: string;
  base_year?: number;
  description: string;
  source: string;
  category: string;
  is_seasonally_adjusted: boolean;
  frequency: string;
  is_custom: boolean;
  currentPrices: boolean;
  access_level: string;
  edit?: boolean;
  delete?: boolean;
  can_edit?: boolean;
}

export interface IndicatorValue {
  period?: string;
  value?: number;
  id?: string;
}

export interface GridRowData {
  rows: IndicatorValue[];
  headerRow: HeaderRow;
}

export interface HeaderRow {
  rowId: string;
  cells: HeaderCell[];
}

export interface HeaderCell {
  type: string;
  text: string;
}

// Types for indicator grid in custom grid components
export interface IndicatorCellValue {
  id?: string;
  value?: number | string;
}

export interface GridRow {
  period: string;
  [code: string]: IndicatorCellValue | string;
}

export interface DataTableColumn<T> {
  accessorKey: keyof T | string;
  header: string | ((props: { column: { toggleSorting: (state: boolean) => void; getIsSorted: () => string | false } }) => React.ReactNode);
  cell?: (props: { row: { getValue: (key: string) => unknown } }) => React.ReactNode;
}

export interface HistoryEntry {
  period: string;
  value: string;
  user?: string | null;
}

export interface History {
  [timestamp: string]: HistoryEntry[];
}

export interface DataUpdateAction {
  action_type: string;
  history: History;
}

export interface SourceData {
  url?: string;
  table?: string;
  parameters?: string;
  frequency?: string;
  start_period?: string;
}

export interface WorkflowInfo {
  id: number;
  name: string;
  workflow_type: string;
  is_active: boolean;
  schedule_cron: string;
  next_run: string | null;
  last_run: string | null;
  last_run_success: boolean | null;
  source_data?: SourceData;
  user_url?: string;
}

export interface BasisIndicator {
  id: string;
  name: string;
  description?: string;
  is_seasonally_adjusted: boolean;
  unit?: string;
  source?: string;
  category?: string;
  frequency: string;
  region?: string;
  country?: string;
  base_year?: number;
  currentPrices: boolean;
}

export interface BasisIndicatorRecord {
  [code: string]: BasisIndicator;
}

export interface BasisDataRecord {
  [code: string]: IndicatorValue[];
}

export interface CustomIndicatorData {
  indicator: IndicatorDataMetadata;
  data: IndicatorValue[];
  basis_indicators: BasisIndicatorRecord;
  basis_data: BasisDataRecord;
  formula: string;
}

export interface StandardIndicatorData {
  indicator: IndicatorDataMetadata;
  data: IndicatorValue[];
}

export type IndicatorApiResponse = CustomIndicatorData | StandardIndicatorData;

export interface BasisMetadataRow {
  name: string;
  [code: string]: string;
}

// API Response Types
export interface IndicatorHistoryItem {
  action_type: string;
  details: HistoryDetail[];
  timestamp: string;
}

export interface HistoryDetail {
  action_type: "DATA_UPDATE" | "FORMULA_UPDATE" | "INDICATOR_EDIT" | "INDICATOR_CREATE" | "INDICATOR_DELETE";
  [key: string]: unknown;
}

export function isCustomIndicatorResponse(response: IndicatorApiResponse): response is CustomIndicatorData {
  return response && 'basis_indicators' in response && 'formula' in response;
}

// Category type definition for use in forms and API interactions
export interface Category {
  id: number;
  name: string;
  description?: string;
}

// Region type definition for use in forms and API interactions
export interface Region {
  id: number;
  name: string;
  description?: string;
}

// Indicator item type for use in forms and tables
export interface IndicatorItem {
  id: number;
  name: string;
  code: string;
}

// Type for indicators grouped by frequency
export interface FrequencyGroupedIndicators {
  [frequency: string]: IndicatorItem[];
}

// Table Search and API interfaces for use across the application
export interface TableSearchResult extends TableMetadata {
  name: string;
  description: string;
  indicators: string[];
}

// Indicator Search Result used in indicators table
export interface IndicatorTableSearchResult extends Omit<IndicatorMetadata, 'category' | 'base_year' | 'frequency' | 'source' | 'region' | 'country' | 'unit'> {
  indicators: string[];
  edit?: boolean;
  delete?: boolean;
  code?: string;
  category?: string;
  base_year?: string;
  frequency?: string;
  source?: string;
  region?: string;
  country?: string;
  unit?: string;
}

// Define the structure of the tables API response
export interface TablesApiResponse {
  table: TableSearchResult[];
  metadata: IndicatorMetadata[];
  metadata_set: MetadataSet;
}

// Interface for table data state management
export interface TableData {
  data: TableSearchResult[];
  metadata: IndicatorMetadata[];
  metadataset: MetadataSet;
}
