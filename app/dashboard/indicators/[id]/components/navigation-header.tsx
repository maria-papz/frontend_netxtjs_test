"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Info, Grid2X2, ChevronLeft, ChevronRight } from "lucide-react";
import { ViewMetaHistoryDialog } from "../view-meta-history-dialog";
import { ViewDataHistoryDialog } from "../view-data-history-dialog";
import { ViewFormulaHistoryDialog } from "../view-formula-history-dialog";
import { DataUpdateAction, IndicatorHistoryItem, FormulaUpdateDetails, IndicatorEditDetails, UserAction } from "@/types/dashboard";

// Define the types needed for meta history dialog
type MetadataChangeValue = {
  old: string | number | boolean | null;
  new: string | number | boolean;
};

interface IndicatorHistoryDetail extends Omit<UserAction, 'details'> {
  details: IndicatorEditDetails | Record<string, MetadataChangeValue | string>;
  user_email?: string;
}

interface MetaInfoHistoryEntry {
  timestamp: string;
  details: IndicatorHistoryDetail[];
  useremail: string;
}

// Define the types needed for formula history dialog
interface FormulaInfoHistoryEntry {
  timestamp: string;
  details: {
    action_type: string;
    details: FormulaUpdateDetails;
  }[];
  useremail: string;
}

interface NavigationHeaderProps {
  currentPage: number;
  onNext: () => void;
  onPrevious: () => void;
  dataHistory: DataUpdateAction | null;
  indicatorHistory: IndicatorHistoryItem[];
  formulaHistory: IndicatorHistoryItem[];
  isHistoryLoading: boolean;
  historyError: Error | null | unknown;
  refetch: () => void;
}

export function NavigationHeader({
  currentPage,
  onNext,
  onPrevious,
  dataHistory,
  indicatorHistory,
  formulaHistory,
  isHistoryLoading,
  historyError,
  refetch
}: NavigationHeaderProps) {
  // Simple adapter function to convert from our data model to the expected format of the dialogs
  const adaptHistoryItems = (items: IndicatorHistoryItem[]) => {
    return items.map(item => ({
      ...item,
      useremail: "System User" // Add the missing property
    }));
  };

  // Use type assertions to pass our data to the dialogs
  // This is a compromise solution when we can't easily make the types match exactly
  // but we know the actual runtime values are compatible
  const metaHistoryForDialog = adaptHistoryItems(indicatorHistory) as unknown as MetaInfoHistoryEntry[];
  const formulaHistoryForDialog = adaptHistoryItems(formulaHistory) as unknown as FormulaInfoHistoryEntry[];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center">
        {currentPage === 0 ? (
          <>
            <Info className="mr-2 h-5 w-5 text-secondary" />
            Indicator Information
          </>
        ) : (
          <>
            <Grid2X2 className="mr-2 h-5 w-5 text-secondary" />
            Indicator Data
          </>
        )}
      </h2>

      <div className="flex items-center gap-4">
        {/* History actions row */}
        <div className="flex items-center gap-2">
          {currentPage === 0 ? (
            <ViewMetaHistoryDialog
              infoHistory={metaHistoryForDialog}
            />
          ) : (
            <>
              {isHistoryLoading ? (
                <div className="text-muted-foreground">Loading history...</div>
              ) : historyError ? (
                <div className="text-destructive">Failed to load history</div>
              ) : dataHistory && (
                <ViewDataHistoryDialog
                  dataHistory={dataHistory}
                  refetch={refetch}
                />
              )}
              <ViewFormulaHistoryDialog
                infoHistory={formulaHistoryForDialog}
              />
            </>
          )}
        </div>

        {/* Page navigation */}
        <div className="flex items-center bg-white dark:bg-black rounded-full border border-zinc-200 dark:border-zinc-800 p-1 shadow-sm">
          <Button
            className="rounded-full h-7 w-7 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-2">
            {currentPage + 1}/2
          </span>

          <Button
            className="rounded-full h-7 w-7 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            variant="ghost"
            size="icon"
            onClick={onNext}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4 text-secondary" />
          </Button>
        </div>
      </div>
    </div>
  );
}
