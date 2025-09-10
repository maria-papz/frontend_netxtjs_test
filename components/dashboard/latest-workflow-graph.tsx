"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useGetLatestWorkflowRunQuery } from "@/redux/services/dashboardApiSlice";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import { LineGraph } from "@/app/dashboard/tables/[id]/line-graph";
import { Button } from "@/components/ui/button";
import WorkflowHistoryDialog from "@/components/workflows/workflow-history-dialog";

interface IndicatorDataPoint {
  period: string;
  value: string | number;
}

interface WorkflowIndicator {
  id: string;
  name: string;
  code: string;
  data: IndicatorDataPoint[];
}

interface WorkflowRunData {
  workflow_id: string;
  workflow_name: string;
  workflow_description?: string;
  timestamp: string;
  status: string;
  indicators: WorkflowIndicator[];
  details?: Record<string, unknown>;
}

export function LatestWorkflowGraph() {
  const { data: latestWorkflow, isLoading, error } = useGetLatestWorkflowRunQuery({}) as {
    data: WorkflowRunData | undefined;
    isLoading: boolean;
    error: unknown;
  };

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const indicatorData = useMemo(() => {
    if (!latestWorkflow?.indicators) return [];

    // Transform the data into the format expected by LineGraph
    const periods = new Set<string>();
    const dataByPeriod: Record<string, Record<string, number>> = {};

    // First identify all unique periods and indicators
    latestWorkflow.indicators.forEach(indicator => {
      indicator.data.forEach(item => {
        periods.add(item.period);
        if (!dataByPeriod[item.period]) {
          dataByPeriod[item.period] = {};
        }
        dataByPeriod[item.period][indicator.name] = Number(item.value);
      });
    });

    // Create array of data by period
    const result = Array.from(periods).map(period => {
      const periodData: Record<string, string | number> = { period };
      Object.entries(dataByPeriod[period]).forEach(([indicator, value]) => {
        periodData[indicator] = value;
      });
      return periodData;
    });

    return result;
  }, [latestWorkflow]);

  const indicatorsObject = useMemo(() => {
    if (!latestWorkflow?.indicators) return {};

    const result: Record<string, { code?: string; name?: string }> = {};
    latestWorkflow.indicators.forEach(indicator => {
      result[indicator.name] = {
        code: indicator.code,
        name: indicator.name
      };
    });

    return result;
  }, [latestWorkflow]);

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-xl">Latest Workflow Data</CardTitle>
          <CardDescription>Loading the latest workflow run information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-xl">Latest Workflow Data</CardTitle>
          <CardDescription>Unable to load workflow information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <p>There was an error loading the latest workflow data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestWorkflow || !latestWorkflow.indicators || latestWorkflow.indicators.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-xl">Latest Workflow Data</CardTitle>
          <CardDescription>No recent workflow data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            No recent workflow runs found with indicator data.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Latest Workflow Data</CardTitle>
            <CardDescription className="mt-1">
              Data from the most recent workflow run
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(latestWorkflow.timestamp), { addSuffix: true })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {indicatorData.length > 0 ? (
          <LineGraph
            data={indicatorData}
            indicatorsObject={indicatorsObject}
          />
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            No time series data available for the indicators in this workflow.
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t pt-4">
        <div className="text-xs text-muted-foreground w-full">
          Select indicators above to visualize their time series data.
        </div>

        <div className="bg-muted/30 p-3 rounded-md space-y-2 w-full">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Workflow:</h3>
              <span>{latestWorkflow.workflow_name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryDialogOpen(true)}
              className="text-xs"
            >
              View History
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Run date:</span>
              <span>{new Date(latestWorkflow.timestamp).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={latestWorkflow.status === "success" ? "default" : "destructive"} className="ml-1">
                {latestWorkflow.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Updated indicators:</span>
              <Badge variant="secondary" className="ml-1">
                {latestWorkflow.indicators.length}
              </Badge>
            </div>
          </div>
        </div>
      </CardFooter>

      {/* Workflow History Dialog */}
      <WorkflowHistoryDialog
        workflowId={Number(latestWorkflow.workflow_id)}
        workflowName={latestWorkflow.workflow_name}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />
    </Card>
  );
}

export default LatestWorkflowGraph;
