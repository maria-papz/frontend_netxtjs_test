"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetFavoriteIndicatorsActivityQuery } from "@/redux/services/dashboardApiSlice";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { DataActivityItem, InfoActivityItem } from "@/types/dashboard";
import { Button } from "@/components/ui/button";

interface FieldChange {
  old: string | null;
  new: string | null;
}

interface FavoritesActivityProps {
  type: "data" | "info";
  limit?: number;
  dashboardView?: boolean;
}

interface FavoriteActivityResponse {
  data_changes: DataActivityItem[];
  info: InfoActivityItem[];
  has_more_data: boolean;
  has_more_info: boolean;
}

export function FavoritesActivity({ type, limit = 5, dashboardView = false }: FavoritesActivityProps) {
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayData, setDisplayData] = useState<(DataActivityItem | InfoActivityItem)[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Always include page and page_size parameters to support pagination
  const { data: favoritesActivity, isLoading, error } = useGetFavoriteIndicatorsActivityQuery({
    page,
    page_size: limit,
    type: type === "data" ? "data" : "info"
  }) as { data: FavoriteActivityResponse | undefined, isLoading: boolean, error: unknown };

  useEffect(() => {
    if (favoritesActivity) {
      const newData = type === "data" ? favoritesActivity.data_changes : favoritesActivity.info || [];
      if (page === 1) {
        setDisplayData(newData);
      } else {
        setDisplayData(prev => [...prev, ...newData]);
      }
      setHasMore(type === "data" ? favoritesActivity.has_more_data : favoritesActivity.has_more_info);
      setIsLoadingMore(false);
    }
  }, [favoritesActivity, type, page]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  const title = type === "data" ? "Data Updates" : "Metadata Changes";
  const description = type === "data"
    ? "Recent updates to indicator values"
    : "Recent changes to indicator properties";  if (isLoading) {
    return (
      <Card className="col-span-1 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg"></CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-3">
          </div>
        </CardContent>
        <CardFooter className="py-2 px-3 bg-muted/5 border-t flex justify-end">
          <Skeleton className="h-4 w-32" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg"></CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center py-8 text-muted-foreground">
            Unable to load updates
          </div>
        </CardContent>
        <CardFooter className="py-2 px-3 bg-muted/5 border-t flex justify-end">
          <Link href="/dashboard/favorites" className="text-secondary hover:underline text-xs font-medium">
            Try again →
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (displayData.length === 0) {
    return (
      <Card className="col-span-1 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg"></CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center py-8 text-muted-foreground">
            No recent           </div>
        </CardContent>
        <CardFooter className="py-2 px-3 bg-muted/5 border-t flex justify-end">
          <Link href="/dashboard/favorites" className="text-secondary hover:underline text-xs font-medium">
            View all favorites →
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <Table>
            <TableBody>
              {displayData.map((item, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="py-2 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/dashboard/indicators/${item.indicator_id}`}
                          className="font-medium text-sm text-secondary hover:underline"
                        >
                          {item.indicator}
                        </Link>
                        <Badge variant="secondary" className="text-xs h-5">
                          {item.type}
                        </Badge>
                      </div>

                      {/* Data update details */}
                      {type === "data" && renderDataUpdateDetails(item as DataActivityItem)}

                      {/* Metadata update details */}
                      {type === "info" && renderInfoUpdateDetails(item as InfoActivityItem)}

                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {hasMore && !dashboardView && (
                <TableRow>
                  <TableCell className="py-2 px-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="w-full text-xs"
                    >
                      {isLoadingMore ? "Loading..." : "Load More"}
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="py-2 px-3 bg-muted/5 border-t flex justify-end">
        <Link href={`/dashboard/favorites${type === "data" ? "?tab=data" : "?tab=info"}`} className="text-secondary hover:underline text-xs font-medium">
          View all updates →
        </Link>
      </CardFooter>
    </Card>
  );  // Helper functions to render different types of updates
  function renderDataUpdateDetails(item: DataActivityItem) {
    if (item.type === 'UPDATED' && item.details?.length) {
      return (
        <div className="flex items-baseline justify-between text-xs px-1">
          <div>
            <span className="text-muted-foreground mr-1">Period: {item.period}</span>
            <span className="text-muted-foreground">{item.details[0].old_value}</span>
            <span className="mx-1">→</span>
            <span>{item.details[0].new_value}</span>
          </div>
          {item.percentage_change != null && (
            <span className={item.percentage_change > 0 ? 'text-green-600' : 'text-red-600'}>
              {item.percentage_change > 0 ? '+' : ''}
              {Number(item.percentage_change).toFixed(2)}%
            </span>
          )}
        </div>
      );
    }

    if (item.type === 'CREATED') {
      return (
        <div className="text-xs px-1">
          <div className="flex items-baseline justify-between">
            <span>New data for period: {item.current_period}</span>
            <span className="font-medium">{item.current_value}</span>
          </div>
          {item.previous_period && (
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-muted-foreground">Previous period ({item.previous_period}):</span>
              <span className="text-muted-foreground">{item.previous_value}</span>
            </div>
          )}
        </div>
      );
    }

    if (item.type === 'CHANGED FORMULA' || item.type === 'CREATED FORMULA') {
      const formula = item.formula || (item.details && item.details[0]?.new_value as string);
      return (
        <div className="text-xs bg-muted/30 py-1 px-2 rounded">
          <div className="text-xs font-medium mb-0.5">Formula:</div>
          <code className="text-xs break-all">{formula}</code>
        </div>
      );
    }

    return null;
  }

  function renderInfoUpdateDetails(item: InfoActivityItem) {
    if (item.type === 'EDITED' && item.details) {
      const changes = Object.entries(item.details) as [string, FieldChange][];
      const displayChanges = changes.slice(0, 2);

      return (
        <div className="text-xs px-1">
          {displayChanges.map(([field, change], idx) => (
            <div key={idx} className="mt-0.5">
              <span className="text-muted-foreground mr-1">{field}:</span>
              <span className="text-muted-foreground">{change.old || <em>empty</em>}</span>
              <span className="mx-1">→</span>
              <span>{change.new || <em>empty</em>}</span>
            </div>
          ))}
          {changes.length > 2 && (
            <div className="mt-0.5 text-muted-foreground">
              + {changes.length - 2} more field{changes.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }

    if (item.type === 'CREATED') {
      const details = item.details as { code?: string };
      return (
        <div className="text-xs px-1">
          <span className="text-muted-foreground">Created with code: </span>
          <span className="font-medium">{details?.code || 'N/A'}</span>
        </div>
      );
    }

    return null;
  }
}

export default FavoritesActivity;
