"use client"
// TODO: make category, region, country and unit names unique

import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { getFrequencyDisplayName } from "@/types/dashboard"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { EditIndicatorDialog } from "./edit-indicator-dialog"
import { DeleteIndicatorAlert } from "./delete-indicator-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { FavouriteButton } from "@/components/table/favourite-button"
import { Row } from "@tanstack/react-table"

// Using the centralized IndicatorTableSearchResult type from dashboard.ts
import { IndicatorTableSearchResult } from "@/types/dashboard"




function ActionsCell({ row }: {
  row: Row<IndicatorTableSearchResult>;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleOpenAlert = () => {
    setIsAlertOpen(true);
  };

  const handleCloseAlert = () => {
    setIsAlertOpen(false);
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            disabled={!row.getValue("edit")}
          >
            Edit Indicator Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleOpenAlert}
            disabled={!row.getValue("delete")}
          >
            Delete Indicator
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Table Dialog */}
      {isDialogOpen && (
        <EditIndicatorDialog
          isOpen={isDialogOpen}
          setOpen={setIsDialogOpen}
          id={row.getValue("id")}
          name={row.getValue("name")}
          code={row.getValue("code")}
          description={row.getValue("description")}
          source={row.getValue("source")}
          frequency={row.getValue("frequency")}
          otherFrequency={row.getValue("other_frequency")}
          seasonallyAdjusted={row.getValue("is_seasonally_adjusted")}
          baseYear={row.getValue("base_year")}
          isCustom={row.getValue("is_custom")}
          country={row.getValue("country")}
          region={row.getValue("region")}
          category={row.getValue("category")}
          currentPrices={row.getValue("currentPrices")}
          unit={row.getValue("unit")}
        />
      )}

      {/* Delete Table Alert */}
      {isAlertOpen && (
        <DeleteIndicatorAlert
          isOpen={isAlertOpen}
          onClose={handleCloseAlert}
          id={row.getValue("id")}
        />
      )}
    </>
  );
}

export const columns: ColumnDef<IndicatorTableSearchResult>[] = [

  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },

  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
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
      )
    },
    cell: ({ row }) => {

      const nam = row.getValue("code") as React.ReactNode;
      return (
        <div style={{ maxWidth: '400px', whiteSpace: 'normal' }}>
          <div className="flex items-center gap-2">
            <FavouriteButton
              id={row.getValue("id")}
              type="indicator"
              isFavourite={row.getValue("is_favourite")}
              size="sm"
            />
            <a href={`/dashboard/indicators/${row.getValue("id")}`}>
              <div className={`text-secondary text-lg ${row.getIsSelected() ? 'font-bold' : 'font-semibold group-hover:text-white hover:font-bold'}`}>
              {nam}
              </div>
              <div className={`text-secondary ${row.getIsSelected() ? 'font-medium' : 'font-normal group-hover:text-white'} italic`}>
              {row.getValue("name")}
              </div>
              <div>
              {row.getValue("description")}
              </div>
            </a>
          </div>
        </div>
      )
    },
    },

  {
    accessorKey: "source",
    header: ({ column }) => {

      return (
        <div>
          Source
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

      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {

      return (
        <div>
          Category
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

      )
    },
  },
  {
    accessorKey: "country",
    header: ({ column }) => {

      return (
        <div>
          Country
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

      )
    },
  },
  {
    accessorKey: "region",
    header: ({ column }) => {

      return (
        <div>
          Regions
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

      )
    },
  },
  {
    accessorKey: "unit",
    header: ({ column }) => {

      return (
        <div>
          Unit
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

      )
    },
  },
  {
    accessorKey: "base_year",
    header: ({ column }) => {

      return (
        <div>
          Base Year
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

      )
    },
  },
  {
    accessorKey: "is_seasonally_adjusted",
    header: "Seasonally Adjusted",
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }) => {
      const frequency = row.getValue("frequency") as string;
      const formattedFrequency = frequency ? getFrequencyDisplayName(frequency) : "";

      return (
        <span>
          {row.getValue("other_frequency") || formattedFrequency}
        </span>
      );
    }
  },
  {
    accessorKey: "is_custom",
    header: "Custom",
  },
  {
    accessorKey: "currentPrices",
    header: "Current Prices",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
  {
    accessorKey: "name",
    header:"",
    // header: ({ column }) => {
    //   return (
    //   <Button
    //     variant="ghost"
    //     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //   >
    //     <ArrowUpDown className="h-4 w-4" />
    //   </Button>
    //   )
    // },
    cell: ()=>{
      return null; // Make the row invisible
    }
    },
    {
    accessorKey: "other_frequency",
    header: "",
    cell: () => {
      return null; // Make the row invisible
    }
  },
    {
    accessorKey: "description",
    header: "",
    cell: () => {
      return null;
    }
  },
  {
    accessorKey: "id",
    header: "",
    cell:()=>{
      return null;
    }
  },
  {
    accessorKey: "edit",
    header: "",
    cell: () => {
      return null;
    }
  },
  {
    accessorKey: "delete",
    header: "",
    cell: () => {
      return null;
    }
  },
  {
    accessorKey: "access_level",
    header: "",
    cell: () => {
      return null;
    }
  },
  {
    accessorKey: "is_favourite",
    header: "",
    cell: () => {
      return null;
    }
  },
]
