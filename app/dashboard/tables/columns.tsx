"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditTableDialog } from "./edit-table-dialog"
import { DeleteTableAlert } from "./delete-table-alert"
import { FavouriteButton } from "@/components/table/favourite-button"

// Import TableSearchResult from centralized type definitions
import { TableSearchResult } from "@/types/dashboard"

// Cell components to fix React Hooks rules violations
function ActionsCell({ row }: { row: Row<TableSearchResult> }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);
  const handleOpenAlert = () => setIsAlertOpen(true);
  const handleCloseAlert = () => setIsAlertOpen(false);

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
          <DropdownMenuItem onClick={handleOpenDialog}>
            Edit Table Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenAlert}>Delete Table</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Table Dialog */}
      {isDialogOpen && (
        <EditTableDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          tableId={row.original.id}
          tableName={row.original.name}
          tableDescription={row.original.description}
        />
      )}

      {/* Delete Table Alert */}
      {isAlertOpen && (
        <DeleteTableAlert
          isOpen={isAlertOpen}
          onClose={handleCloseAlert}
          tableId={row.original.id}
        />
      )}
    </>
  );
}

export const columns: ColumnDef<TableSearchResult>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => (
      <a href={`/dashboard/tables/${row.getValue("id")}`} className="group-hover:text-white"></a>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="flex items-center gap-2">
          <FavouriteButton
            id={row.getValue("id")}
            type="table"
            isFavourite={row.getValue("is_favourite")}
            size="sm"
          />
          <a href={`/dashboard/tables/${row.getValue("id")}`} className="group-hover:text-white font-semibold hover:font-bold text-secondary text-lg">
            {name}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "indicators",
    header: "Indicators",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
  {
    accessorKey: "is_favourite",
    header: "",
    cell: () => null,
  },
];
