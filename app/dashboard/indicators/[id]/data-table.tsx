"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,

} from "@/components/ui/table"
import React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import EditDataButton from "@/components/animata/button/edit-data-button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  close?: () => void
  name: string
  isInfo?: boolean
  canEdit?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  close,
  name,
  isInfo,
  canEdit = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    }

  })

  return (
    <div className=" mx-auto p-4">

      <div className=" mx-auto ">
        <div className="pb-4 ">
      <div className="flex justify-end space-x-4  px-4">
        {/* <Button onClick={close}>
          <NotebookPen /> Edit Mode
        </Button> */}

        {!isInfo && (
          <>
            {canEdit && <EditDataButton onClick={close} />}
            <Button
              variant="outline"
              className="border-secondary text-secondary rounded-full"
              onClick={() => {
                // Type guard for columns with accessorKey
                type AccessorColumn = { accessorKey: string | number };

                // Helper function to get column identifier safely
                const getColumnId = (col: ColumnDef<TData, TValue>) => {
                  // If column has explicit id, use it
                  if (col.id) return col.id;

                  // Check if it's an accessor column using type guard
                  if ('accessorKey' in col) {
                    return String((col as unknown as AccessorColumn).accessorKey);
                  }

                  // Fallback
                  return '';
                };

                const csvContent = [
                  // Headers row
                  columns.map(getColumnId).join(","),
                  // Data rows
                  ...data.map((row) =>
                    columns.map((col) => {
                      const id = getColumnId(col);
                      return id ? String(row[id as keyof TData] ?? '') : '';
                    }).join(",")
                  ),
                ].join("\n");

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `${name}.csv`);
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Export CSV
            </Button>
          </>
        )}
      </div>
        </div>
        <ScrollArea className="h-[calc(100vh-250px)] overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </ScrollArea>
      </div>
    </div>
  )
}
