import * as React from "react";
import { ReactGrid, Column, Row, CellChange, TextCell, Id, MenuOption, CellLocation, Highlight, SelectionMode } from "@silevis/reactgrid";
import "./styles/grid-style.css";
import { Undo, Redo, Grid2x2Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import { AddRowsDialog } from "./add-rows-dialog";
import { useToast } from "@/hooks/use-toast";
import generateSequence, {generateStartPeriod } from "./helpers/period-sequence";
import { useUpdateIndicatorDataMutation } from "@/redux/services/indicatorsApiSlice";

interface CustomGridProps {
  values: IndicatorValues[];
  headerRow: Row;
  id: string;
  frequency: string;
  cancel: () => void;
}

interface IndicatorValues {
  period?: string;
  value?: number;
  id?: string;
}

interface InsertRowChange {
  type: "insertRow";
  rowIndex: number;
  numRows: number;
  startPeriod?: string;
}

const getColumns = (): Column[] => [
  { columnId: "period", width: 150, resizable: true },
  { columnId: "value", width: 150, resizable: true }
];

export function CustomGrid({ values, headerRow, id, frequency, cancel }: CustomGridProps) {
  const [val, setVal] = React.useState(values);
  const [cellChangesIndex, setCellChangesIndex] = React.useState(-1);
  const [cellChanges, setCellChanges] = React.useState<(CellChange<TextCell>[] | InsertRowChange)[]>([]);
  const [columns, setColumns] = React.useState<Column[]>(getColumns());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [insertRowIndex, setInsertRowIndex] = React.useState<number | null>(null);
  const { toast } = useToast();
  const [showPeriodInput, setShowPeriodInput] = React.useState<boolean>(false);
  const [initialDialogOpen, setInitialDialogOpen] = React.useState(false);
  const [updateIndicatorData] = useUpdateIndicatorDataMutation();

  React.useEffect(() => {
    if (values) {
      // Filter out undefined or null values first
      const validValues = values.filter(v => v !== null && v !== undefined);

      console.log("Initial values:", validValues.length);

      // Handle custom frequency differently - don't generate sequences
      if (frequency.toUpperCase() === 'CUSTOM') {
        if (validValues.length > 0) {
          // Just use the existing values for custom frequency
          setVal(validValues);
        } else {
          // Create empty rows for custom frequency
          const emptyRows = Array.from({ length: 1000 }, () => ({
            id: undefined,
            period: "",
            value: undefined
          }));
          setVal(emptyRows);
        }
      } else {
        // For standard frequencies, ensure we have a complete sequence of periods without gaps
        const existingPeriods = validValues
          .filter(v => v.period) // Filter out undefined periods
          .map(v => v.period);

        console.log("Existing periods:", existingPeriods);

        if (existingPeriods.length > 0) {
          // Sort existing periods chronologically
          existingPeriods.sort((a, b) => {
            if (!a || !b) return 0;
            return a.localeCompare(b);
          });

          const firstPeriod = existingPeriods[0];
          const lastPeriod = existingPeriods[existingPeriods.length - 1];

          console.log("First period:", firstPeriod, "Last period:", lastPeriod, "Frequency:", frequency);

          // CRITICAL FIX: Instead of generating a new sequence, ensure we include the exact existing periods
          // Create a map of existing values for quick lookup
          const valueMap = new Map(
            validValues.filter(v => v.period).map(v => [v.period, v])
          );

          // Extract all unique periods, ensuring we don't lose any
          const uniquePeriods = Array.from(new Set(existingPeriods.filter(Boolean)));

          // Create an array with all existing values in their exact periods
          const existingValues = uniquePeriods.map(period => {
            if (valueMap.has(period)) {
              return valueMap.get(period) as IndicatorValues;
            } else {
              return { period, value: undefined, id: undefined };
            }
          });

          console.log("First existing value:", existingValues[0]);

          // Add additional future periods
          const futurePeriods = generateSequence([lastPeriod as string], 1000, true, undefined, frequency);
          console.log("Future periods:", futurePeriods.length);

          const futureValues = futurePeriods.slice(1).map(period => ({
            period,
            value: undefined,
            id: undefined
          }));

          // Combine all values, making sure we DON'T lose the original periods
          const allValues = [...existingValues, ...futureValues];

          // Sort final array by period
          allValues.sort((a, b) => {
            if (!a || !a.period) return 1;
            if (!b || !b.period) return -1;
            return a.period.localeCompare(b.period);
          });

          console.log("Setting values:", allValues.length, "First value:", allValues[0]);
          setVal(allValues);
        } else {
          // If no periods exist, initialize with empty rows
          console.log("No existing periods, generating default sequence");
          const startPeriod = generateStartPeriod(frequency);
          console.log("Start period:", startPeriod);

          const newPeriods = generateSequence([], 1000, true, startPeriod, frequency);
          console.log("Generated periods:", newPeriods.length);

          const emptyRows = newPeriods.map(period => ({
            period,
            value: undefined,
            id: undefined
          }));

          setVal(emptyRows);
        }
      }
    } else {
      setVal([]);
    }

    const hasData = values && values.some(v => v && v.value !== undefined);
    setShowPeriodInput(!hasData);

    // Only show the initial period dialog if:
    // 1. There's no data
    // 2. We have values to work with
    // 3. The frequency is NOT custom
    if (!hasData && values && values.length > 0 && frequency.toUpperCase() !== 'CUSTOM') {
      setInitialDialogOpen(true);
    }
  }, [values, frequency]);

  const handleAddRows = (numRows: number, startPeriod?: string) => {
    if (insertRowIndex === null) return;

    setVal((prevVal) => {
      const existingPeriods = prevVal
        .map(v => v.period)
        .filter((p): p is string => p !== undefined && p !== "");

      let newRows: IndicatorValues[] = [];

      // For custom frequency, don't generate periods, just add empty rows
      if (frequency.toUpperCase() === 'CUSTOM') {
        newRows = Array.from({ length: numRows }, () => ({ id: undefined, period: "", value: undefined }));
      }
      else if (existingPeriods.length === 0 && startPeriod) {
        // Pass frequency to generateSequence
        console.log(`Generating sequence with frequency: ${frequency}`);
        const newPeriods = generateSequence([], numRows, true, startPeriod, frequency);
        newRows = newPeriods.map(period => ({ id: undefined, period, value: undefined }));
      }
      else if (existingPeriods.length > 0) {
        const referenceIndex = Math.max(0, insertRowIndex - 1);
        const forward = insertRowIndex > 0;

        console.log(`Adding rows ${forward ? 'after' : 'before'} index ${referenceIndex}, frequency: ${frequency}`);

        // Select appropriate periods based on insertion direction
        const selectedPeriods = forward
          ? prevVal.slice(0, insertRowIndex).map(v => v.period).filter((p): p is string => p !== undefined && p !== "")
          : prevVal.slice(insertRowIndex).map(v => v.period).filter((p): p is string => p !== undefined && p !== "");

        // Pass frequency to generateSequence
        const newPeriods = generateSequence(selectedPeriods, numRows, forward, undefined, frequency);

        // For weekly frequencies when inserting at the beginning, ensure periods are in correct order
        if (frequency.toLowerCase() === 'weekly' && !forward) {
          console.log("Handling weekly backward insertion, periods:", newPeriods);
        }

        newRows = newPeriods.map(period => ({ id: undefined, period, value: undefined }));
      }
      else {
        newRows = Array.from({ length: numRows }, () => ({ id: undefined, period: "", value: undefined }));
      }

      const updatedValues = [
        ...prevVal.slice(0, insertRowIndex),
        ...newRows,
        ...prevVal.slice(insertRowIndex)
      ];

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

  const handleInitialPeriodGeneration = (numRows: number, startPeriod?: string) => {
    // For custom frequency, don't generate periods, just add empty rows
    if (frequency.toUpperCase() === 'CUSTOM') {
      const emptyRows = Array.from({ length: 1000 }, () => ({
        id: undefined,
        period: "",
        value: undefined
      }));

      setVal(emptyRows);
      setInitialDialogOpen(false);
      return;
    }

    if (!startPeriod) {
      startPeriod = generateStartPeriod(frequency);
    }

    console.log(`Initial period generation with frequency: ${frequency}, start period: ${startPeriod}`);
    const newPeriods = generateSequence([], 1000, true, startPeriod, frequency);
    const newRows = newPeriods.map(period => ({ id: undefined, period, value: undefined }));

    setVal(newRows);
    setInitialDialogOpen(false);
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

      setVal((prevVal) => {
        if ("type" in lastChange && lastChange.type === "insertRow") {
          const { rowIndex, numRows } = lastChange;
          return prevVal.filter((_, index) => index < rowIndex || index >= rowIndex + numRows);
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

      setVal((prevVal) => {
        if ("type" in nextChange && nextChange.type === "insertRow") {
          const { rowIndex, numRows, startPeriod } = nextChange;

          const existingPeriods = prevVal
            .map(v => v.period)
            .filter((p): p is string => p !== undefined && p !== "");

          let newRows: IndicatorValues[] = [];

          // Check if frequency is custom - if so, just add empty rows
          if (frequency.toUpperCase() === 'CUSTOM') {
            newRows = Array.from({ length: numRows }, () => ({ id: undefined, period: "", value: undefined }));
          }
          else if (existingPeriods.length === 0 && startPeriod) {
            // Pass frequency to generateSequence
            const newPeriods = generateSequence([], numRows, true, startPeriod, frequency);
            newRows = newPeriods.map(period => ({ id: undefined, period, value: undefined }));
          }
          else if (existingPeriods.length > 0) {
            const forward = rowIndex > 0;
            const selectedPeriods = forward
              ? prevVal.slice(0, rowIndex).map(v => v.period).filter((p): p is string => p !== undefined && p !== "")
              : prevVal.slice(rowIndex).map(v => v.period).filter((p): p is string => p !== undefined && p !== "");
            // Pass frequency to generateSequence
            const newPeriods = generateSequence(selectedPeriods, numRows, forward, undefined, frequency);
            newRows = newPeriods.map(period => ({ id: undefined, period, value: undefined }));
          }
          else {
            newRows = Array.from({ length: numRows }, () => ({ id: undefined, period: "", value: undefined }));
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
    if (val.length === 0) {
      setHighlights([]);
      return;
    }

    const highlightedRows: Highlight[] = [];

    const lastNonUndefinedRowIndex = val
      .map((v, idx) => ({ ...v, idx }))
      .reverse()
      .find(v => v.value !== undefined)?.idx;

    if (lastNonUndefinedRowIndex !== undefined) {
      const nextRowIndex = Math.min(lastNonUndefinedRowIndex + 1, val.length - 1);
      highlightedRows.push(
        { columnId: "period", rowId: `row-${nextRowIndex}`, borderColor: "#879014" },
        { columnId: "value", rowId: `row-${nextRowIndex}`, borderColor: "#879014" }
      );
    }

    setHighlights(highlightedRows);
  }, [val]);

  const handleApplyChanges = async () => {
    const lastNonUndefinedRowIndex = val
      .map((v, idx) => ({ ...v, idx }))
      .reverse()
      .find(v => v.value !== undefined && v.period)?.idx;

    if (lastNonUndefinedRowIndex === undefined) {
      toast({
        title: "Validation Error",
        description: "No valid data to post. Add both period and value.",
        variant: "destructive",
      });
      return;
    }

    const dataToPost = val
      .slice(0, lastNonUndefinedRowIndex + 1)
      .filter(row => row.value !== undefined && row.period);

    const periods = dataToPost.map(row => row.period).filter(Boolean) as string[];

    // Skip period validation for custom frequency
    if (periods.length > 1 && frequency.toUpperCase() !== 'CUSTOM') {
      let isValid = true;
      for (let i = 1; i < periods.length; i++) {
        const expectedNext = generateSequence([periods[i-1]], 1, true, undefined, frequency)[0];
        if (periods[i] !== expectedNext) {
          console.log(`Expected ${expectedNext} but got ${periods[i]} at index ${i}`);
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

    try {
      await updateIndicatorData({ id, data: dataToPost }).unwrap();
      
      toast({
        title: "Success",
        description: "Changes applied successfully.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'data' in error && typeof error.data === 'object' && error.data !== null && 'message' in error.data) 
          ? String(error.data.message) 
          : "Failed to apply changes";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const applyNewValue = (
    changes: CellChange<TextCell>[],
    prevValue: IndicatorValues[],
    usePrevValue: boolean = false
  ): IndicatorValues[] => {
    const updated = [...prevValue];
    changes.forEach((change) => {
      const valueIndex = Number((change.rowId as string).replace("row-", ""));
      const fieldName = change.columnId as keyof IndicatorValues;
      const cell = usePrevValue ? change.previousCell : change.newCell;
      if (updated[valueIndex]) {
        if (fieldName === "value") {
          updated[valueIndex][fieldName] = cell.text === "" ? undefined : Number(cell.text);
        } else if (fieldName === "period") {
          updated[valueIndex][fieldName] = cell.text;
        }
      }
    });
    return updated;
  };

  const getRows = (values: IndicatorValues[]): Row[] => [
    headerRow as unknown as Row,
    ...values.map((value, idx) => {
      const isDisabled = value.value === undefined;

      return {
        rowId: `row-${idx}`,
        cells: [
          {
            type: "text",
            text: value.period || "",
            className: isDisabled ? "disabled-text" : ""
          } as TextCell,
          {
            type: "text",
            text: value.value?.toString() || ""
          } as TextCell
        ]
      } as Row;
    })
  ];

  const handleChanges = (changes: CellChange[]) => {
    setVal((prevVal) => applyNewValue(changes as CellChange<TextCell>[], prevVal));
    setCellChanges([...cellChanges.slice(0, cellChangesIndex + 1), changes as CellChange<TextCell>[]]);
    setCellChangesIndex(cellChangesIndex + 1);
  };

  const rows = getRows(val);

  const handleColumnResize = (ci: Id, width: number) => {
    setColumns((prevColumns) => {
      const columnIndex = prevColumns.findIndex(el => el.columnId === ci);
      const updatedColumn = { ...prevColumns[columnIndex], width };
      prevColumns[columnIndex] = updatedColumn;
      return [...prevColumns];
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
        <ReactGrid
          rows={rows}
          columns={columns}
          onCellsChanged={handleChanges}
          onColumnResized={handleColumnResize}
          stickyTopRows={1}
          onContextMenu={simpleHandleContextMenu}
          enableColumnSelection
          enableRangeSelection
          enableFillHandle
          highlights={highlights}
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
