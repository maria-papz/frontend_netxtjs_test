import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
  Activity,
  Code,
  Cpu,
  Calendar,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import WorkflowHistoryDialog from "@/components/workflows/workflow-history-dialog";
import { useRunWorkflowMutation } from "@/redux/services/workflowApiSlice";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type CardProps = React.ComponentProps<typeof Card>;

interface SourceData {
  url?: string;
  table?: string;
  parameters?: string;
  frequency?: string;
  start_period?: string;
}

interface WorkflowInfo {
  id: number;
  name: string;
  workflow_type: string;
  is_active: boolean;
  schedule_cron: string;
  next_run: string | null;
  last_run: string | null;
  last_run_success: boolean | null;
  source_data?: SourceData;
  user_url?: string;
}

interface IndicatorWorkflowCardProps {
  CardProps?: CardProps;
  workflows: WorkflowInfo[];
}

export function IndicatorWorkflowCard({
  CardProps = {},
  workflows
}: IndicatorWorkflowCardProps) {
  const { className, ...props } = CardProps;
  const [runWorkflow, { isLoading: isRunning }] = useRunWorkflowMutation();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<string>("");
  const [runningWorkflowId, setRunningWorkflowId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleRunWorkflow = async (id: number) => {
    try {
      setRunningWorkflowId(id);
      await runWorkflow(id).unwrap();
      toast({
        title: "Success",
        description: "Workflow execution started",
        variant: "default",
      });
      setTimeout(() => {
        setRunningWorkflowId(null);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run workflow",
        variant: "destructive",
      });
      console.error("Error running workflow:", error);
      setRunningWorkflowId(null);
    }
  };

  const openHistoryDialog = (id: number, name: string) => {
    setSelectedWorkflowId(id);
    setSelectedWorkflowName(name);
    setIsHistoryOpen(true);
  };

  const getWorkflowTypeBadge = (type: string) => {
    switch (type) {
      case "CYSTAT":
        return "bg-gradient-to-r from-yellow-500 to-secondary text-white";
      case "ECB":
        return "bg-gradient-to-r from-green-400 to-tertiary text-white";
      case "EUROSTAT":
        return "bg-gradient-to-r from-secondary to-tertiary via-yellow-500 text-white";
      default:
        return "bg-gradient-to-r from-yellow-500 to-secondary text-white";
    }
  };

  const getWorkflowTypeIcon = (type: string) => {
    switch (type) {
      case "CYSTAT":
        return <Database className="h-4 w-4" />;
      case "ECB":
        return <Activity className="h-4 w-4" />;
      case "EUROSTAT":
        return <Code className="h-4 w-4" />;
      default:
        return <Cpu className="h-4 w-4" />;
    }
  };

  const formatSchedule = (cronExpression: string) => {
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) return "Invalid schedule";

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return "Daily at midnight";
    } else if (minute === "0" && hour === "0" && dayOfMonth === "1" && month === "*" && dayOfWeek === "*") {
      return "Monthly on the 1st";
    } else if (minute === "0" && hour === "0" && dayOfMonth === "15" && month === "*" && dayOfWeek === "*") {
      return "Monthly on the 15th";
    } else if (minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" && dayOfWeek === "1") {
      return "Weekly on Monday";
    } else if (minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" && dayOfWeek === "5") {
      return "Weekly on Friday";
    }

    return cronExpression;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  // Format source URL for display (truncate if too long)
  const formatUrl = (url?: string) => {
    if (!url) return "N/A";
    if (url.length > 50) {
      return url.substring(0, 47) + "...";
    }
    return url;
  };

  if (!workflows || workflows.length === 0) {
    return null;
  }

  return (
    <>
      <Card
        className={cn("min-w-[40vw] mx-auto my-4", className)}
        {...props}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-secondary" />
            Data Update Workflows
          </CardTitle>
          <CardDescription>
            Automated data collection linked to this indicator
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg backdrop-blur-sm border ${
                workflow.is_active
                  ? "border-slate-200/50 dark:border-slate-800/50"
                  : "border-dashed border-muted-foreground/30"
              } group`}
            >
              <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className={`text-base font-medium line-clamp-2 group-hover:line-clamp-none transition-all ${
                        !workflow.is_active ? "text-muted-foreground" : ""
                      }`}>
                        {workflow.name}
                      </CardTitle>
                      {!workflow.is_active && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-muted-foreground/50">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <CardDescription className="mt-1 flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className={`${getWorkflowTypeBadge(workflow.workflow_type)} ${!workflow.is_active ? "opacity-50" : ""} px-2 py-0.5 inline-flex items-center gap-1.5 shadow-sm`}
                      >
                        {getWorkflowTypeIcon(workflow.workflow_type)}
                        {workflow.workflow_type}
                      </Badge>
                      <span className={`text-xs ${!workflow.is_active ? "text-muted-foreground/70" : ""}`}>
                        {formatSchedule(workflow.schedule_cron)}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className={`space-y-4 pb-2 relative z-10 ${!workflow.is_active ? "opacity-70" : ""}`}>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-muted to-transparent mb-2"></div>

                {/* Source information section */}
                {workflow.source_data && (
                  <Accordion type="single" collapsible className="w-full mb-2">
                    <AccordionItem value="source-info" className="border-none">
                      <AccordionTrigger className="py-1 text-sm font-medium text-secondary hover:no-underline">
                        Source Information
                      </AccordionTrigger>
                      <AccordionContent className="text-xs">
                        <div className="space-y-2 bg-secondary/5 p-2 rounded-md">
                          {/* CyStat specific fields */}
                          {workflow.workflow_type === "CYSTAT" && workflow.source_data.url && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">API URL:</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="max-w-[180px] truncate text-muted-foreground">
                                        {formatUrl(workflow.source_data.url)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="break-all">{workflow.source_data.url}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              {workflow.user_url && (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Web URL:</span>
                                  <a
                                    href={workflow.user_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-secondary hover:underline truncate max-w-[180px]"
                                  >
                                    {formatUrl(workflow.user_url)}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </div>
                              )}

                            </div>
                          )}

                          {/* ECB specific fields */}
                          {workflow.workflow_type === "ECB" && workflow.source_data.table && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Table:</span>
                                <span>{workflow.source_data.table}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Parameters:</span>
                                <span className="max-w-[180px] truncate">
                                  {workflow.source_data.parameters || "N/A"}
                                </span>
                              </div>
                              {workflow.user_url && (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Web URL:</span>
                                  <a
                                    href={workflow.user_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-secondary hover:underline truncate max-w-[180px]"
                                  >
                                    {formatUrl(workflow.user_url)}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Frequency:</span>
                                <span>{workflow.source_data.frequency || "N/A"}</span>
                              </div>
                            </div>
                          )}

                          {/* Eurostat specific fields */}
                          {workflow.workflow_type === "EUROSTAT" && workflow.source_data.url && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">API URL:</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="max-w-[180px] truncate text-muted-foreground">
                                        {formatUrl(workflow.source_data.url)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="break-all">{workflow.source_data.url}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              {workflow.user_url && (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Data Browser:</span>
                                  <a
                                    href={workflow.user_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-secondary hover:underline truncate max-w-[180px]"
                                  >
                                    {formatUrl(workflow.user_url)}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Frequency:</span>
                                <span>{workflow.source_data.frequency || "N/A"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                <div className="flex items-center text-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 mr-3">
                    <RefreshCw className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="w-24 text-muted-foreground">Next Run:</span>
                  {!workflow.is_active ? (
                    <span className="font-medium italic text-muted-foreground/60 blur-[0.5px]">
                      Not scheduled
                    </span>
                  ) : (
                    <span className="font-medium">
                      {formatDate(workflow.next_run)}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 mr-3">
                    <Clock className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="w-24 text-muted-foreground">Last Run:</span>
                  <span className="font-medium">{formatDate(workflow.last_run)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 mr-3">
                    <BarChart3 className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="w-24 text-muted-foreground">Status:</span>
                  <span className="font-medium flex items-center">
                    {workflow.last_run_success === false ? (
                      <>
                        <XCircle className="h-4 w-4 text-destructive mr-1" /> Failed
                      </>
                    ) : workflow.last_run_success === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" /> Success
                      </>
                    ) : (
                      'Not run yet'
                    )}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 relative z-10">
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openHistoryDialog(workflow.id, workflow.name)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    History
                  </Button>

                  {workflow.is_active ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRunWorkflow(workflow.id)}
                      disabled={isRunning && runningWorkflowId === workflow.id}
                    >
                      {isRunning && runningWorkflowId === workflow.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="opacity-50"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Inactive
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>

      {selectedWorkflowId && (
        <WorkflowHistoryDialog
          workflowId={selectedWorkflowId}
          workflowName={selectedWorkflowName}
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
        />
      )}
    </>
  );
}
