"use client";

import { useEffect, useState } from "react";
import { columns } from "./columns";
import { SearchTable } from "@/components/table/search-table";
import { useGetAllIndicatorsQuery } from "@/redux/services/indicatorsApiSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { IndicatorsResponse, IndicatorSearchResult, MetadataSet, IndicatorTableSearchResult } from "@/types/dashboard";

function Indicators() {
  // This state is used to trigger a component re-render when needed
  const [, setRefreshTrigger] = useState(0);

  const { data: indicatorsResponse, isLoading, error, refetch } = useGetAllIndicatorsQuery(undefined, {
    refetchOnMountOrArgChange: true
  }) as { data?: IndicatorsResponse, isLoading: boolean, error: unknown, refetch: () => void };

  useEffect(() => {
    // Listen for refresh events from SearchTable component
    const handleRefreshRequest = (event: CustomEvent) => {
      if (event.detail.type === 'indicator') {
        console.log("Refreshing indicators data...");
        refetch();
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Listen for favorite toggled events
    const handleFavoriteToggled = (event: CustomEvent) => {
      if (event.detail.type === 'indicator') {
        console.log("Favorite indicator toggled:", event.detail.id);
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

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-6 sm:px-8 md:px-10 my-2 rounded-2xl border text-pretty shadow-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
        {/* Search and filters skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="border-b flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>

        {/* Table header skeleton */}
        <div className="grid grid-cols-5 gap-4 py-3 px-4 bg-muted/30 rounded-t-md">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
        </div>

        {/* Table rows skeleton */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 py-4 px-4 border-b">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between py-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="container mx-auto py-10 px-6 sm:px-8 md:px-10 my-2 rounded-2xl border text-pretty shadow-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
        <div className="text-center py-8 text-red-500">Error loading indicators data. Please try again later.</div>
      </div>
    );
  }

  // Create the favorites data by filtering indicators that have is_favourite=true
  const allIndicators = indicatorsResponse?.indicators || [] as IndicatorSearchResult[];
  const favoriteData = allIndicators.filter((indicator: IndicatorSearchResult) => indicator.is_favourite === true);

  return (
    <div className="container mx-auto py-10 px-6 sm:px-8 md:px-10 my-2 rounded-2xl border text-pretty shadow-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
      <SearchTable
        columns={columns}
        data={allIndicators as unknown as IndicatorTableSearchResult[]}
        favoriteData={favoriteData as unknown as IndicatorTableSearchResult[]}
        metadata={null}
        metadataset={indicatorsResponse?.metadataset as unknown as MetadataSet || null}
        type="indicator"
      />
    </div>
  );
}

export default Indicators;
