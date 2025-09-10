"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define the boolean operators
const booleanOperators = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
  { value: "NOT", label: "NOT" },
];

const BooleanOperatorsDropdown = ({
  value,
  onChange,
}: {
  value: string; // Use the type of your value, assuming it's a string
  onChange: (value: string) => void; // Define the onChange prop type
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {value
            ? booleanOperators.find((operator) => operator.value === value)?.label
            : "Select operator..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search operator..." />
          <CommandList>
            <CommandEmpty>No operator found.</CommandEmpty>
            <CommandGroup>
              {booleanOperators.map((operator) => (
                <CommandItem
                  key={operator.value}
                  onSelect={() => {
                    onChange(operator.value); // Notify the form of the change
                    setOpen(false); // Close dropdown after selection
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === operator.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {operator.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BooleanOperatorsDropdown;
