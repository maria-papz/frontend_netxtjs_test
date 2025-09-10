"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useGetFavoriteIndicatorsActivityQuery } from "@/redux/services/dashboardApiSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { DataActivityItem, InfoActivityItem } from "@/types/dashboard";

export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("data");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayDataChanges, setDisplayDataChanges] = useState<DataActivityItem[]>([]);
  const [displayInfo, setDisplayInfo] = useState<InfoActivityItem[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [hasMoreInfo, setHasMoreInfo] = useState(true);

  // Define the API response type
  interface FavoritesActivityResponse {
    data_changes: DataActivityItem[];
    info: InfoActivityItem[];
    has_more_data: boolean;
    has_more_info: boolean;
  }

  // Use pagination in the query
  const { data: favoritesActivity, isLoading } = useGetFavoriteIndicatorsActivityQuery({
    page,
    page_size: 10,
    type: activeTab
  });

  // Update display data when the API response changes
  useEffect(() => {
    if (favoritesActivity) {
      const typedActivity = favoritesActivity as FavoritesActivityResponse;

      if (activeTab === "data") {
        if (page === 1) {
          setDisplayDataChanges(typedActivity.data_changes || []);
        } else {
          setDisplayDataChanges(prev => [...prev, ...(typedActivity.data_changes || [])]);
        }
        setHasMoreData(typedActivity.has_more_data || false);
      } else {
        if (page === 1) {
          setDisplayInfo(typedActivity.info || []);
        } else {
          setDisplayInfo(prev => [...prev, ...(typedActivity.info || [])]);
        }
        setHasMoreInfo(typedActivity.has_more_info || false);
      }
      setIsLoadingMore(false);
    }
  }, [favoritesActivity, page, activeTab]);

  // Handle tab change - reset pagination
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  // Load more data
  const loadMore = () => {
    if (!isLoadingMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  const filterItems = <T extends { indicator: string }>(items: T[] = []) => {
    if (searchTerm === "") return items;
    return items.filter(item =>
      item.indicator.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Use the saved state for filtered items
  const filteredDataChanges = filterItems(displayDataChanges);
  const filteredInfo = filterItems(displayInfo);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-secondary">Favorite Indicators Activity</h1>
        <Card>
          <CardHeader>
            <CardTitle>Loading Activity</CardTitle>
            <CardDescription>Please wait while we load your data...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Favorite Indicators Activity</h1>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by indicator name"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="data" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="data">Data Updates</TabsTrigger>
          <TabsTrigger value="info">Metadata Changes</TabsTrigger>
        </TabsList>

        {/* Data Updates Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Data Changes</CardTitle>
                  <CardDescription>Updates to your favorite indicators&apos; data values</CardDescription>
                </div>
                <Badge variant="outline">{filteredDataChanges.length} updates</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDataChanges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No data updates match your search" : "No recent data updates for your favorite indicators"}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredDataChanges.map((item, i) => (
                    <div key={i} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">
                          <Link href={`/dashboard/indicators/${item.indicator_id}`} className="hover:underline">
                            {item.indicator}
                          </Link>
                        </h3>
                        <Badge variant={item.type === 'CREATED' ? 'outline' : 'secondary'}>
                          {item.type === 'CREATED' ? 'New' : 'Updated'}
                        </Badge>
                      </div>

                      {item.type === 'UPDATED' && (
                        <div className="mt-2 text-sm">
                          <span>Period: {item.period}</span>
                          <div className="flex items-center mt-1">
                            <span className="text-muted-foreground">Value: {item.details && item.details[0] ? item.details[0].old_value : '-'}</span>
                            <span className="mx-2">→</span>
                            <span>{item.details && item.details[0] ? item.details[0].new_value : '-'}</span>
                          </div>
                          {item.percentage_change != null && (
                            <div className={`mt-1 flex items-center ${item.percentage_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.percentage_change > 0 ? (
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 mr-1" />
                              )}
                              <span>{item.percentage_change > 0 ? '+' : ''}{Number(item.percentage_change).toFixed(2)}% change</span>
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === 'CREATED' && (
                        <div className="mt-2 text-sm">
                          <div>
                            <span>New period: {item.current_period}</span>
                            <span className="ml-4">Value: {item.current_value}</span>
                          </div>
                          {item.previous_period && (
                            <div className="mt-1">
                              <span>Previous period: {item.previous_period}</span>
                              <span className="ml-4">Value: {item.previous_value}</span>
                            </div>
                          )}
                          {item.percentage_change != null && (
                            <div className={`mt-1 flex items-center ${item.percentage_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.percentage_change > 0 ? (
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 mr-1" />
                              )}
                              <span>{item.percentage_change > 0 ? '+' : ''}{Number(item.percentage_change).toFixed(2)}% change from previous period</span>
                            </div>
                          )}
                        </div>
                      )}

                      {(item.type === 'CHANGED FORMULA' || item.type === 'CREATED FORMULA') && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Formula updated:</div>
                          <code className="px-2 py-1 bg-muted rounded block mt-1 text-xs overflow-x-auto">
                            {item.formula || ''}
                          </code>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasMoreData && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-48"
                  >
                    {isLoadingMore ? "Loading..." : "Load More Updates"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Changes Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Metadata Changes</CardTitle>
                  <CardDescription>Updates to your favorite indicators&apos; information</CardDescription>
                </div>
                <Badge variant="outline">{filteredInfo.length} updates</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInfo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No metadata changes match your search" : "No recent metadata changes for your favorite indicators"}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredInfo.map((item, i) => (
                    <div key={i} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">
                          <Link href={`/dashboard/indicators/${item.indicator_id}`} className="hover:underline">
                            {item.indicator}
                          </Link>
                        </h3>
                        <Badge variant={item.type === 'CREATED' ? 'outline' : 'secondary'}>
                          {item.type}
                        </Badge>
                      </div>

                      {item.type === 'EDITED' && item.details && (
                        <div className="mt-2 space-y-2">
                          <div className="text-sm font-medium">Changed properties:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(item.details).map(([field, change]: [string, { old: string | number | boolean | null; new: string | number | boolean }]) => (
                              <div key={field} className="bg-muted/30 p-2 rounded-sm">
                                <span className="font-medium">{field}: </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-muted-foreground">{change.old || <em>empty</em>}</span>
                                  <span>→</span>
                                  <span>{change.new || <em>empty</em>}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.type === 'CREATED' && (
                        <div className="mt-2 text-sm">
                          <div>New indicator created with code: {typeof item.details === 'object' && 'code' in item.details ? String(item.details.code) : ''}</div>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasMoreInfo && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-48"
                  >
                    {isLoadingMore ? "Loading..." : "Load More Changes"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
