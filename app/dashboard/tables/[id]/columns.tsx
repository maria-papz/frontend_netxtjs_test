"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndicatorMetadata, TableRowData } from "@/types/dashboard";

// Type for the column header props from TanStack Table
type ColumnHeaderProps = {
  column: {
    getIsSorted: () => string | false;
    toggleSorting: (state: boolean) => void;
  };
};

/**
 * Creates table columns dynamically based on the available indicators
 */
export const createColumns = (
  indicators: Record<string, IndicatorMetadata>
): ColumnDef<TableRowData>[] => {
  return [
    {
      accessorKey: "period",
      header: ({ column }: ColumnHeaderProps) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            Period
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
    },
    ...Object.keys(indicators).map((key) => ({
      accessorKey: key,
      header: ({ column }: ColumnHeaderProps) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            {key}
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
    })),
  ];
};
