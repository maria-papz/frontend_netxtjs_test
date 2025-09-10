"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import { createColumns } from "./columns";
import { IndicatorMetadata, TableRowData } from "@/types/dashboard";
import { useGetTableDataQuery } from "@/redux/services/indicatorsApiSlice";

// Define the structure of the API response
interface TableDataResponse {
  table_name: string;
  table_description: string;
  data: TableRowData[];
  indicators: Record<string, IndicatorMetadata>;
}

interface TableData {
  name: string;
  description: string;
  data: TableRowData[];
  columns: ColumnDef<TableRowData, unknown>[];
}

const Table = ({ params }: { params: { id: string } }) => {
  const [tableData, setTableData] = useState<TableData>({
    name: "",
    description: "",
    data: [] as TableRowData[],
    columns: [] as ColumnDef<TableRowData, unknown>[],
  });
  const [indicatorsObject, setIndicatorsObject] = useState<Record<string, IndicatorMetadata>>();

  // Use the API slice hook instead of axios with type assertion
  const { data, error, isLoading } = useGetTableDataQuery(params.id) as {
    data?: TableDataResponse;
    error: unknown;
    isLoading: boolean;
  };
  console.log("table data:", data);

  useEffect(() => {
    if (data) {
      setTableData({
        name: data.table_name,
        description: data.table_description,
        data: data.data,
        columns: createColumns(data.indicators) as ColumnDef<TableRowData, unknown>[],
      });
      setIndicatorsObject(data.indicators);
      console.log("Indicators Object:", data.indicators);
    }

    if (error) {
      console.error("Error rendering table:", error);
    }
  }, [data, error]);

  return (
    <main className="w-full min-h-screen">
      <div className="container mx-auto py-10 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-black shadow-lg m-6">
        <h1 className="text-2xl font-semibold mb-2">
          {tableData.name}
        </h1>
        <p className="text-gray-600 mb-6">
          {tableData.description}
        </p>
        {isLoading ? (
          <div>Loading table data...</div>
        ) : (
          <DataTable
            columns={tableData.columns}
            data={tableData.data}
            indicatorsObject={indicatorsObject as Record<string, IndicatorMetadata>}
            tableId={params.id}
            tableName={tableData.name}
          />
        )}
      </div>
    </main>
  );
};

export default Table;
