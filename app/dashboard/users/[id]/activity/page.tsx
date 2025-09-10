"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  AlertCircle,
  FileEdit,
  Calculator,
  Plus,
  Trash2,
  CalendarDays,
  Activity
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useGetUserActivityQuery } from "@/redux/services/indicatorsApiSlice";
import {
  UserAction,
  DataUpdateDetails,
  FormulaUpdateDetails,
  IndicatorEditDetails,
  IndicatorCreateDetails,
  UserActivityData,
  IndicatorActivity
} from "@/types/dashboard";

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("all");
  const userId = params.id as string;

  // Use the API slice hook instead of axios
  const {
    data: activityData,
    isLoading: loading,
    error
  } = useGetUserActivityQuery(userId, {
    skip: !userId,
  }) as {
    data?: UserActivityData;
    isLoading: boolean;
    error: unknown
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Could not load user activity history",
        variant: "destructive"
      });
    }
  }, [error]);

  // Filter activities based on the selected tab
  const getFilteredActivities = (): IndicatorActivity[] => {
    if (!activityData || !('activity' in activityData)) return [];

    if (selectedTab === "all") {
      return activityData.activity;
    }

    return activityData.activity.filter((activity: IndicatorActivity) =>
      activity.actions.some((action: UserAction) => action.action_type === selectedTab)
    );
  };

  const getActionIcon = (actionType: UserAction['action_type']) => {
    switch (actionType) {
      case 'DATA_UPDATE':
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'FORMULA_UPDATE':
        return <Calculator className="h-4 w-4 text-purple-500" />;
      case 'INDICATOR_CREATE':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'INDICATOR_EDIT':
        return <FileEdit className="h-4 w-4 text-amber-500" />;
      case 'INDICATOR_DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatActionDescription = (action: UserAction) => {
    switch (action.action_type) {
      case 'DATA_UPDATE':
        return `Updated ${action.points_changed || 'multiple'} data points`;
      case 'FORMULA_UPDATE':
        const formulaDetails = action.details as FormulaUpdateDetails;
        return `Updated formula from "${formulaDetails.old_formula || 'new'}" to "${formulaDetails.new_formula}"`;
      case 'INDICATOR_CREATE':
        const createDetails = action.details as IndicatorCreateDetails;
        return `Created new indicator: ${createDetails.name}`;
      case 'INDICATOR_EDIT':
        return `Edited indicator properties`;
      case 'INDICATOR_DELETE':
        return `Deleted indicator`;
      default:
        return `Unknown action`;
    }
  };

  const renderActivityDetails = (action: UserAction) => {
    switch (action.action_type) {
      case 'INDICATOR_EDIT':
        const editDetails = action.details as IndicatorEditDetails;
        return (
          <div className="mt-2 bg-muted/20 p-3 rounded-md border text-sm space-y-1.5">
            {Object.entries(editDetails).map(([field, change]) => (
              <div key={field} className="grid grid-cols-12 gap-1">
                <span className="col-span-3 font-medium text-secondary">{field}:</span>
                <div className="col-span-9 flex flex-col">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/70"></div>
                    <span className="text-muted-foreground">{change.old ?? "-"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/70"></div>
                    <span>{change.new}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'DATA_UPDATE':
        const dataDetails = action.details as DataUpdateDetails[];
        if (!Array.isArray(dataDetails)) {
          return (
            <div className="mt-2 text-sm text-muted-foreground">
              Updated multiple data points
            </div>
          );
        }
        return (
          <div className="mt-2 bg-muted/20 p-3 rounded-md border text-sm overflow-hidden">
            <div className="text-xs text-muted-foreground mb-2">
              {dataDetails.length > 5
                ? `Showing 5 of ${dataDetails.length} updated points`
                : `${dataDetails.length} data points updated`}
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {dataDetails.slice(0, 5).map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 font-medium text-secondary">{item.period}:</span>
                  <div className="col-span-9 flex flex-col">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400/70"></div>
                      <span className="text-muted-foreground">{item.old_value ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400/70"></div>
                      <span>{item.new_value}</span>
                    </div>
                  </div>
                </div>
              ))}
              {dataDetails.length > 5 && (
                <div className="text-xs text-center text-muted-foreground mt-2">
                  + {dataDetails.length - 5} more changes...
                </div>
              )}
            </div>
          </div>
        );
      case 'FORMULA_UPDATE':
        const formulaDetails = action.details as FormulaUpdateDetails;
        return (
          <div className="mt-2 bg-muted/20 p-3 rounded-md border text-sm space-y-1.5">
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-3 font-medium text-secondary">Formula:</span>
              <div className="col-span-9 flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/70"></div>
                  <code className="text-muted-foreground bg-muted/30 px-1 py-0.5 rounded text-xs">
                    {formulaDetails.old_formula ?? "-"}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/70"></div>
                  <code className="bg-muted/30 px-1 py-0.5 rounded text-xs">
                    {formulaDetails.new_formula}
                  </code>
                </div>
              </div>
            </div>
            {formulaDetails.base_indicators && (
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-3 font-medium text-secondary">Using:</span>
                <div className="col-span-9 flex flex-wrap gap-1">
                  {formulaDetails.base_indicators.map((code, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <Button
        variant="outline"
        className="mb-6 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="font-bold text-3xl p-5">Analytics Dahsboard</h1>


      <Card className="shadow-md border border-gray-200">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-secondary" />
                User Activity History
              </CardTitle>
              <CardDescription>
                {loading ? (
                  <Skeleton className="h-4 w-48" />
                ) : activityData ? (
                  `Activity log for ${activityData.user.first_name} ${activityData.user.last_name} (${activityData.user.email})`
                ) : (
                  'User activity not found'
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary"
              >
                All Activity
              </TabsTrigger>
                <TabsTrigger
                value="DATA_UPDATE"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary"
                >
                Data Updates
                </TabsTrigger>
                <TabsTrigger
                value="FORMULA_UPDATE"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary"
                >
                Formula Changes
                </TabsTrigger>
                <TabsTrigger
                value="INDICATOR_EDIT"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary"
                >
                Indicator Edits
                </TabsTrigger>
                <TabsTrigger
                value="INDICATOR_CREATE"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary"
                >
                Created Indicators
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="p-0">
                <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    </div>
                  ))}
                  </div>
                ) : getFilteredActivities().length > 0 ? (
                  <div className="divide-y">
                  {getFilteredActivities().map((activity: IndicatorActivity) => (
                    <div key={activity.indicator_id} className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                      <span className="text-secondary">{activity.indicator_code}</span>
                      <span className="mx-2">-</span>
                      <span>{activity.indicator_name}</span>
                      </h3>
                      <Button
                      variant="ghost"
                      className="text-xs px-2 py-1 h-auto mt-1"
                      onClick={() => router.push(`/dashboard/indicators/${activity.indicator_id}`)}
                      >
                      View Indicator
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {selectedTab === "all"
                      ? activity.actions.map((action: UserAction, idx: number) => (
                        <div key={idx} className="relative pl-6 pb-6 border-l border-dashed border-gray-300 last:border-0 last:pb-0">
                        <div className="absolute left-0 top-0 transform -translate-x-1/2 bg-background p-0.5 rounded-full">
                          {getActionIcon(action.action_type)}
                        </div>

                        <div className=" rounded-lg shadow-sm border p-4">
                          <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <Badge variant={
                            action.action_type === 'DATA_UPDATE' ? 'default' :
                            action.action_type === 'FORMULA_UPDATE' ? 'secondary' :
                            action.action_type === 'INDICATOR_CREATE' ? 'outline' :
                            action.action_type === 'INDICATOR_EDIT' ? 'outline' :
                            'destructive'
                            }>
                            {action.action_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium ml-2">
                            {formatActionDescription(action)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(action.timestamp).toLocaleString()}
                          </span>
                          </div>

                          {renderActivityDetails(action)}
                        </div>
                        </div>
                      ))
                      : activity.actions
                        .filter((action: UserAction) => action.action_type === selectedTab)
                        .map((action: UserAction, idx: number) => (
                          <div key={idx} className="relative pl-6 pb-6 border-l border-dashed border-gray-300 last:border-0 last:pb-0">
                          <div className="absolute left-0 top-0 transform -translate-x-1/2 bg-background p-0.5 rounded-full">
                            {getActionIcon(action.action_type)}
                          </div>

                          <div className="rounded-lg shadow-sm border p-4">
                            <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant={
                              action.action_type === 'DATA_UPDATE' ? 'default' :
                              action.action_type === 'FORMULA_UPDATE' ? 'secondary' :
                              action.action_type === 'INDICATOR_CREATE' ? 'outline' :
                              action.action_type === 'INDICATOR_EDIT' ? 'outline' :
                              'destructive'
                              }>
                              {action.action_type.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm font-medium ml-2">
                              {formatActionDescription(action)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(action.timestamp).toLocaleString()}
                            </span>
                            </div>

                            {renderActivityDetails(action)}
                          </div>
                          </div>
                        ))
                      }
                    </div>
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activity Found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {selectedTab === "all"
                    ? "This user hasn't made any changes to indicators yet."
                    : `No ${selectedTab.toLowerCase().replace('_', ' ')} activities found for this user.`}
                  </p>
                  </div>
                )}
                </ScrollArea>
              </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
