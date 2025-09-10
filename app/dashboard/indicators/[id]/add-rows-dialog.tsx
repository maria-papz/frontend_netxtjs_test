import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateStartPeriod, parsePeriod, mapApiFrequencyToEnum } from "./helpers/period-sequence";
import { useToast } from "@/hooks/use-toast";
import { isValidWeeklyPeriod } from './helpers/weekly-period-helper';

interface AddRowsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddRows: (numRows: number, startPeriod?: string) => void;
  showPeriodInput?: boolean;
  frequency?: string;
  title?: string;
  description?: string;
  defaultRows?: number;
  canCancel?: boolean;
}

export function AddRowsDialog({
  isOpen,
  setIsOpen,
  onAddRows,
  showPeriodInput = false,
  frequency = "monthly", // Default value in case not provided
  title = "Add Rows",
  description,
  defaultRows = 10,
  canCancel = true,
}: AddRowsDialogProps) {
  const [numRows, setNumRows] = useState<number>(defaultRows);
  const [startPeriod, setStartPeriod] = useState<string>("");
  const [isValidPeriod, setIsValidPeriod] = useState<boolean>(true);
  const { toast } = useToast();

  // Update when the dialog opens to ensure we have the correct frequency
  useEffect(() => {
    if (isOpen) {
      setNumRows(defaultRows);

      // Generate appropriate default period based on the frequency
      console.log(`Generating start period with frequency: ${frequency}`);
      const generatedPeriod = generateStartPeriod(frequency);
      console.log(`Generated period: ${generatedPeriod}`);
      setStartPeriod(generatedPeriod);
      setIsValidPeriod(true);
    }
  }, [isOpen, frequency, defaultRows]);

  // Validate period format based on frequency
  const validatePeriod = (period: string): boolean => {
    if (!period) return false;

    // Special handling for weekly frequency
    if (frequency.toLowerCase() === 'weekly') {
      return isValidWeeklyPeriod(period);
    }

    // Match patterns based on frequency for other frequencies
    const patterns: Record<string, RegExp> = {
      'minute': /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
      'hourly': /^\d{4}-\d{2}-\d{2} \d{2}:00$/,
      'daily': /^\d{4}-\d{2}-\d{2}$/,
      'biweekly': /^\d{4}-W\d{1,2}$/,
      'monthly': /^\d{4}-\d{2}$/,
      'bimonthly': /^\d{4}-\d{2}$/,
      'quarterly': /^\d{4}-Q[1-4]$/,
      'triannual': /^\d{4}-T[1-3]$/,
      'semiannual': /^\d{4}-H[1-2]$/,
      'annual': /^\d{4}$/
    };

    const pattern = patterns[frequency.toLowerCase()];
    if (!pattern) return false;

    if (!pattern.test(period)) return false;

    // Try to parse the period to catch any other validation issues
    try {
      const freqEnum = mapApiFrequencyToEnum(frequency);
      parsePeriod(period, freqEnum);
      return true;
    } catch (error) {
      console.error(`Period validation error:`, error);
      return false;
    }
  };

  const handlePeriodChange = (value: string) => {
    setStartPeriod(value);
    setIsValidPeriod(validatePeriod(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numRows <= 0) {
      toast({
        title: "Invalid number of rows",
        description: "Please enter a positive number of rows.",
        variant: "destructive",
      });
      return;
    }

    // Only validate period if we're showing the input
    if (showPeriodInput) {
      if (!startPeriod) {
        toast({
          title: "Missing start period",
          description: "Please enter a start period.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidPeriod) {
        toast({
          title: "Invalid period format",
          description: `Please enter a valid ${frequency} period format.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Log the period and frequency we're using
    console.log(`Adding rows with frequency: ${frequency}, start period: ${startPeriod || 'not specified'}`);

    // Call the onAddRows function with the rows and period
    if (showPeriodInput) {
      onAddRows(numRows, startPeriod);
    } else {
      onAddRows(numRows);
    }

    if (canCancel) {
      setIsOpen(false);
    }
  };

  // Helper function to display the expected format
  const getFormatDescription = (): string => {
    switch (frequency.toLowerCase()) {
      case 'minute': return 'YYYY-MM-DD HH:MM';
      case 'hourly': return 'YYYY-MM-DD HH:00';
      case 'daily': return 'YYYY-MM-DD';
      case 'weekly':
      case 'biweekly': return 'YYYY-WNN';
      case 'monthly':
      case 'bimonthly': return 'YYYY-MM';
      case 'quarterly': return 'YYYY-QN';
      case 'triannual': return 'YYYY-TN';
      case 'semiannual': return 'YYYY-HN';
      case 'annual': return 'YYYY';
      default: return 'period format';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (canCancel) {
          setIsOpen(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || `Specify how many rows you want to add${showPeriodInput ? " and the starting period" : ""}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numRows" className="text-right">
                Number of Rows
              </Label>
              <Input
                id="numRows"
                type="number"
                min="1"
                max="1000"
                value={numRows}
                onChange={(e) => setNumRows(parseInt(e.target.value) || 1)}
                className="col-span-3"
                autoFocus={!showPeriodInput}
                disabled={!canCancel && defaultRows === 1000}
              />
            </div>

            {showPeriodInput && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startPeriod" className="text-right">
                  Start Period
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="startPeriod"
                    type="text"
                    value={startPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className={`${!isValidPeriod && startPeriod ? 'border-red-500' : ''}`}
                    autoFocus={showPeriodInput}
                    placeholder={getFormatDescription()}
                  />
                  {!isValidPeriod && startPeriod && (
                    <p className="text-xs text-red-500">
                      Invalid format. Use {getFormatDescription()}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {canCancel && (
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={showPeriodInput && (!startPeriod || !isValidPeriod)}
            >
              {canCancel ? "Add Rows" : "Generate Timeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
