// TODO: Search doesn't work, need to fix it maybe try combobox instead of command

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
import { useState } from "react";

// Define the SearchCategory interface based on how it's used
interface SearchCategory {
  value: string;
  label: string;
}

const IndicatorsDropdown = ({
  searchCategories,
  value,
  onChange,
}: {
  searchCategories: SearchCategory[];
  value: string; // Use the type of your value, assuming it's a string
  onChange: (value: string) => void; // Define the onChange prop type
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? searchCategories.find((searchCategory) => searchCategory.value === value)?.label
            : "Select indicator..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search indicator..." />
            <CommandList>
              <CommandEmpty>No indicator found.</CommandEmpty>

              <CommandGroup>
                {searchCategories.map((searchCategory) => (
                  <CommandItem
                    key={searchCategory.value}
                    onSelect={() => {
                      onChange(searchCategory.value); // Notify the form of the change
                      setOpen(false); // Close dropdown after selection
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === searchCategory.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {searchCategory.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
				</Command>
      </PopoverContent>
    </Popover>
  );
};

export default IndicatorsDropdown;
