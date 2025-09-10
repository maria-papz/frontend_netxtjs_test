import * as React from "react";
import { ReactGrid, Column, CellChange, TextCell, Id, MenuOption, CellLocation, Highlight, SelectionMode, Cell } from "@silevis/reactgrid";
import "./styles/grid-style.css";
import { Undo, Redo, Grid2x2Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import generateSequence, { generateStartPeriod } from "./helpers/period-sequence";
import { Label } from "@/components/ui/label"
import { AddRowsDialog } from "./add-rows-dialog";
import { useToast } from "@/hooks/use-toast";
import { CustomIndicatorDrawer } from "../custom-indicator-drawer";
import { useUpdateIndicatorDataMutation } from "@/redux/services/indicatorsApiSlice";
import { GridRow, IndicatorCellValue } from "@/types/dashboard";

// Helper type guard function
function isIndicatorCellValue(value: unknown): value is IndicatorCellValue {
  return value !== null && typeof value === 'object' && ('value' in value || 'id' in value);
}

interface CustomGridProps {
  values: GridRow[];
  codes: string[];
  frequency: string;
  equation: {equation: string, code: string};
  ids: {code: string, id: string}[];
  selectedRows: Array<{ code: string; name: string; frequency: string }>;
  id: string;
  refetch: () => void;
  cancel: () => void;
}

export function CustomGridCustom({ values, codes, frequency, equation, ids, selectedRows, id, refetch, cancel}: CustomGridProps) {
  const [val, setVal] = React.useState<GridRow[]>(values);
  const [cellChangesIndex, setCellChangesIndex] = React.useState(-1);
  const [cellChanges, setCellChanges] = React.useState<(CellChange<TextCell>[] | { type: "insertRow"; rowIndex: number; numRows: number; startPeriod?: string })[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [insertRowIndex, setInsertRowIndex] = React.useState<number | null>(null);
  const { toast } = useToast();
  const [showPeriodInput, setShowPeriodInput] = React.useState<boolean>(false);
  const [initialDialogOpen, setInitialDialogOpen] = React.useState(false);
  const [updateIndicatorData] = useUpdateIndicatorDataMutation();

  const getColumns = (): Column[] => {
    return [
      { columnId: "period", width: 150, resizable: true },
      ...codes.map(code => ({
        columnId: code,
        width: 150,
        resizable: true
      }))
    ];
  };

  const [columns, setColumns] = React.useState<Column[]>(getColumns());

  React.useEffect(() => {
    // Make sure we're not getting an empty array for values
    console.log("Initial values received:", values?.length, "frequency:", frequency);

    if (values && values.length > 0) {
      // Debug the values structure
      console.log("First value sample:", JSON.stringify(values[0]).substring(0, 200));

      // Sort periods chronologically before setting state
      const sortedValues = [...values].sort((a, b) => {
        if (!a || !a.period) return 1;
        if (!b || !b.period) return -1;
        return a.period.localeCompare(b.period);
      });

      console.log("First sorted value:", sortedValues[0]?.period);

      // For custom frequency, just use the values as they are
      if (frequency.toLowerCase() === 'custom') {
        console.log("Custom frequency detected - preserving all periods as is");
        setVal(sortedValues);
      } else {
        // Check for expected periods based on standard frequencies
        const expectedFormats: Record<string, RegExp> = {
          'minute': /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
          'hourly': /^\d{4}-\d{2}-\d{2} \d{2}:00$/,
          'daily': /^\d{4}-\d{2}-\d{2}$/,
          'weekly': /^\d{4}-W\d{1,2}$/,
          'biweekly': /^\d{4}-W\d{1,2}$/,
          'monthly': /^\d{4}-\d{2}$/,
          'bimonthly': /^\d{4}-\d{2}$/,
          'quarterly': /^\d{4}-Q[1-4]$/,
          'triannual': /^\d{4}-T[1-3]$/,
          'semiannual': /^\d{4}-H[1-2]$/,
          'annual': /^\d{4}$/
        };

        const lowerFreq = frequency.toLowerCase();
        const formatPattern = expectedFormats[lowerFreq];

        // If it's a standard frequency with a known pattern
        if (formatPattern) {
          // For minute frequency, just use the values as they are
          if (lowerFreq === 'minute') {
            console.log("Minute frequency detected - ensuring all periods are preserved");
            setVal(sortedValues);
          } else {
            // For other frequencies, check if format needs conversion
            const periodsMatchFormat = sortedValues.every(v =>
              !v.period || formatPattern.test(v.period)
            );

            console.log("Periods match expected format:", periodsMatchFormat);

            if (!periodsMatchFormat) {
              console.log("Periods don't match expected format, regenerating");

              // Extract values from the existing data
              const codeValues = new Map();
              codes.forEach(code => {
                const valuesForCode = sortedValues
                  .filter(v => v && v[code] && isIndicatorCellValue(v[code]) && v[code].value !== undefined)
                  .map((v, i) => ({
                    originalPeriod: v.period,
                    value: isIndicatorCellValue(v[code]) ? v[code].value : undefined,
                    id: isIndicatorCellValue(v[code]) ? v[code].id : undefined,
                    index: i
                  }));

                if (valuesForCode.length > 0) {
                  codeValues.set(code, valuesForCode);
                }
              });

              // Generate new periods based on frequency
              const startPeriod = generateStartPeriod(frequency);
              const newPeriods = generateSequence([], sortedValues.length + 1000, true, startPeriod, frequency);

              // Create new rows with the correct period format
              const newRows: GridRow[] = newPeriods.map((period, idx) => {
                const rowData: GridRow = { period };

                // Add data for each code
                codes.forEach(code => {
                  const values = codeValues.get(code) || [];
                  const matchingValue = values.find((v: { index: number }) => v.index === idx);

                  rowData[code] = {
                    id: matchingValue?.id,
                    value: matchingValue?.value
                  };
                });

                return rowData;
              });

              console.log("Generated new rows with correct format:", newRows.length);
              setVal(newRows);
            } else {
              setVal(sortedValues);
            }
          }
        } else {
          // For unknown frequencies, preserve the data as is
          console.log("Unknown frequency format, preserving data as is");
          setVal(sortedValues);
        }
      }
    } else {
      console.log("No values to display, initializing empty array");

      // If no values provided, generate 1000 rows with periods
      const startPeriod = generateStartPeriod(frequency);
      console.log("Using start period:", startPeriod);

      const newPeriods = generateSequence([], 1000, true, startPeriod, frequency);
      console.log("Generated periods:", newPeriods.length, "Sample:", newPeriods.slice(0, 3));

      const emptyRows = newPeriods.map(period => ({
        period,
        ...codes.reduce((acc, code) => ({
          ...acc,
          [code]: { id: undefined, value: undefined }
        }), {})
      }));

      setVal(emptyRows);
    }

    // Check if there are any non-empty values to determine if we need to show period input
    const hasData = values && values.some((v: GridRow) =>
      v && codes.some(code => v[code] && isIndicatorCellValue(v[code]) && v[code].value !== undefined)
    );
    setShowPeriodInput(!hasData);

    // If there's no data, open the dialog to ask for a start period immediately
    if (!hasData && values && values.length === 0) {
      setInitialDialogOpen(true);
    }
  }, [values, codes, frequency]);

  const applyEquation = (rowIndex: number) => {
    const row = val[rowIndex];
    if (!row) return;

    const formula = equation.equation;
    const code = equation.code;

    // Check if any required basis indicator is null/undefined
    const hasMissingValues = formula.match(/@(\w+)/g)?.some(match => {
      const matchCode = match.substring(1); // Remove the @ symbol
      return !row[matchCode] ||
             !isIndicatorCellValue(row[matchCode]) ||
             row[matchCode].value === undefined ||
             row[matchCode].value === null;
    });

    // If any required value is missing, set the custom indicator value to null
    if (hasMissingValues) {
      setVal((prevVal) => {
        const updated = [...prevVal];
        if (!updated[rowIndex][code] || !isIndicatorCellValue(updated[rowIndex][code])) {
          updated[rowIndex][code] = { id: undefined, value: undefined };
        } else if (isIndicatorCellValue(updated[rowIndex][code])) {
          (updated[rowIndex][code] as IndicatorCellValue).value = undefined;
        }
        return updated;
      });
      return;
    }

    // If all values are present, calculate the formula
    try {
      const evaluatedFormula = formula.replace(/@(\w+)/g, (_, match) => {
        return row[match] && isIndicatorCellValue(row[match]) &&
               row[match].value !== undefined && row[match].value !== null ?
          String(row[match].value) :
          'null'; // Use 'null' string for formula evaluation safety
      });

      // Check if the evaluated formula contains 'null'
      if (evaluatedFormula.includes('null')) {
        setVal((prevVal) => {
          const updated = [...prevVal];
          if (!updated[rowIndex][code] || !isIndicatorCellValue(updated[rowIndex][code])) {
            updated[rowIndex][code] = { id: undefined, value: undefined };
          } else if (isIndicatorCellValue(updated[rowIndex][code])) {
            (updated[rowIndex][code] as IndicatorCellValue).value = undefined;
          }
          return updated;
        });
        return;
      }

      // Safely evaluate the formula
      const result = eval(evaluatedFormula);

      // Handle NaN, Infinity, or other invalid results
      const validResult = (isNaN(result) || !isFinite(result)) ? undefined : result;

      setVal((prevVal) => {
        const updated = [...prevVal];
        if (!updated[rowIndex][code] || !isIndicatorCellValue(updated[rowIndex][code])) {
          updated[rowIndex][code] = { id: undefined, value: undefined };
        }
        if (isIndicatorCellValue(updated[rowIndex][code])) {
          (updated[rowIndex][code] as IndicatorCellValue).value = validResult;
        }
        return updated;
      });
    } catch (error) {
      console.error("Error evaluating formula:", error, "Formula:", formula);
      // On error, set to undefined rather than leaving previous value
      setVal((prevVal) => {
        const updated = [...prevVal];
        if (!updated[rowIndex][code] || !isIndicatorCellValue(updated[rowIndex][code])) {
          updated[rowIndex][code] = { id: undefined, value: undefined };
        } else if (isIndicatorCellValue(updated[rowIndex][code])) {
          (updated[rowIndex][code] as IndicatorCellValue).value = undefined;
        }
        return updated;
      });
    }
  };

  const handleInitialPeriodGeneration = (numRows: number, startPeriod?: string) => {
    if (!startPeriod) {
      startPeriod = generateStartPeriod(frequency);
    }

    console.log(`Initial period generation with frequency: ${frequency}, start period: ${startPeriod}`);
    const newPeriods = generateSequence([], 1000, true, startPeriod, frequency);
    const newRows = newPeriods.map(period => ({
      period,
      ...codes.reduce((acc, code) => ({
        ...acc,
        [code]: { id: undefined, value: undefined }
      }), {})
    }));

    // Sort the periods to ensure they're in order
    newRows.sort((a, b) => a.period.localeCompare(b.period));

    setVal(newRows);
    setInitialDialogOpen(false);
  };

  const handleApplyChanges = async () => {
    // Find the rows with valid data for any indicator - looking for rows with both period and value
    const validRows = val.filter((v: GridRow) =>
      v.period &&
      codes.some(code => v[code] && isIndicatorCellValue(v[code]) && v[code].value !== undefined)
    );

    if (validRows.length === 0) {
      toast({
        title: "Validation Error",
        description: "No valid data to post. Add both period and value for at least one indicator.",
        variant: "destructive",
      });
      return;
    }

    // Sort periods to ensure they are in order
    validRows.sort((a, b) => a.period.localeCompare(b.period));

    // Validate sequence of periods (only for standard frequencies, not for custom frequency)
    if (frequency.toLowerCase() !== 'custom' && validRows.length > 1) {
      const periods = validRows.map((v: GridRow) => v.period);

      // Check if all periods follow the expected sequence
      let isValid = true;
      for (let i = 1; i < periods.length; i++) {
        const expectedNext = generateSequence([periods[i-1]], 1, true, undefined, frequency)[0];
        if (periods[i] !== expectedNext) {
          isValid = false;
          break;
        }
      }

      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please ensure sequence of periods is consistent before applying changes.",
          variant: "destructive",
        });
        return;
      }
    }

    // Track successful and failed updates
    const results: { success: string[], error: string[] } = { success: [], error: [] };

    // Process indicators sequentially to avoid database locking issues
    for (const { code, id } of ids) {
      const filteredData = validRows
        .filter((row: GridRow) =>
          row[code] && isIndicatorCellValue(row[code]) && row[code].value !== undefined
        )
        .map((row: GridRow) => ({
          period: row.period,
          value: isIndicatorCellValue(row[code]) ? row[code].value : null,
          id: isIndicatorCellValue(row[code]) ? row[code].id : undefined
        }));

      if (filteredData.length === 0) {
        continue; // Skip if no valid data for this indicator
      }

      try {
        await updateIndicatorData({ id, data: filteredData }).unwrap();
        results.success.push(code);
        // Add a small delay between requests to ensure database operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error updating ${code}:`, error);
        results.error.push(code);
      }
    }

    // All updates are now complete (we don't need Promise.all anymore)

    // Show appropriate toast messages
    if (results.success.length > 0) {
      toast({
        title: "Success",
        description: `Changes applied successfully for ${results.success.join(', ')}`,
      });
    }

    if (results.error.length > 0) {
      toast({
        title: "Error",
        description: `Failed to update: ${results.error.join(', ')}`,
        variant: "destructive",
      });
    }

    // Refetch data to ensure UI is up to date
    refetch();
  };

  const handleAddRows = (numRows: number, startPeriod?: string) => {
    if (insertRowIndex === null) return;

    setVal((prevVal) => {
      // Get existing periods
      const existingPeriods = prevVal
        .map((v: GridRow) => v.period)
        .filter((p): p is string => p !== undefined && p !== "");

      let newRows: GridRow[] = [];

      // For custom frequency, just add empty rows without period formatting
      if (frequency.toLowerCase() === 'custom') {
        newRows = Array.from({ length: numRows }, () => ({
          period: "",
          ...codes.reduce((acc, code) => ({
            ...acc,
            [code]: { id: undefined, value: undefined }
          }), {})
        }));
      }
      // If we have no existing periods but we have a start period, generate from start period
      else if (existingPeriods.length === 0 && startPeriod) {
        console.log(`Generating sequence with frequency: ${frequency}`);
        const newPeriods = generateSequence([], numRows, true, startPeriod, frequency);
        newRows = newPeriods.map(period => ({
          period,
          ...codes.reduce((acc, code) => ({
            ...acc,
            [code]: { id: undefined, value: undefined }
          }), {})
        }));
      }
      // If we have existing periods, generate a sequence from them
      else if (existingPeriods.length > 0) {
        // If inserting at the beginning, generate backward from the first row
        const forward = insertRowIndex > 0;

        // Generate sequence based on reference period
        const selectedPeriods = forward
          ? prevVal.slice(0, insertRowIndex).map((v: GridRow) => v.period).filter((p): p is string => p !== undefined && p !== "")
          : prevVal.slice(insertRowIndex).map((v: GridRow) => v.period).filter((p): p is string => p !== undefined && p !== "");

        // Pass frequency to generateSequence
        const newPeriods = generateSequence(selectedPeriods, numRows, forward, undefined, frequency);

        // For weekly frequencies when inserting at the beginning, ensure periods are in correct order
        if (frequency.toLowerCase() === 'weekly' && !forward) {
          console.log("Handling weekly backward insertion, periods:", newPeriods);
        }

        newRows = newPeriods.map(period => ({
          period,
          ...codes.reduce((acc, code) => ({
            ...acc,
            [code]: { id: undefined, value: undefined }
          }), {})
        }));
      }
      // Fallback for when no periods exist and no start period is provided
      else {
        newRows = Array.from({ length: numRows }, () => ({
          period: "",
          ...codes.reduce((acc, code) => ({
            ...acc,
            [code]: { id: undefined, value: undefined }
          }), {})
        }));
      }

      const updatedValues = [
        ...prevVal.slice(0, insertRowIndex),
        ...newRows,
        ...prevVal.slice(insertRowIndex)
      ];

      // Store insertion history
      setCellChanges([...cellChanges.slice(0, cellChangesIndex + 1), {
        type: "insertRow",
        rowIndex: insertRowIndex,
        numRows,
        startPeriod
      }]);
      setCellChangesIndex(cellChangesIndex + 1);

      return updatedValues;
    });
  };

  const simpleHandleContextMenu = (
    selectedRowIds: Id[],
    selectedColIds: Id[],
    selectionMode: SelectionMode,
    menuOptions: MenuOption[],
    selectedRanges: Array<CellLocation[]>
  ): MenuOption[] => {
    if (selectedRanges.length === 0 || selectedRanges[0].length === 0) {
      return menuOptions;
    }

    const rowIndex = Number((selectedRanges[0][0].rowId as string).replace("row-", ""));
    if (isNaN(rowIndex) || rowIndex < 0) {
      return menuOptions;
    }

    const insertRowOption: MenuOption = {
      id: "insertRow",
      label: "Insert Row(s)",
      handler: () => {
        setInsertRowIndex(rowIndex);
        setIsDialogOpen(true);
      }
    };

    return [...menuOptions, insertRowOption];
  };

  const handleUndoChanges = () => {
    if (cellChangesIndex >= 0) {
      const lastChange = cellChanges[cellChangesIndex];

      setVal((prevVal: GridRow[]) => {
        if ('type' in lastChange && lastChange.type === "insertRow") {
          const { rowIndex, numRows } = lastChange as { type: "insertRow"; rowIndex: number; numRows: number };
          return prevVal.filter((_, index: number) => index < rowIndex || index >= rowIndex + numRows);
        } else {
          return applyNewValue(lastChange as CellChange<TextCell>[], prevVal, true);
        }
      });

      setCellChangesIndex(cellChangesIndex - 1);
    }
  };

  const handleRedoChanges = () => {
    if (cellChangesIndex + 1 <= cellChanges.length - 1) {
      const nextChange = cellChanges[cellChangesIndex + 1];

      setVal((prevVal: GridRow[]) => {
        if ('type' in nextChange && nextChange.type === "insertRow") {
          const { rowIndex, numRows, startPeriod } = nextChange as {
            type: "insertRow";
            rowIndex: number;
            numRows: number;
            startPeriod?: string;
          };

          // Get existing periods
          const existingPeriods = prevVal
            .map((v: GridRow) => v.period)
            .filter((p): p is string => p !== undefined && p !== "");

          let newRows: GridRow[] = [];

          // For custom frequency, just add empty rows
          if (frequency.toLowerCase() === 'custom') {
            newRows = Array.from({ length: numRows }, () => ({
              period: "",
              ...codes.reduce((acc, code) => ({
                ...acc,
                [code]: { id: undefined, value: undefined }
              }), {})
            }));
          }
          // If we have no existing periods but we have a start period, generate from start period
          else if (existingPeriods.length === 0 && startPeriod) {
            // Pass frequency to generateSequence
            const newPeriods = generateSequence([], numRows, true, startPeriod, frequency);
            newRows = newPeriods.map(period => ({
              period,
              ...codes.reduce((acc, code) => ({
                ...acc,
                [code]: { id: undefined, value: undefined }
              }), {})
            }));
          }
          // If we have existing periods, generate a sequence from them
          else if (existingPeriods.length > 0) {
            // If inserting at the beginning, generate backward from the first row
            const forward = rowIndex > 0;

            // Generate sequence based on reference period
            const selectedPeriods = forward
              ? prevVal.slice(0, rowIndex).map((v: GridRow) => v.period).filter((p): p is string => p !== undefined && p !== "")
              : prevVal.slice(rowIndex).map((v: GridRow) => v.period).filter((p): p is string => p !== undefined && p !== "");

            // Pass frequency to generateSequence
            const newPeriods = generateSequence(selectedPeriods, numRows, forward, undefined, frequency);
            newRows = newPeriods.map(period => ({
              period,
              ...codes.reduce((acc, code) => ({
                ...acc,
                [code]: { id: undefined, value: undefined }
              }), {})
            }));
          }
          return [
            ...prevVal.slice(0, rowIndex),
            ...newRows,
            ...prevVal.slice(rowIndex)
          ];
        } else {
          return applyNewValue(nextChange as CellChange<TextCell>[], prevVal);
        }
      });

      setCellChangesIndex(cellChangesIndex + 1);
    }
  };

  const [highlights, setHighlights] = React.useState<Highlight[]>([]);

  React.useEffect(() => {
    if (!val || val.length === 0) {
      setHighlights([]);
      return;
    }

    // Find rows with invalid periods or values that need highlighting
    const highlightedRows: Highlight[] = [];

    // Get all rows with valid data (period and at least one basis indicator with value)
    const validRows = val
      .map((v: GridRow, idx: number) => ({ ...v, idx }))
      .filter((v: GridRow & { idx: number }) => v.period && codes.some(code => {
        const cell = v[code];
        return isIndicatorCellValue(cell) && cell.value !== undefined;
      }));

    if (validRows.length === 0) {
      // If no valid rows yet, highlight first row
      highlightedRows.push(
        { columnId: "period", rowId: `row-0`, borderColor: "#879014" },
        ...codes.map(code => ({
          columnId: code,
          rowId: `row-0`,
          borderColor: "#879014"
        }))
      );
    } else {
      // Sort valid rows by period
      validRows.sort((a, b) => a.period.localeCompare(b.period));

      // Get the last valid row
      const lastValidRow = validRows[validRows.length - 1];

      // Find next empty row after the last valid row
      const nextEmptyRowIndex = val.findIndex((v: GridRow, idx: number) =>
        idx > lastValidRow.idx &&
        (!v || !v.period || !codes.some(code => {
          const cell = v[code];
          return isIndicatorCellValue(cell) && cell.value !== undefined;
        }))
      );

      const nextRowIndex = nextEmptyRowIndex !== -1 ?
        nextEmptyRowIndex :
        Math.min(lastValidRow.idx + 1, val.length - 1);

      highlightedRows.push(
        { columnId: "period", rowId: `row-${nextRowIndex}`, borderColor: "#879014" },
        ...codes.map(code => ({
          columnId: code,
          rowId: `row-${nextRowIndex}`,
          borderColor: "#879014"
        }))
      );
    }

    setHighlights(highlightedRows);
  }, [val, codes]);

  const applyNewValue = (
    changes: CellChange<TextCell>[],
    prevValue: GridRow[],
    usePrevValue: boolean = false
  ): GridRow[] => {
    const updated = [...prevValue];
    const affectedRows = new Set<number>();

    changes.forEach((change) => {
      const valueIndex = Number((change.rowId as string).replace("row-", ""));
      const fieldName = change.columnId as string;
      const cell = usePrevValue ? change.previousCell : change.newCell;

      affectedRows.add(valueIndex);

      if (updated[valueIndex]) {
        if (fieldName === "period") {
          updated[valueIndex][fieldName] = cell.text;
        } else {
          // Handle code-specific columns
          if (!updated[valueIndex][fieldName] || !isIndicatorCellValue(updated[valueIndex][fieldName])) {
            updated[valueIndex][fieldName] = { id: undefined, value: undefined };
          }

          const cellValue = cell.text === "" ? undefined : cell.text;
          if (isIndicatorCellValue(updated[valueIndex][fieldName])) {
            updated[valueIndex][fieldName].value = isNaN(Number(cellValue)) ? undefined : Number(cellValue);
          }
        }
      }
    });

    // Apply formula to all affected rows if formula exists
    if (equation.equation) {
      affectedRows.forEach(rowIndex => {
        applyEquation(rowIndex);
      });
    }

    return updated;
  };

  const getRows = (values: GridRow[]): { rowId: string; cells: { type: string; text: string, className?: string }[] }[] => {
    // Debug the values being passed to getRows
    console.log("getRows called with:", values?.length, "values");

    if (!values || values.length === 0) {
      console.log("No values, returning just header row");
      return [{
        rowId: "header",
        cells: [
          { type: "text", text: "Period" },
          ...codes.map(code => ({ type: "text", text: code }))
        ]
      }];
    }

    // Log a sample of the values to check their structure
    if (values.length > 0) {
      console.log("Sample value[0]:", values[0]);
    }

    // Keep track of the cells that are empty
    let totalCells = 0;
    let emptyCells = 0;

    // Sort periods chronologically for display
    const sortedValues = [...values].sort((a, b) => {
      if (!a?.period) return 1;
      if (!b?.period) return -1;
      return a.period.localeCompare(b.period);
    });

    const rows = [
      {
        rowId: "header",
        cells: [
          { type: "text", text: "Period" },
          ...codes.map(code => ({ type: "text", text: code }))
        ]
      },
      ...sortedValues.map((value, idx) => {
        // Debug each row
        if (idx < 5) console.log(`Row ${idx}:`, value);

        if (!value) {
          console.log(`Row ${idx} is undefined or null`);
          totalCells += codes.length + 1;
          emptyCells += codes.length + 1;
          return {
            rowId: `row-${idx}`,
            cells: [
              { type: "text", text: "" },
              ...codes.map(() => ({ type: "text", text: "" }))
            ]
          };
        }

        // Check if any basis indicator has a value for this period
        const hasBasisValue = codes.some(code => {
          const cellData = value[code];
          const hasValue = isIndicatorCellValue(cellData) && cellData.value !== undefined && cellData.value !== null;
          totalCells++;
          if (!hasValue) emptyCells++;
          return hasValue;
        });

        // Determine if period should be greyed out
        const isPeriodEmpty = !hasBasisValue;

        return {
          rowId: `row-${idx}`,
          cells: [
            {
              type: "text",
              text: value.period || "",
              className: isPeriodEmpty ? "disabled-text" : ""
            },
            ...codes.map(code => {
              // Verify the value is accessible
              const cellData = value[code];
              const cellValue = isIndicatorCellValue(cellData) && cellData.value !== undefined && cellData.value !== null
                ? cellData.value
                : undefined;
              const cellText = cellValue !== undefined
                ? String(cellValue)
                : "";

              return {
                type: "text",
                text: cellText,
                className: cellValue === undefined ? "disabled-text" : ""
              };
            })
          ]
        };
      })
    ];

    console.log(`Generated ${rows.length} rows (${emptyCells}/${totalCells} cells are empty)`);
    return rows;
  };

  // Add debugging for row generation
  const rows = getRows(val);
  console.log(`Final row count: ${rows.length}`);

  const handleChanges = (changes: CellChange<TextCell>[] | CellChange<TextCell & Cell>[]) => {
    setVal((prevVal: GridRow[]) => applyNewValue(changes as CellChange<TextCell>[], prevVal));
    setCellChanges([...cellChanges.slice(0, cellChangesIndex + 1), changes as CellChange<TextCell>[]]);
    setCellChangesIndex(cellChangesIndex + 1);
  };

  const handleColumnResize = (ci: Id, width: number) => {
    setColumns((prevColumns) => {
      const columnIndex = prevColumns.findIndex(el => el.columnId === ci);
      const updatedColumn = { ...prevColumns[columnIndex], width };
      return prevColumns.map((col, idx) => idx === columnIndex ? updatedColumn : col);
    });
  };

  return (
    <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 w-[60vw] bg-white dark:bg-zinc-950 bg-opacity-50 mx-auto hover:bg-zinc-50 dark:hover:bg-zinc-950 max-h-[75vh] overflow-auto">
      <div className="flex pl-6 justify-between">
        <Label className="text-xl pt-10 flex font-semibold">
          <Grid2x2Plus className="ml-2 mr-2" />
          Editable Data
        </Label>
        <div className="p-6">
          <Button variant="ghost" size="icon" onClick={cancel}><X/></Button>
        </div>
      </div>
      <div className="pl-6">
        <CustomIndicatorDrawer
          text={equation.equation}
          selectedRows={selectedRows}
          codes={codes}
          id={id}
          refetch={refetch}
        />
      </div>
      <div className="pt-16 flex-1 h-100vh container mx-auto flex justify-center items-center "
        onKeyDown={(e) => {
          if ((!navigator.userAgent.includes("Mac") && e.ctrlKey) || e.metaKey) {
            if (e.shiftKey && e.key === "z") {
              handleRedoChanges();
            } else if (e.key === "z") {
              handleUndoChanges();
            }
          }
        }}
      >
        {/* Use a type assertion to handle the complex type mismatch */}
        <ReactGrid
          rows={rows}
          columns={columns}
          // @ts-expect-error - ReactGrid's complex CellChange type doesn't match our simplified version
          onCellsChanged={handleChanges}
          onColumnResized={handleColumnResize}
          onContextMenu={simpleHandleContextMenu}
          stickyTopRows={1}
          stickyLeftColumns={1}
          highlights={highlights}
          enableRangeSelection
          enableColumnSelection
          enableRowSelection
        />
        <AddRowsDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          onAddRows={handleAddRows}
          showPeriodInput={showPeriodInput}
          frequency={frequency}
        />
        <AddRowsDialog
          isOpen={initialDialogOpen}
          setIsOpen={setInitialDialogOpen}
          onAddRows={handleInitialPeriodGeneration}
          showPeriodInput={true}
          frequency={frequency}
          title="Set Initial Period"
          description="Please specify a starting period to generate the timeline."
          defaultRows={1000}
          canCancel={false}
        />
      </div>
      <div className="sticky bottom-0 w-full flex justify-center p-5 bg-zinc-100 dark:bg-zinc-900 space-x-2 z-10">
        <Button variant="outline" onClick={cancel}>
          Cancel
        </Button>
        <Button onClick={handleApplyChanges}>
          Apply Changes
        </Button>
        <Button onClick={handleUndoChanges} size="icon" variant="outline">
          <Undo />
        </Button>
        <Button onClick={handleRedoChanges} size="icon" variant="outline">
          <Redo />
        </Button>
      </div>
    </div>
  );
}
