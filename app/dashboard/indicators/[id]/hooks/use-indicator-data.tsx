"use client";

import { useState, useEffect } from "react";
import { useGetIndicatorDataQuery, useGetIndicatorHistoryQuery } from "@/redux/services/indicatorsApiSlice";
import { useGetWorkflowsByIndicatorQuery } from "@/redux/services/workflowApiSlice";
import { ColumnDef } from "@tanstack/react-table";
import generateSequence, { generateStartPeriod } from "../helpers/period-sequence";
import {
  IndicatorDataMetadata,
  IndicatorValue,
  GridRowData,
  DataUpdateAction,
  BasisMetadataRow,
  IndicatorHistoryItem,
  IndicatorApiResponse,
  CustomIndicatorData,
  GridRow
} from "@/types/dashboard";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function useIndicatorData(id: string) {
  // State for standard indicators
  const [gridData, setGridData] = useState<GridRowData>({
    rows: [],
    headerRow: { rowId: "", cells: [] }
  });

  // State for custom indicators
  const [gridDataCustom, setGridDataCustom] = useState<GridRow[]>([]);
  const [codes, setCodes] = useState<string[]>([""]);
  const [basisTable, setBasisTable] = useState<{
    columns: ColumnDef<BasisMetadataRow, unknown>[];
    data: BasisMetadataRow[];
  }>({
    columns: [],
    data: []
  });
  const [equation, setEquation] = useState<{ equation: string; code: string }>({
    equation: "",
    code: ""
  });
  const [basisIds, setBasisIds] = useState<{ code: string; id: string }[]>([]);
  const [basisSelected, setBasisSelected] = useState<{
    code: string;
    name: string;
    frequency: string;
  }[]>([]);

  // Common state
  const [information, setInformation] = useState<IndicatorDataMetadata>({
    id: "",
    name: "",
    region: "",
    country: "",
    code: "",
    base_year: undefined,
    description: "",
    source: "",
    category: "",
    is_seasonally_adjusted: false,
    frequency: "",
    is_custom: false,
    currentPrices: false,
    access_level: "",
  });
  const [name, setName] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [formulaHistory, setFormulaHistory] = useState<IndicatorHistoryItem[]>([]);
  const [indicatorHistory, setIndicatorHistory] = useState<IndicatorHistoryItem[]>([]);
  const [dataHistory, setDataHistory] = useState<DataUpdateAction | null>(null);
  const [description, setDescription] = useState<string>("");
  const [tableData, setTableData] = useState<{
    columns: ColumnDef<Record<string, unknown>, unknown>[];
    data: Record<string, unknown>[];
  }>({
    columns: [],
    data: []
  });

  // API hooks
  const {
    data: indicatorData,
    refetch: refetchIndicatorData
  } = useGetIndicatorDataQuery(id);

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistoryData
  } = useGetIndicatorHistoryQuery(id);

  const {
    data: associatedWorkflows,
    isLoading: workflowsLoading
  } = useGetWorkflowsByIndicatorQuery(id);

  // Process history data
  useEffect(() => {
    if (historyData) {
      const typedHistoryData = historyData as unknown as IndicatorHistoryItem[];
      const dataUpdateHistory = typedHistoryData.find((item) => item.action_type === "DATA_UPDATE");
      const indicatorEditHistory = typedHistoryData.filter((item) =>
        item.details?.some((detail) => detail.action_type === "INDICATOR_EDIT")
      );
      const formulaUpdateHistory = typedHistoryData.filter((item) =>
        item.details?.some((detail) => detail.action_type === "FORMULA_UPDATE")
      );

      setIndicatorHistory(indicatorEditHistory || []);
      setFormulaHistory(formulaUpdateHistory || []);
      setDataHistory(dataUpdateHistory as unknown as DataUpdateAction || null);
    }
  }, [historyData]);

  // Process indicator data
  useEffect(() => {
    if (indicatorData) {
      const data = indicatorData as unknown as IndicatorApiResponse;
      console.log("Indicator data from API:", data);

      if (!data.indicator.is_custom) {
        // Process standard indicator data
        const tableCols: ColumnDef<IndicatorValue, unknown>[] = [
          {
            accessorKey: "id",
            header: ({ column }) => (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  {column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            ),
          },
          {
            accessorKey: "period",
            header: ({ column }) => (
              <div>
                Period
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  {column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            ),
          },
          {
            accessorKey: "value",
            header: ({ column }) => (
              <div>
                {data.indicator.name}
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  {column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            ),
          },
        ];

        const indicatorValues = data.data.map((item: IndicatorValue) => ({
          id: item.id,
          period: item.period,
          value: item.value,
        }));

        setName(data.indicator.name);
        setFileName(data.indicator.name.replace(/[^a-zA-Z0-9]/g, "_"));
        setDescription(data.indicator.description);

        const indicatorMeta: IndicatorDataMetadata = {
          id: id,
          unit: data.indicator.unit,
          name: data.indicator.name,
          region: data.indicator.region,
          country: data.indicator.country,
          code: data.indicator.code,
          base_year: data.indicator.base_year,
          description: data.indicator.description,
          source: data.indicator.source,
          category: data.indicator.category,
          is_seasonally_adjusted: data.indicator.is_seasonally_adjusted,
          frequency: data.indicator.frequency,
          is_custom: data.indicator.is_custom,
          currentPrices: data.indicator.currentPrices,
          access_level: data.indicator.access_level,
          edit: data.indicator.can_edit,
          delete: false
        };

        setInformation(indicatorMeta);
        const filteredIndicatorValues = indicatorValues.filter(
          (item: IndicatorValue) => item.value !== undefined
        );

        setTableData({
          columns: tableCols as unknown as ColumnDef<Record<string, unknown>, unknown>[],
          data: filteredIndicatorValues
        });

        const periods = indicatorValues.map((item: IndicatorValue) => item.period).filter(Boolean) as string[];

        const emptyRows = generateSequence(periods, 1000, true, undefined, data.indicator.frequency).length > 0
          ? generateSequence(periods, 1000, true, undefined, data.indicator.frequency).map(period => ({
            period: period,
            value: undefined,
            id: undefined,
          }))
          : Array.from({ length: 1000 }, () => ({
            period: undefined,
            value: undefined,
            id: undefined,
          }));

        const allRows = [...indicatorValues, ...emptyRows];

        const headerRow = {
          rowId: "header",
          cells: [
            { type: "header", text: "Period" },
            { type: "header", text: data.indicator.code },
          ],
        };

        setGridData({ rows: allRows, headerRow: headerRow });
      } else {
        // Process custom indicator data
        // Check if this is a CustomIndicatorData response
        if ('basis_indicators' in data && 'formula' in data) {
          const customData = data as CustomIndicatorData;
          const basisData = customData.basis_data;
          const basisIndicators = customData.basis_indicators;
          const basisPeriods = new Set<string>();
          const basisCodes = Object.keys(basisIndicators);
          const indicatorCodes = basisCodes.concat(customData.indicator.code);
          const func = customData.formula;
          const ids = Object.keys(basisIndicators).map((key) => ({
            code: key,
            id: basisIndicators[key].id,
          }));

          const basisSel = basisCodes.map((code) => ({
            code: code,
            name: basisIndicators[code].name,
            frequency: basisIndicators[code].frequency,
          }));

        setBasisIds(ids);
        setEquation({ equation: func, code: data.indicator.code });
        setCodes(indicatorCodes);

        // Collect all periods from basis data
        Object.values(basisData).forEach((indicatorData) => {
          if (Array.isArray(indicatorData)) {
            indicatorData.forEach((item) => {
              if (item && item.period) {
                basisPeriods.add(item.period);
              }
            });
          }
        });

        // Also add periods from the custom indicator data
        if (Array.isArray(data.data)) {
          data.data.forEach((item) => {
            if (item && item.period) {
              basisPeriods.add(item.period);
            }
          });
        }

        const blankHeaderColumn: ColumnDef<BasisMetadataRow, unknown> = {
          accessorKey: "name",
          header: "",
          cell: ({ row }) => {
            const name = row.getValue("name") as string;
            return (
              <div className="font-semibold text-secondary">
                {name}
              </div>
            );
          },
        };

        const basisCols: ColumnDef<BasisMetadataRow, unknown>[] = [
          blankHeaderColumn,
          ...basisCodes.map((code) => ({
            accessorKey: code,
            header: basisIndicators[code].name,
          })),
        ];

        // Create complete metadata rows for basis info card
        const metadataRows: BasisMetadataRow[] = [
          {
            name: "Description",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].description || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Seasonally Adjusted",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].is_seasonally_adjusted ? "Yes" : "No";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Unit",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].unit || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Source",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].source || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Category",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].category || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Frequency",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].frequency.toString();
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Region",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].region || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Country",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].country || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Base Year",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].base_year?.toString() || "N/A";
              return acc;
            }, {} as Record<string, string>),
          },
          {
            name: "Current Prices",
            ...Object.keys(basisIndicators).reduce((acc, code) => {
              acc[code] = basisIndicators[code].currentPrices ? "Yes" : "No";
              return acc;
            }, {} as Record<string, string>),
          },
        ];

        // Define table columns for the data table
        const tableCols = [
          {
            accessorKey: "period",
            header: ({ column }: { column: { toggleSorting: (state: boolean) => void; getIsSorted: () => string | false } }) => (
              <div>
                Period
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  {column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            ),
          },
          ...basisCodes.map((code) => ({
            accessorKey: code,
            header: basisIndicators[code].name,
          })),
          {
            accessorKey: data.indicator.code,
            header: ({ column }: { column: { toggleSorting: (state: boolean) => void; getIsSorted: () => string | false } }) => (
              <div>
                {data.indicator.name}
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  {column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                  ) : column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            ),
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
              // Access value using indicator code
              const val = row.getValue(data.indicator.code) as number | undefined;
              return (
                <div className="font-medium">
                  {val !== undefined ? val : ''}
                </div>
              );
            }
          },
        ];

        // Create table data with all periods and appropriate values
        const tableData = Array.from(basisPeriods).map(period => {
          const rowData: Record<string, unknown> = { period };

          // Add basis indicator values
          Object.keys(basisIndicators).forEach(code => {
            const basisValue = basisData[code]?.find((item: IndicatorValue) => item.period === period);
            rowData[code] = basisValue ? basisValue.value : undefined;
          });

          // Add custom indicator value
          const customValue = customData.data.find((item: IndicatorValue) => item.period === period);
          rowData[customData.indicator.code] = customValue ? customValue.value : undefined;

          return rowData;
        });

        // Ensure periods are sorted chronologically
        tableData.sort((a, b) => (a.period as string).localeCompare(b.period as string));

        // Prepare data for the editable grid with proper structure
        const gridValues = Array.from(basisPeriods).map(period => {
          // Create an object with period and nested objects for each code
          const rowData: Record<string, unknown> = { period };

          // Add basis indicator values with id and value structure
          Object.keys(basisIndicators).forEach(code => {
            const basisValue = basisData[code]?.find((item: IndicatorValue) => item.period === period);
            rowData[code] = {
              id: basisValue?.id,
              value: basisValue?.value
            };
          });

          // Add custom indicator value with id and value structure
          const customValue = customData.data.find((item: IndicatorValue) => item.period === period);
          rowData[customData.indicator.code] = {
            id: customValue?.id,
            value: customValue?.value
          };

          return rowData;
        });

        // Generate additional 1000 future periods for data entry
        let additionalPeriods: string[] = [];
        if (gridValues.length > 0) {
          // Sort periods chronologically to find latest
          gridValues.sort((a, b) => (a.period as string).localeCompare(b.period as string));
          const latestPeriod = gridValues[gridValues.length - 1].period as string;

          // Log and ensure we're using the correct frequency
          console.log("Generating additional periods with frequency:", data.indicator.frequency);
          additionalPeriods = generateSequence([latestPeriod], 1000, true, undefined, data.indicator.frequency);
        } else {
          // If no periods exist, generate from current date
          const startPeriod = generateStartPeriod(data.indicator.frequency);
          console.log("Generating periods from start period:", startPeriod, "with frequency:", data.indicator.frequency);
          additionalPeriods = generateSequence([], 1000, true, startPeriod, data.indicator.frequency);
        }

        // Create additional row objects for future periods
        const additionalRows = additionalPeriods
          .filter(period => !Array.from(basisPeriods).includes(period)) // Avoid duplicates
          .map(period => {
            const rowData: Record<string, unknown> = { period };

            indicatorCodes.forEach(code => {
              rowData[code] = { id: undefined, value: undefined };
            });

            return rowData;
          });

        // Combine existing and additional rows
        const allGridValues = [...gridValues, ...additionalRows];

        // Sort all rows chronologically
        allGridValues.sort((a, b) => (a.period as string).localeCompare(b.period as string));

        // Set the grid data with properly structured values
        // Type assertion is safe because we added the period property to each row
        setGridDataCustom(allGridValues as GridRow[]);
        setTableData({
          columns: tableCols as unknown as ColumnDef<Record<string, unknown>, unknown>[],
          data: tableData
        });
        setBasisTable({ columns: basisCols, data: metadataRows });
        setName(customData.indicator.name);
        setFileName(customData.indicator.name.replace(/[^a-zA-Z0-9]/g, "_"));
        setDescription(customData.indicator.description);
        setInformation({ ...customData.indicator, id: id });
        setBasisSelected(basisSel);
        }
      }
    }
  }, [indicatorData, id]);

  const toggleGrid = () => {
    setShowGrid(prevShowGrid => !prevShowGrid);
    refetchIndicatorData();
    refetchHistoryData();
  };

  const refetch = () => {
    refetchIndicatorData();
    refetchHistoryData();
  };

  return {
    // State variables
    gridData,
    gridDataCustom,
    codes,
    basisTable,
    equation,
    basisIds,
    basisSelected,
    information,
    name,
    fileName,
    description,
    showGrid,
    formulaHistory,
    indicatorHistory,
    dataHistory,
    tableData,

    // Query results
    associatedWorkflows,
    workflowsLoading,
    isHistoryLoading,
    historyError,

    // Actions
    toggleGrid,
    refetch
  };
}
