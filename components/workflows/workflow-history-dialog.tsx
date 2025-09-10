"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetWorkflowRunHistoryQuery } from "@/redux/services/workflowApiSlice";
import {
  WorkflowHistoryDialogProps,
  StatusBadgeProps,
  WorkflowRun,
  ActionLog,
  DetailItem
} from "@/types/workflow";

export default function WorkflowHistoryDialog({
  workflowId,
  workflowName,
  open,
  onOpenChange,
}: WorkflowHistoryDialogProps) {
  const { data: historyData, isLoading, error, refetch } = useGetWorkflowRunHistoryQuery(
    workflowId,
    { skip: !open }
  );

  // Refetch when dialog opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const getStatusBadgeProps = (status: string): StatusBadgeProps => {
    switch (status) {
      case "COMPLETED":
        return {
          variant: "default",
          className: "bg-green-500/90 hover:bg-green-500 text-white",
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
          label: "Completed"
        };
      case "FAILED":
        return {
          variant: "destructive",
          className: "",
          icon: <XCircle className="h-3.5 w-3.5 mr-1" />,
          label: "Failed"
        };
      case "RUNNING":
        return {
          variant: "default",
          className: "bg-blue-500 hover:bg-blue-600 text-white",
          icon: <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />,
          label: "Running"
        };
      default:
        return {
          variant: "outline",
          className: "",
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: status || "Unknown"
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Run History</DialogTitle>
          <DialogDescription>{workflowName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium">Failed to load run history</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              There was a problem fetching the workflow history.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : !historyData || historyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No run history found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This workflow hasn&apos;t been executed yet or no history is available.
            </p>
          </div>
        ) : (
          // Simple list view instead of fancy carousel
          <div className="space-y-6">
            {historyData.map((run: WorkflowRun, index: number) => {
              const statusProps = getStatusBadgeProps(run.status);
              const startTime = new Date(run.start_time);
              const endTime = run.end_time ? new Date(run.end_time) : null;
              const duration = endTime
                ? ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(1)
                : null;

              return (
                <Card key={run.id} className="w-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base flex items-center space-x-2">
                          <span>Run #{historyData.length - index}</span>
                          <Badge
                            variant={statusProps.variant}
                            className={`${statusProps.className} ml-2`}
                          >
                            {statusProps.icon}
                            {statusProps.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {format(startTime, "PPp")} • {duration ? `${duration}s` : 'In progress'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {run.error_message && (
                      <div className="text-sm text-destructive">
                        Error: {run.error_message}
                      </div>
                    )}

                    {run.action_logs && run.action_logs.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">
                          Changes ({run.action_logs.reduce((count: number, log: ActionLog) =>
                            count + (log.details?.length || 0), 0)})
                        </h4>

                        <ScrollArea className="h-[250px]">
                          {run.action_logs.map((log: ActionLog, i: number) => (
                            <div key={i} className="mb-4">
                              <div className="flex items-center mb-2">
                                <div className="font-medium text-sm mr-2">
                                  {log.indicator_name || "Unknown indicator"}
                                </div>
                                {log.indicator_code && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.indicator_code}
                                  </Badge>
                                )}
                              </div>

                              {log.details && log.details.length > 0 ? (
                                <div className="space-y-1 pl-4 border-l-2 border-muted">
                                  {log.details.map((detail: DetailItem, j: number) => (
                                    <div key={j} className="text-xs flex items-center">
                                      <span className="w-16 font-medium">{detail.period}</span>

                                      {detail.old_value === "None" ? (
                                        <span className="text-green-600">
                                          Added: {detail.new_value}
                                        </span>
                                      ) : (
                                        <span>
                                          <span className="text-destructive">{detail.old_value}</span>
                                          {" → "}
                                          <span className="text-green-600">{detail.new_value}</span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  No changes recorded
                                </div>
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-sm text-center text-muted-foreground py-4">
                        No data changes were made during this run
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
