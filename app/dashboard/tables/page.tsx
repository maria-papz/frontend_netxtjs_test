"use client";

import { useEffect, useState } from "react";
import { columns } from "./columns";
import { SearchTable } from "@/components/table/search-table";
import { useGetAllTablesQuery } from "@/redux/services/tablesApiSlice";
import {
  MetadataSet,
  TablesApiResponse,
  TableData
} from "@/types/dashboard";

function Tables() {
  const [tableData, setTableData] = useState<TableData>({
    data: [],
    metadata: [],
    metadataset: {
      code: [],
      category: [],
      base_year: [],
      frequency: [],
      source: [],
      region: [],
      country: [],
      unit: []
    } as MetadataSet,
  });

  const [refreshCounter, setRefreshCounter] = useState(0);
  const [favoriteToggleCount, setFavoriteToggleCount] = useState(0);

  // This will trigger a refetch when refreshCounter changes
  const { data, refetch } = useGetAllTablesQuery(undefined, {
    // Using skip with a condition based on refreshCounter would trigger refetch
    refetchOnMountOrArgChange: true
  }) as { data?: TablesApiResponse; refetch: () => void };

  useEffect(() => {
    if (data) {
      const typedData = data as TablesApiResponse;
      setTableData({
        data: typedData.table || [],
        metadata: typedData.metadata || [],
        metadataset: typedData.metadata_set || {
          code: [],
          category: [],
          base_year: [],
          frequency: [],
          source: [],
          region: [],
          country: [],
          unit: []
        } as MetadataSet
      });
    }
  }, [data]);

  useEffect(() => {
    // Listen for refresh events from SearchTable component
    const handleRefreshRequest = (event: CustomEvent) => {
      if (event.detail.type === 'table') {
        console.log("Refreshing tables data...");
        refetch();
        setRefreshCounter(prev => prev + 1);
      }
    };

    // Listen for favorite toggled events
    const handleFavoriteToggled = (event: CustomEvent) => {
      if (event.detail.type === 'table') {
        console.log("Favorite table toggled:", event.detail.id);
        setFavoriteToggleCount(prev => prev + 1);
        refetch();
      }
    };

    window.addEventListener('refresh-data', handleRefreshRequest as EventListener);
    window.addEventListener('favourite-toggled', handleFavoriteToggled as EventListener);

    return () => {
      window.removeEventListener('refresh-data', handleRefreshRequest as EventListener);
      window.removeEventListener('favourite-toggled', handleFavoriteToggled as EventListener);
    };
  }, [refetch]);

  // Refetch when refresh counter or favorites toggle count changes
  useEffect(() => {
    if (refreshCounter > 0 || favoriteToggleCount > 0) {
      refetch();
    }
  }, [refreshCounter, favoriteToggleCount, refetch]);


  // Create the favorites data by filtering tables that have is_favourite=true
  const favoriteData = tableData.data.filter(table => table.is_favourite);

  return (
    <div className="container mx-auto py-10 p-2 md:p-10 rounded-tl-2xl border text-pretty shadow-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
      <SearchTable
        columns={columns}
        data={tableData.data}
        favoriteData={favoriteData}
        metadata={tableData.metadata}
        metadataset={tableData.metadataset}
        type="table"
      />
    </div>
  );
}

export default Tables;
