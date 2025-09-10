"use client"

import * as React from "react"
import { ChevronUp, Delete, Divide, Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import CreateIndicatorForm from "./create-indicator-form"
import { useToast } from "@/hooks/use-toast"
import { useCreateCustomIndicatorFormulaMutation } from "@/redux/services/indicatorsApiSlice"
import { FrequencyType, getFrequencyByDisplayName } from "@/types/dashboard"

interface createCustomProps {
  selectedRows: Array<{ code: string; name: string; frequency: string }>;
  codes: string[];
  text?: string;
  id?: string;
  refetch?: () => void;
}

export function CustomIndicatorDrawer({selectedRows,codes,text,id, refetch}: createCustomProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [indicatorId, setIndicatorId] = React.useState("");
  const { toast } = useToast();
  const [createCustomIndicatorFormula, { isLoading }] = useCreateCustomIndicatorFormulaMutation();

  // Check if all selected indicators have the same frequency
  const haveMatchingFrequencies = React.useMemo(() => {
    if (selectedRows.length <= 1) return true;

    // Normalize frequencies - convert any display names to raw values
    const normalizedFrequencies = selectedRows.map(row => {
      // Try to get raw frequency if it's a display name, otherwise use as-is
      const rawFrequency = getFrequencyByDisplayName(row.frequency) || row.frequency;
      return rawFrequency;
    });

    const frequencies = new Set(normalizedFrequencies);
    return frequencies.size === 1;
  }, [selectedRows]);

  // Get the common frequency if all match
  const commonFrequency = React.useMemo(() => {
    if (selectedRows.length === 0) return null;

    // Get the first row's frequency and normalize it
    const frequency = selectedRows[0].frequency;
    // Ensure we're using the raw frequency value, not the display name
    return getFrequencyByDisplayName(frequency) || frequency;
  }, [selectedRows]);

  const handleDrawerSubmit = () => {
    form.handleSubmit(handleSubmit)();
  }

  const [showCreateIndicatorForm, setShowCreateIndicatorForm] = React.useState(false);

  const handleSubmit = async (data: z.infer<typeof formulaSchema>) => {
    console.log(data);
    const idToUse = id || indicatorId;
    console.log("id", idToUse);

    try {
      const response = await createCustomIndicatorFormula({
        id: idToUse,
        formula: data.formula
      }).unwrap();

      toast({
        title: `Formula Submitted Successfully!`,
        description: `Indicator with id ${idToUse} has been filled with values of ${data.formula}.`,
      });

      console.log("Response:", response);
      if (refetch) {
        refetch();
      }

      setShowCreateIndicatorForm(false);
    } catch (error: unknown) {
      console.error("Error with formula:", error);
      toast({
      title: "Uh Oh! Error with formula",
      description: typeof error === 'object' && error !== null && 'data' in error && typeof error.data === 'object' && error.data !== null && 'error' in error.data
        ? String(error.data.error)
        : error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
      });
    }
    }


  const afterCreateIndicator = (id: string) => {
    setIndicatorId(id);
    setShowCreateIndicatorForm(true);
  }

  const formulaSchema = z.object({
    formula: z.string().min(1, "Formula is required")
      .refine((value) => {
        const tokens = value.trim().split(' ');
        const operators = ['+', '-', '*', '/', '^'];
        return !tokens.some((token, i) =>
          operators.includes(token) && (i === 0 || i === tokens.length - 1 || operators.includes(tokens[i - 1]) || operators.includes(tokens[i + 1]))
        );
      }, { message: "Invalid operator placement." })
      .refine((value) => {
        const tokens = value.trim().split(' ');
        const stack = [];
        for (const token of tokens) {
          if (token === '(') {
            stack.push(token);
          } else if (token === ')') {
            if (stack.length === 0 || stack.pop() !== '(') {
              return false;
            }
          }
        }
        return stack.length === 0;
      }, { message: "Mismatched parentheses." })
      .refine((value) => {
        const tokens = value.trim().split(' ');
        const operators = ['+', '-', '*', '/', '^'];
        return tokens.every((token) => {
          if (!isNaN(Number(token))) return true;
          if (operators.includes(token)) return true;
          if (token === '(' || token === ')') return true;
          if (token.startsWith('@')) {
            const indicator = selectedRows.find((row) => row.code === token.slice(1));
            return !!indicator;
          }
          return false;
        });
      }, { message: "Unknown code." })
      .refine((value) => {
        const tokens = value.trim().split(' ');
        const operators = ['+', '-', '*', '/', '^'];
        return tokens.every((token, i) => {
          if (isNaN(Number(token)) && !operators.includes(token) && token !== '(' && token !== ')') {
            if (i > 0 && !operators.includes(tokens[i - 1]) && tokens[i - 1] !== '(') {
              return false;
            }
            if (i < tokens.length - 1 && !operators.includes(tokens[i + 1]) && tokens[i + 1] !== ')') {
              return false;
            }
          }
          return true;
        });
      }, { message: "Codes/Numbers not at the start of the formula must be preceded by an operator or an opening parenthesis." })
      .refine((value) => {
        const tokens = value.trim().split(' ');
        const operators = ['+', '-', '*', '/', '^'];
        return tokens.every((token, i) => {
          if (isNaN(Number(token)) && !operators.includes(token) && token !== '(' && token !== ')') {
            if (i < tokens.length - 1 && !operators.includes(tokens[i + 1]) && tokens[i + 1] !== ')') {
              return false;
            }
          }
          return true;
        });
      }, { message: "Codes/Numbers not at the end of the formula must be followed by an operator or a closing parenthesis." })
      .refine((value) => {
        const tokens = value.trim().split(' ');
        return tokens.some((token) => isNaN(Number(token)) && !['+', '-', '*', '/', '^', '(', ')'].includes(token));
      }, { message: "No code present." })
      .refine((value) => {
        const tokens = value.trim().split(' ');
        const frequencies = new Set<string>();
        tokens.forEach((token) => {
          if (isNaN(Number(token)) && !['+', '-', '*', '/', '^', '(', ')'].includes(token)) {
            const indicator = selectedRows.find((row) => row.code === token.slice(1));
            if (indicator) {
              // Normalize the frequency before adding to the set
              const normalizedFrequency = getFrequencyByDisplayName(indicator.frequency) || indicator.frequency;
              frequencies.add(normalizedFrequency);
            }
          }
        });
        return frequencies.size === 1;
      }, { message: "Mismatched frequencies." }),
  });


  const form = useForm<z.infer<typeof formulaSchema>>({
    resolver: zodResolver(formulaSchema),
  });

  // Sync inputValue with react-hook-form's state
  React.useEffect(() => {
    form.setValue("formula", inputValue);
  }, [inputValue, form]);

  const handleButtonClick = (value: string) => {
    setInputValue((prev) => {
      const lastChar = prev.trim().split(' ').pop();
      if (!isNaN(Number(lastChar)) && !isNaN(Number(value)) || value=='.') {
        return prev + value;
      }
      if (selectedRows.some(row => row.code === value)) {
        return prev + ' @' + value;
      }
      return prev + ' ' + value;
    });
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          disabled={selectedRows.length === 0 || !haveMatchingFrequencies}
          className={text ? "" : "border-secondary font-semibold text-md bg-secondary rounded-full dark:bg-secondary dark:text-white dark:hover:bg-secondary/90"}
          title={!haveMatchingFrequencies ? "Selected indicators must have matching frequencies" : undefined}
        >
          {text ? <span><span className="font-semibold text-md text-secondary">Formula:</span> {text}</span> : "Create Custom Indicator"}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create Custom Indicator</DrawerTitle>
          <DrawerDescription>
            {showCreateIndicatorForm
              ? "Now, set the values of the custom indicator by applying operations on the selected indicators."
              : "First, set indicator information."}
          </DrawerDescription>
        </DrawerHeader>
        {showCreateIndicatorForm || text ? (
          <Form {...form}>
            <div className="flex justify-between">
              <div className="mx-auto w-full max-w-sm">
          <ScrollArea className="h-[50vh]">
            <div className="flex flex-col space-y-4">
              <FormField control={form.control} name="formula" render={({ field }) => (
                <FormItem>
            <FormControl>
              <div className="flex items-center space-x-2">
                <Input {...field} value={inputValue} />
                <Button variant="outline" onClick={() => setInputValue(inputValue.trim().split(' ').slice(0, -1).join(' '))}>
                  <Delete />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => handleButtonClick('+')}>
            <Plus className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('-')}>
            <Minus className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('*')}>
            <X />
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('/')}>
            <Divide />
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('^')}>
            <ChevronUp />
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('(')}>
            (
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick(')')}>
            )
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('.')}>
            .
                </Button>
                {Array.from({ length: 10 }, (_, number) => (
            <Button key={number} onClick={() => handleButtonClick(number.toString())}>
              {number}
            </Button>
                ))}
                {selectedRows.map((row: { code: string; name: string; frequency: string }) => (
            <Button key={row.code} title={row.name} className="bg-secondary" onClick={() => handleButtonClick(row.code)}>
              {row.code}
            </Button>
                ))}
              </div>
            </div>
          </ScrollArea>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleDrawerSubmit} disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
              <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </Form>
        ) : (
          <div className="flex justify-between">
            <div className="mx-auto w-full max-w-sm">
          <div className="flex flex-col space-y-4">
                <CreateIndicatorForm
                  codes={codes}
                  afterSubmit={(id: string) => afterCreateIndicator(id)}
                  isCustom={true}
                  fixedFrequency={commonFrequency as FrequencyType}
                />
                </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
