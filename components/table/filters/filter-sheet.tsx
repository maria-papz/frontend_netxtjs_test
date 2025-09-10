import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Filter } from "lucide-react"
import { FilterForm } from "./filter-form"
import { FilterGroup, FilterSelections } from "@/types/dashboard"

interface FilterSheetProps {
  items: FilterGroup[]
  onFilterSubmit: (selected: FilterSelections) => void
}

export function FilterSheet({ items, onFilterSubmit }: FilterSheetProps) {
  const handleFormSubmit = (selected: FilterSelections) => {
    console.log("FilterSheet: Data", selected); // Add this log
    onFilterSubmit(selected); // Call the parent handler
  };

  console.log("items", items)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size='icon'>
          <Filter className="text-secondary h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine your search using filters.
          </SheetDescription>
        </SheetHeader>
        <FilterForm items={items} onSubmit={handleFormSubmit} />
        <SheetFooter>
          {/* <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose> */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
