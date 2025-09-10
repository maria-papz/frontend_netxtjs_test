/**
 * Utility functions for handling frequency matching between workflow and indicators
 */

// Map workflow frequency strings to all compatible indicator frequency values
export const workflowToIndicatorFrequencyMap: Record<string, string[]> = {
  // Direct matches
  "Monthly": ["MONTHLY", "Monthly"],
  "Quarterly": ["QUARTERLY", "Quarterly"],
  "Yearly": ["ANNUAL", "Annual", "Yearly"],

  // Special cases
  "Daily": ["DAILY", "Daily"],
  "Weekly": ["WEEKLY", "Weekly"],
  "Biweekly": ["BIWEEKLY", "Biweekly"],
  "Bimonthly": ["BIMONTHLY", "Every 2 Months", "Bimonthly"],
  "Semiannual": ["SEMIANNUAL", "Semiannual", "Biannual", "Semiannual / Biannual"],
  "Annual": ["ANNUAL", "Annual", "Yearly"]
};

/**
 * Checks if an indicator's frequency is compatible with a workflow frequency
 * @param workflowFrequency The frequency string from workflow (e.g., "Monthly")
 * @param indicatorFrequency The frequency string from indicator
 * @returns boolean indicating if frequencies are compatible
 */
export function isFrequencyCompatible(
  workflowFrequency?: string,
  indicatorFrequency?: string
): boolean {
  if (!workflowFrequency || !indicatorFrequency) {
    return true; // If either frequency is undefined, don't filter
  }

  const compatibleFrequencies = workflowToIndicatorFrequencyMap[workflowFrequency] || [];

  // If no mapping exists, default to exact match
  if (compatibleFrequencies.length === 0) {
    return workflowFrequency.toUpperCase() === indicatorFrequency.toUpperCase();
  }

  // Check if the indicator frequency is in the list of compatible frequencies
  return compatibleFrequencies.some(freq =>
    indicatorFrequency.toUpperCase() === freq.toUpperCase()
  );
}

/**
 * Returns a human-readable explanation of the frequency filtering
 * @param workflowFrequency The workflow frequency being filtered on
 * @returns A string explaining the filtering
 */
export function getFrequencyFilterExplanation(workflowFrequency: string | undefined): string {
  if (!workflowFrequency) {
    return "Showing all indicators";
  }

  return `Showing indicators with ${workflowFrequency.toLowerCase()} frequency`;
}
