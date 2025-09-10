"use client"

import * as React from "react"
// TODO: sort out filtering issue

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CreateTableSheet from "../../app/dashboard/create-table-sheet"
import AddIndicatorButton from "@/components/animata/button/add-indicator-button"
import { FilterSheet } from "./filters/filter-sheet"
import { Badge } from "@/components/ui/badge"
import { BookmarkIcon, ChevronDown, Search, X } from "lucide-react"
import { DataTablePagination } from "./data-table-pagination"
import CreateIndicatorSheet from "@/app/dashboard/indicators/create-indicator-sheet"
import { CustomIndicatorDrawer } from "../../app/dashboard/indicators/custom-indicator-drawer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddIndicatorsModal from "@/app/dashboard/tables/[id]/add-indicators-modal"
import {
  FilterGroup,
  FilterSelections,
  IndicatorMetadata,
  TableMetadata,
  MetadataSet,
  AdvancedFilterResult
} from "@/types/dashboard"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  favoriteData?: TData[]
  metadata: TableMetadata[] | IndicatorMetadata[] | null
  metadataset: MetadataSet | null
  type: "table" | "indicator" | string
}

export function SearchTable<TData extends { id: string; is_favourite?: boolean; name?: string; code?: string; description?: string; }, TValue>({
  columns,
  data,
  favoriteData = [],
  metadata,
  metadataset,
  type,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [activeTab, setActiveTab] = React.useState<string>("all")
  const [searchValue, setSearchValue] = React.useState<string>("")
  const [favoriteToggleCount, setFavoriteToggleCount] = React.useState(0)
  const [advancedFilter, setAdvancedFilter] = React.useState<AdvancedFilterResult | null>(null)

  // Initialize filtered data based on active tab
  const [filteredData, setFilteredData] = React.useState<TData[]>(() =>
    activeTab === "all" ? data : favoriteData
  )

  // Recalculate favorites when data changes or when favorites are toggled
  // We use a ref to hold the toggle count to avoid useMemo dependency issues
  const toggleCountRef = React.useRef(favoriteToggleCount);
  toggleCountRef.current = favoriteToggleCount; // Update ref when count changes

  const calculatedFavoriteData = React.useMemo(() => {
    // Force recalculation by reading from data only, while still being
    // reactive to favorite changes through the effect that updates favoriteToggleCount
    return data.filter((item) => item.is_favourite === true);
  }, [data]);

  // Update filtered data when tab changes or source data updates
  React.useEffect(() => {
    if (activeTab === "all") {
      setFilteredData(data);
    } else {
      // Use our calculated favorite data instead of the prop
      setFilteredData(calculatedFavoriteData || []);
    }
    // Reset search when changing tabs
    setSearchValue("");
  }, [data, calculatedFavoriteData, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  const [codes, setCodes] = useState<string[]>([])
  const [items, setItems] = useState<FilterGroup[]>([]);

  React.useEffect(() => {
    if ((type === "table" || type === "indicator") && metadataset) {
      if(type === "indicator"){
        setCodes(metadataset.code || [])
      }

      // Create filter groups from metadata
      const createFilterGroup = <K extends keyof MetadataSet>(
        groupName: string,
        fieldName: K
      ): FilterGroup => {
        const values = Array.isArray(metadataset[fieldName])
          ? (metadataset[fieldName] as string[]).filter(item => item !== null)
          : [];

        return {
          group: groupName,
          items: values.map(value => ({
            id: String(value),
            label: String(value)
          }))
        };
      };


      // Build the filter groups
      setItems([
        createFilterGroup("category", type === "table" ? "indicator_category" : "category"),
        createFilterGroup("unit", type === "table" ? "indicator_unit" : "unit"),
        createFilterGroup("base_year", type === "table" ? "indicator_base_year" : "base_year"),
        createFilterGroup("frequency", type === "table" ? "indicator_frequency" : "frequency"),
        createFilterGroup("country", type === "table" ? "indicator_country" : "country"),
        createFilterGroup("regions", type === "table" ? "indicator_regions" : "region"),
        {
          group: "seasonally_adjusted",
          items: [
            { id: "true", label: "True" },
            { id: "false", label: "False" },
          ],
        },
        {
          group: "custom_indicator",
          items: [
            { id: "true", label: "True" },
            { id: "false", label: "False" },
          ],
        },
        {
          group: "current_prices",
          items: [
            { id: "true", label: "True" },
            { id: "false", label: "False" },
          ],
        },
        createFilterGroup("source", type === "table" ? "indicator_source" : "source"),
      ]);
    }
  }, [metadataset, type]);

  const [selected, setSelected] = useState<FilterSelections>({});

  const handleSearch = (value: string) => {
    setSearchValue(value);

    // Use the appropriate data source based on active tab
    const dataSource = activeTab === "all" ? data : calculatedFavoriteData || [];

    if (!value.trim()) {
      // If search is empty, show all data for the current tab
      setFilteredData(dataSource);
      return;
    }

    // Perform search across multiple columns
    const searchResults = dataSource.filter(row => {
      const nameMatch = row.name?.toString().toLowerCase().includes(value.toLowerCase());
      const codeMatch = row.code?.toString().toLowerCase().includes(value.toLowerCase());
      const descMatch = row.description?.toString().toLowerCase().includes(value.toLowerCase());

      // Return true if ANY column matches
      return nameMatch || codeMatch || descMatch;
    });

    setFilteredData(searchResults);
  };

  const handleFilterSubmit = (newSelected: FilterSelections) => {
    // Clear advanced filter when using regular filters
    setAdvancedFilter(null);
    setSelected(newSelected);

    if (type === "table" || type === "indicator") {
      // Use the appropriate data source based on active tab
      const dataSource = activeTab === "all" ? data : calculatedFavoriteData || [];

      // For tables, use metadata; for indicators, use the data source itself
      const metadataSource = type === "table"
        ? (metadata as TableMetadata[])
        : (dataSource as unknown as IndicatorMetadata[]);

      const filteredIndicators = metadataSource
        .filter((element) => {
          return items.every((group) => {
            const selectedValues = newSelected[group.group] || [];

            // Get correct field name based on type
            const fieldName = type === "table" && group.group !== "regions"
              ? `indicator_${group.group}`
              : group.group === "regions" && type === "indicator"
                ? "region"
                : group.group;

            // Extract values
            let elementValues: (string | number | boolean)[] = [];
            const fieldValue = element[fieldName as keyof typeof element];

            if (Array.isArray(fieldValue)) {
              elementValues = fieldValue as (string | number | boolean)[];
            } else if (fieldValue !== undefined && fieldValue !== null) {
              elementValues = [fieldValue as string | number | boolean];
            }

            return (
              selectedValues.length === 0 ||
              selectedValues.some((value: string) => {
                if (value === "true" || value === "false") {
                  return elementValues.includes(value === "true");
                }
                return (elementValues as (string | number | boolean)[]).map(String).includes(value);
              })
            );
          });
        })
        .map((element) => element.id);

      const newFilteredData = dataSource.filter(row =>
        filteredIndicators.includes(row.id)
      );

      setFilteredData(newFilteredData);
    }
  };

  // Updated handleAdvancedFilter function to maintain the filter badge even with no results
  const handleAdvancedFilter = (results: AdvancedFilterResult | null) => {
    if (!results) {
      setAdvancedFilter(null);
      return;
    }

    // Reset any existing filters
    setSelected({});

    // Always use the original data source based on the active tab
    const originalDataSource = activeTab === "all" ? data : calculatedFavoriteData || [];

    // Store the filter results regardless of whether they match any items
    // This ensures the badge remains visible even if we have no matches
    setAdvancedFilter(results);

    // If the results object is empty, set empty filtered data but keep the badge
    if (Object.keys(results).length === 0) {
      setFilteredData([]);
      return;
    }

    // Proceed with normal filtering logic
    const indicatorIdsFromResults = Object.values(results)
      .flatMap((frequencyData) =>
        frequencyData.map((indicator) => indicator.id)
      );

    // Filter the data based on type
    let newFilteredData: TData[];

    if (type === "indicator") {
      newFilteredData = originalDataSource.filter(row =>
        indicatorIdsFromResults.includes(row.id)
      );
    } else if (type === "table") {
      newFilteredData = originalDataSource.filter(row => {
        if (metadata) {
          const tableMetadata = (metadata as TableMetadata[]).find(meta => meta.id === row.id);
          if (tableMetadata) {
            const indicatorCodes = tableMetadata.indicator_code || [];
            if (indicatorCodes.length > 0) {
              const allFilteredIndicators = Object.values(results).flat();
              return indicatorCodes.some(code =>
                allFilteredIndicators.some(ind => ind.code === code)
              );
            }
          }
        }
        return false;
      });
    } else {
      newFilteredData = [];
    }

    // Even if we have no matches, still set the filtered data (which may be empty)
    setFilteredData(newFilteredData || []);
  };

  // Event to trigger when tab changes
  const handleTabChange = (newTab: string) => {
    // Update active tab
    setActiveTab(newTab);

    // Reset search when changing tabs
    setSearchValue("");

    // Reset all filters too
    setSelected({});

    // Also clear advanced filter when changing tabs
    setAdvancedFilter(null);

    // Dispatch a custom event to signal we need fresh data
    const refreshEvent = new CustomEvent('refresh-data', {
      detail: { type, tab: newTab }
    });
    window.dispatchEvent(refreshEvent);
  };

  // Listen for favorite toggled events
  React.useEffect(() => {
    const handleFavoriteToggled = (event: CustomEvent<{type: string}>) => {
      // Only update if this component handles the same type of data
      if (event.detail.type === type) {
        // Force a recalculation of favorite data
        setFavoriteToggleCount(prev => prev + 1);
      }
    };

    window.addEventListener('favourite-toggled', handleFavoriteToggled as EventListener);
    return () => {
      window.removeEventListener('favourite-toggled', handleFavoriteToggled as EventListener);
    };
  }, [type]);

  return (
    <div className="space-y-4 p-4 w-full">
      <div className="space-y-4">
        {/* Header section with title and action buttons side by side */}
        <div className="flex items-center justify-between">
          {/* Tabs for All/Favorites */}
          <div className="flex items-center">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mr-4">
              <TabsList>
                <TabsTrigger value="all" className="px-3 py-1.5">
                  All
                </TabsTrigger>
                <TabsTrigger value="favorites" className="px-3 py-1.5 flex items-center gap-1">
                  <BookmarkIcon className="h-3.5 w-3.5" />
                  <span>Favorites</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Action buttons */}
          {(items.length > 0) && (type === "table" || type === "indicator") && (
            <div className="flex items-center gap-1">
              {type === "table" ? (
                <CreateTableSheet sheetTrigger={<AddIndicatorButton text="Table" />} />
              ) : (
                <>
                  <CreateIndicatorSheet
                    sheetTrigger={<AddIndicatorButton text="Indicator" />}
                    code={codes}
                  />
                  <div className="h-6 w-px bg-border mx-1"></div>
                  <CustomIndicatorDrawer
                    selectedRows={table.getFilteredSelectedRowModel().rows.map(row => ({
                      "code": row.getValue("code"),
                      "name": row.getValue("name"),
                      "frequency": row.getValue("frequency")
                    }))}
                    codes={codes}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-full py-4">
            <div className="relative flex items-center max-w-lg w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Search by name, code or description..."
                value={searchValue}
                onChange={(event) => handleSearch(event.target.value)}
                className="pl-9 pr-20 rounded-full border-secondary/70 h-11 text-sm"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                <FilterSheet
                  items={items}
                  onFilterSubmit={handleFilterSubmit}
                />
                <AddIndicatorsModal
                  items={items}
                  onFilterSubmit={handleAdvancedFilter}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active filter badges */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {Object.entries(selected).map(([group, values]) =>
            (values || []).map((value) => (
              <Badge key={`${group}-${value}`} className="flex items-center gap-2">
                {group}: {value}
                <Button
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    const newSelected = { ...selected };
                    newSelected[group] = newSelected[group].filter((v) => v !== value);
                    handleFilterSubmit(newSelected);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          )}

          {/* Advanced Filter Badge */}
          {advancedFilter && (
            <Badge className="flex items-center gap-2">
              Advanced Filter
              <Button
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => {
                  setAdvancedFilter(null);
                  // Reset to original data for the current tab
                  if (activeTab === "all") {
                    setFilteredData(data);
                  } else {
                    setFilteredData(calculatedFavoriteData || []);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-md">
        {/* Column visibility dropdown */}
        <div className="flex items-center justify-end gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.getCanHide() && !["id", "description", "name","select"].includes(column.id)
                )
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

        {/* Table */}
        <Table
          className="border-separate border-spacing-y-2"
          style={{
            width: table.getTotalSize() > window.innerWidth ? table.getTotalSize() : "",
            borderCollapse: "separate",
          }}
        >
          <TableHeader className="rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.index === 0
                        ? "rounded-l-full"
                        : header.index === headerGroup.headers.length - 1
                          ? "rounded-r-full"
                          : ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`bg-zinc-100 dark:bg-zinc-800 group shadow ${
                    !row.getIsSelected() ? "hover:bg-secondary hover:text-white" : "font-medium"
                  } overflow-hidden`}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      className={`${
                        cellIndex === 0 ? "rounded-l-2xl border-l border-zinc-300 dark:border-secondary/70" : ""
                      } ${
                        cellIndex === row.getVisibleCells().length - 1
                          ? "rounded-r-2xl border-r border-zinc-300 dark:border-secondary/70"
                          : ""
                      } border-t border-b border-zinc-300 dark:border-secondary/70`}
                    >
                      {Array.isArray(cell.getValue()) ? (
                        <div className="flex overflow-x-auto max-w-lg">
                          {(cell.getValue() as unknown[]).slice(0, 4).map((item, index) => (
                            <div
                              key={index}
                              className={`rounded-md bg-gray-200 dark:bg-zinc-500 p-1 m-1 ${
                                !row.getIsSelected()
                                  ? "group-hover:bg-tertiary group-hover:text-white"
                                  : ""
                              }`}
                            >
                              {String(item)}
                            </div>
                          ))}
                          {Array.isArray(cell.getValue() as unknown[]) &&
                            (cell.getValue() as unknown[]).length > 4 && (
                              <div
                                className={`rounded-md bg-gray-200 dark:bg-zinc-500 p-1 m-1 ${
                                  !row.getIsSelected()
                                    ? "group-hover:bg-tertiary group-hover:text-white"
                                    : ""
                                }`}
                              >
                                +{(cell.getValue() as unknown[]).length - 4} more
                              </div>
                            )}
                        </div>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {activeTab === "favorites" && !filteredData.length ?
                    `No favorite ${type}s yet. Add items to your favorites to see them here.` :
                    "No results found."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="py-4 text-start">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
