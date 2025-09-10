"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomGrid } from "../custom-grid";
import { CustomGridCustom } from "../custom-grid-custom";
import { DataTable } from "../data-table";
import { IndicatorLineGraph } from "../indicator-line-graph";
import {
  GridRowData,
  IndicatorDataMetadata,
  GridRow
} from "@/types/dashboard";
import { ColumnDef } from "@tanstack/react-table";

// Define more specific types instead of any
interface TableData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, unknown>[];
}

// Using GridRow and IndicatorCellValue types from dashboard.ts

// Use GridRow as the type for our custom grid data
type GridDataCustom = GridRow;

interface IndicatorDataTableProps {
  isCustom: boolean;
  showGrid: boolean;
  handleToggleGrid: () => void;
  tableData: TableData;
  gridData: GridRowData;
  gridDataCustom?: GridDataCustom[];
  indicatorInfo: IndicatorDataMetadata;
  fileName: string;
  // For custom indicators
  codes?: string[];
  equation?: { equation: string; code: string };
  basisIds?: { code: string; id: string }[];
  basisSelected?: { code: string; name: string; frequency: string }[];
  id: string;
  refetch: () => void;
  canEdit?: boolean;
}

export function IndicatorDataTable({
  isCustom,
  showGrid,
  handleToggleGrid,
  tableData,
  gridData,
  gridDataCustom,
  indicatorInfo,
  fileName,
  codes = [],
  equation,
  basisIds = [],
  basisSelected = [],
  id,
  refetch,
  canEdit = false
}: IndicatorDataTableProps) {
  // Ensure data is formatted correctly for the graph
  const graphData = React.useMemo(() => {
    if (!tableData.data || tableData.data.length === 0) return [];

    // Make sure each item has a period and value property
    return tableData.data.map(item => {
      if (typeof item === 'object' && item !== null) {
        // If the object doesn't have a "period" property but has other keys,
        // try to find a key that looks like a period
        if (!item.period) {
          const keys = Object.keys(item);
          const periodKey = keys.find(k =>
            k !== 'value' &&
            k !== indicatorInfo.code &&
            typeof item[k] === 'string'
          );

          if (periodKey) {
            return {
              period: item[periodKey],
              value: item[indicatorInfo.code] !== undefined ? item[indicatorInfo.code] : null
            };
          }
        }

        // If the item already has a period but no value, try to find the value
        if (item.period && item.value === undefined) {
          return {
            period: item.period,
            value: item[indicatorInfo.code] !== undefined ? item[indicatorInfo.code] : null
          };
        }
      }

      return item;
    });
  }, [tableData.data, indicatorInfo.code]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="graph">Graph View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="border rounded-lg overflow-hidden shadow-md">
            {!isCustom ? (
              showGrid ? (
                <CustomGrid
                  values={gridData.rows}
                  // @ts-expect-error - The type issue requires deeper refactoring
                  headerRow={gridData.headerRow}
                  id={id}
                  frequency={indicatorInfo.frequency}
                  cancel={handleToggleGrid}
                />
              ) : (
                <DataTable
                  columns={tableData.columns}
                  data={tableData.data}
                  close={handleToggleGrid}
                  name={fileName}
                  isInfo={false}
                  canEdit={canEdit}
                />
              )
            ) : (
              showGrid ? (
                <CustomGridCustom
                  codes={codes}
                  frequency={indicatorInfo.frequency}
                  values={gridDataCustom || []}
                  equation={equation!}
                  ids={basisIds}
                  selectedRows={basisSelected}
                  id={id}
                  refetch={refetch}
                  cancel={handleToggleGrid}
                />
              ) : (
                <DataTable
                  columns={tableData.columns}
                  data={tableData.data}
                  close={handleToggleGrid}
                  name={fileName}
                  isInfo={false}
                  canEdit={canEdit}
                />
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph">
          <div className="border rounded-lg overflow-hidden shadow-md p-4">
            <IndicatorLineGraph
              data={graphData}
              indicatorName={indicatorInfo.name}
              indicatorCode={indicatorInfo.code}
              color={isCustom ? "#9333ea" : "#CF9031"}
              maxXAxisLabels={10}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
