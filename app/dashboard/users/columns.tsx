"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, User } from "lucide-react"

import { Button } from "@/components/ui/button"

// import { IndicatorData } from "./[id]/indicator-information-modal"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TableSearchResult = {
  id: string
  name: string
  description: string
  indicators: string[]
}

export const columns: ColumnDef<TableSearchResult>[] = [

  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <div>
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sort by Email
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
    cell: ({ row }) => {
      return (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-secondary/10 rounded-full h-12 w-12 group-hover:bg-white/10">
              <User className="h-8 w-8 text-secondary opacity-80 group-hover:text-white/80" />
            </div>
            <div>
              <div className="text-secondary font-semibold group-hover:text-white hover:font-bold">
          {row.getValue("email")}
              </div>
              {row.getValue("first_name")} {" "}
              {row.getValue("last_name")}
            </div>
          </div>
        </>
      )
    }
  },
  {
    accessorKey: "last_name",
    header: "",
    cell: () => {
      return (
        <></>
      )
    }
  },
  {
    accessorKey: "first_name",
    header: "",
    cell: () => {
      return (
        <></>
      )
    }
  },
]
