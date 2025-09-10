"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useGetFollowedUsersActivityQuery } from "@/redux/services/dashboardApiSlice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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

interface ActivityProps {
  limit?: number;
  dashboardView?: boolean;
}

export function FollowedActivity({ limit = 5, dashboardView = false }: ActivityProps) {
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayActivities, setDisplayActivities] = useState<FollowedUserActivity[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: activities, isLoading, error } = useGetFollowedUsersActivityQuery({
    page,
    page_size: limit
  });

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

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
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

  if (isLoading) {
    return (
      <Card className="col-span-1 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Followed Users Activity</CardTitle>
          <CardDescription>Latest updates from users you follow</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <ScrollArea className="h-[280px]">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 mb-3 pb-3 border-b last:border-0">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter className="py-2 px-3 bg-muted/10 flex justify-end">
          <Skeleton className="h-4 w-32" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Followed Users Activity</CardTitle>
          <CardDescription>Latest updates from users you follow</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center text-sm text-muted-foreground p-4">
            Could not load activity data. Please try again later.
          </div>
        </CardContent>
        <CardFooter className="py-2 px-3 bg-muted/10 flex justify-end">
          <Link href="/dashboard/users/following" className="text-secondary hover:underline text-xs font-medium">
            View all activity →
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Followed Users Activity</CardTitle>
        <CardDescription>Latest updates from users you follow</CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <ScrollArea className="h-[280px]">
          {displayActivities.length > 0 ? (
            <>
              {displayActivities.map((activity, i) => (
                <div key={i} className="flex items-start space-x-3 mb-3 pb-3 border-b last:border-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${activity.user}`} />
                    <AvatarFallback>{activity.user?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{activity.user}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatActivityAction(activity.action)} &quot;{activity.indicator}&quot;
                      {activity.action === 'DATA_UPDATE' && activity.details && activity.details.length > 0 && (
                        <span> ({activity.details.length} data points)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && !dashboardView && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full text-xs"
                  >
                    {isLoadingMore ? "Loading..." : "Load More Activities"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4">
              No recent activity from followed users
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="py-2 px-3 bg-muted/10 flex justify-end">
        <Link href="/dashboard/users/following" className="text-secondary hover:underline text-xs font-medium">
          View all activity →
        </Link>
      </CardFooter>
    </Card>
  );
}

export default FollowedActivity;
