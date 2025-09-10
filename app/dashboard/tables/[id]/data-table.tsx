"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnSizingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { LineGraph } from "./line-graph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CsvDownloader from "react-csv-downloader";
import { ColumnResizer } from "./column-resizer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Info } from "lucide-react";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import IndicatorInformationModal from "./indicator-information-modal";
import AddIndicatorsModal from "./add-indicators-modal";
import { DeleteIndicatorsAlert } from "./delete-indicators-alert";
import { IndicatorMetadata, TableRowData } from "@/types/dashboard";

// Updated type for the props
interface DataTableProps<TData extends TableRowData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  indicatorsObject: Record<string, IndicatorMetadata>;
  tableId: string;
  tableName: string;
}

export function DataTable<TData extends TableRowData, TValue>({
  columns,
  data,
  indicatorsObject,
  tableId,
  tableName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [colSizing, setColSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [indicator, setIndicator] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColSizing,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      columnSizing: colSizing,
    },
  });

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div>
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="graph">Graph View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center py-4">
                    <Input
                      placeholder="Filter period..."
                      value={
                        (table.getColumn("period")?.getFilterValue() as string) ?? ""
                      }
                      onChange={(event) =>
                        table.getColumn("period")?.setFilterValue(event.target.value)
                      }
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <AddIndicatorsModal items={[]} />
                    <CsvDownloader
                      filename={tableName}
                      extension=".csv"
                      separator=","
                      datas={data.map((row) =>
                        Object.fromEntries(
                          Object.entries(row).map(([key, value]) => [
                            key.replace(/,/g, ""), // Remove commas from column headers
                            // Ensure null values are converted to empty strings to match required type
                            value === null
                              ? ""
                              : (typeof value === "string" ? value.replace(/,/g, "") : String(value))
                          ])
                        ) as { [key: string]: string | null | undefined }
                      )}
                    >
                      <Button className="rounded-full">Download CSV</Button>
                    </CsvDownloader>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto rounded-full">
                          Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {table
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => {
                            return (
                              <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                  column.toggleVisibility(!!value)
                                }
                              >
                                {column.id}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table style={{ width: table.getTotalSize() }}>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead
                                key={header.id}
                                className="relative overflow-hidden text-clip whitespace-nowrap w-full"
                                style={{
                                  width: header.getSize(),
                                }}
                              >
                                {header.isPlaceholder ? null : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                    </div>
                                    {header.id !== "period" ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          onClick={() => {
                                            setIndicator(header.id);
                                            handleModalOpen();
                                          }}
                                        >
                                          <Info />
                                        </Button>
                                        {indicatorsObject[header.id] && (
                                          <DeleteIndicatorsAlert
                                            tableId={tableId}
                                            tableName={tableName}
                                            indicatorId={indicatorsObject[header.id].id}
                                            indicatorName={header.id}
                                          />
                                        )}
                                      </>
                                    ) : null}
                                  </div>
                                )}
                                <ColumnResizer header={header} />
                              </TableHead>
                            );
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
                              <TableCell
                                key={cell.id}
                                style={{
                                  width: cell.column.getSize(),
                                  minWidth: cell.column.columnDef.minSize,
                                }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="py-4 text-start">
                  <DataTablePagination table={table} />
                </div>

                {modalOpen && (
                  <IndicatorInformationModal
                    indicatorsObject={indicatorsObject}
                    isOpen={modalOpen}
                    onClose={handleCloseModal}
                    indicator={indicator}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graph">
          <Card>
            <CardContent className="p-4">
              <LineGraph
                data={data as unknown as Record<string, string | number>[]}
                indicatorsObject={indicatorsObject as unknown as Record<string, {
                  code?: string;
                  name?: string;
                  [key: string]: unknown;
                }>}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
