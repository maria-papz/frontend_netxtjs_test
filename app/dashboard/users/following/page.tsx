"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useGetFollowedUsersActivityQuery } from "@/redux/services/dashboardApiSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ActivityItem } from "@/types/dashboard";

interface FollowedActivityResponse {
  results: FollowedUserActivity[];
  has_more: boolean;
  total_count: number;
}

interface FollowedUserActivity extends ActivityItem {
  indicator_id: string;
  details?: DataDetail[];
}

interface DataDetail {
  period: string;
  old_value: string | number | null;
  new_value: string | number;
}

export default function FollowingPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayActivities, setDisplayActivities] = useState<FollowedUserActivity[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Use pagination in the query
  const { data: activities, isLoading, error } = useGetFollowedUsersActivityQuery({
    page,
    page_size: 10
  });

  // Update display data when the API response changes
  useEffect(() => {
    if (activities) {
      const activityData = activities as FollowedActivityResponse;
      if (page === 1) {
        setDisplayActivities(activityData.results || []);
      } else {
        setDisplayActivities(prev => [...prev, ...(activityData.results || [])]);
      }
      setHasMore(activityData.has_more || false);
      setIsLoadingMore(false);
    }
  }, [activities, page]);

  // Load more data
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  const filterActivities = (items: FollowedUserActivity[] = []) => {
    if (searchTerm === "") return items;
    return items.filter(activity =>
      activity.indicator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatActivityAction = (action: string): string => {
    switch (action) {
      case 'INDICATOR_CREATE':
        return 'Created indicator';
      case 'INDICATOR_EDIT':
        return 'Updated indicator metadata';
      case 'DATA_UPDATE':
        return 'Updated data values';
      case 'FORMULA_UPDATE':
        return 'Updated formula';
      default:
        return action.replace(/_/g, ' ').toLowerCase();
    }
  };

  // Apply filters
  const filteredActivities = filterActivities(displayActivities);

  if (isLoading && page === 1) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-secondary">Followed Users Activity</h1>
        <Card>
          <CardHeader>
            <CardTitle>Loading Activity</CardTitle>
            <CardDescription>Please wait while we load the activity data...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="border-b pb-4 flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Followed Users Activity</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>We couldn&apos;t load the activity data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Could not load activity data. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Followed Users Activity</h1>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or indicator name"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Recent activity from users you follow</CardDescription>
            </div>
            <Badge variant="outline">{filteredActivities.length} activities</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No activity matches your search" : "No recent activity from followed users"}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity, i) => (
                <div key={i} className="border-b pb-4 last:border-0">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${activity.user}`} />
                      <AvatarFallback>{activity.user?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{activity.user}</h3>
                        <Badge variant="secondary">
                          {activity.action === 'DATA_UPDATE' ? 'Data Update' :
                           activity.action === 'INDICATOR_EDIT' ? 'Metadata' :
                           activity.action === 'INDICATOR_CREATE' ? 'New Indicator' :
                           activity.action}
                        </Badge>
                      </div>

                      <div className="mt-1 text-sm">
                        {formatActivityAction(activity.action)} &quot;
                        <Link href={`/dashboard/indicators/${activity.indicator_id}`} className="text-secondary hover:underline">
                          {activity.indicator}
                        </Link>&quot;
                        {activity.action === 'DATA_UPDATE' && activity.details && activity.details.length > 0 && (
                          <span> ({activity.details.length} data points)</span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-48"
              >
                {isLoadingMore ? "Loading..." : "Load More Activity"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
