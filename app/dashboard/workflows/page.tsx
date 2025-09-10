"use client";

import { useState, useEffect, useRef } from "react";
import {
  useGetWorkflowsQuery,
  useRunWorkflowMutation,
  useToggleWorkflowActiveMutation,
  useDeleteWorkflowMutation
} from "@/redux/services/workflowApiSlice";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import WorkflowDialog from "@/components/workflows/workflow-dialog";
import WorkflowHistoryDialog from "@/components/workflows/workflow-history-dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Trash,
  Edit,
  RefreshCw,
  AlertCircle,
  BarChart3,
  CheckCircle,
  XCircle,
  Settings,
  Loader2,
  Database,
  Activity,
  Code,
  Cpu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  WorkflowItem,
  WorkflowHistoryItem,
  WorkflowDialogRef,
  WorkflowData,
  WorkflowType
} from "@/types/workflow";

// Enhanced Blob component with improved movement across the page
const AnimatedBlob = () => {
  const [position, setPosition] = useState({ x: 50, y: 30 });
  const [size, setSize] = useState(100);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Use a ref to store the target positions for smoother animation sequences
  const animationQueue = useRef<Array<{x: number, y: number, size: number}>>([]);

  useEffect(() => {
    // Generate several random positions to create a movement path
    const generateAnimationPath = () => {
      // Clear existing queue
      animationQueue.current = [];


      // Generate 3-5 waypoints across the page
      const waypoints = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < waypoints; i++) {
        // Generate a position anywhere on the page with wider bounds
        // This ensures more movement across the entire page
        const newX = Math.random() * 80 + 10; // 10-90% of width
        const newY = Math.random() * 70 + 10; // 10-80% of height
        const newSize = Math.random() * 50 + 150; // 250-350px

        animationQueue.current.push({
          x: newX,
          y: newY,
          size: newSize
        });

      }
    };

    const moveToNextPosition = () => {
      // If queue is empty, generate new path
      if (animationQueue.current.length === 0) {
        generateAnimationPath();
      }

      // Get next position from queue
      const nextPosition = animationQueue.current.shift();

      if (nextPosition) {
        setPosition({ x: nextPosition.x, y: nextPosition.y });
        setSize(nextPosition.size);
      }

      // Schedule next movement
      timeoutRef.current = setTimeout(moveToNextPosition, 8000);
    };

    // Initialize on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      generateAnimationPath();
      // Start with a short delay
      timeoutRef.current = setTimeout(moveToNextPosition, 1000);
      return;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Add a slow pulsing animation for additional visual interest
  const [pulseSize, setPulseSize] = useState(0);

  useEffect(() => {
    const pulsateInterval = setInterval(() => {
      setPulseSize(prev => (prev + 1) % 20); // 0-19 range
    }, 300);

    return () => clearInterval(pulsateInterval);
  }, []);

  const pulseOffset = Math.sin(pulseSize * 0.3) * 10; // Gentle sine wave

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute rounded-full"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: `${size + pulseOffset}px`,
          height: `${size + pulseOffset}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(234,179,8,0.9) 40%, rgba(207,144,49,0.6) 50%, rgba(207,144,49,0.3) 70%, rgba(207,144,49,0) 90%)',
          boxShadow: '0 0 60px 20px rgba(234,179,8,0.15)',
          filter: 'blur(30px)',
          transition: 'left 8s ease-in-out, top 8s ease-in-out, width 5s ease-in-out, height 5s ease-in-out',
        }}
      />
    </div>
  );
};

export default function WorkflowsPage() {
  const { data: workflows, isLoading, refetch } = useGetWorkflowsQuery({});
  const [runWorkflow, { isLoading: isRunning }] = useRunWorkflowMutation();
  const [toggleWorkflowActive] = useToggleWorkflowActiveMutation();
  const [deleteWorkflow, { isLoading: isDeleting }] = useDeleteWorkflowMutation();
  const [runningWorkflowId, setRunningWorkflowId] = useState<number | null>(null);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<number | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowData | null>(null);
  const [historyWorkflow, setHistoryWorkflow] = useState<WorkflowHistoryItem | null>(null);
  const workflowDialogRef = useRef<WorkflowDialogRef>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [refetch]);

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
    } else if (minute === "0" && hour === "0" && dayOfMonth === "1" && month === "1,4,7,10" && dayOfWeek === "*") {
      return "Quarterly (Jan, Apr, Jul, Oct)";
    } else if (minute === "0" && hour === "0" && dayOfMonth === "1" && month === "1" && dayOfWeek === "*") {
      return "Yearly on January 1st";
    }

    // More human-readable format for custom schedules
    let readableFormat = "";

    // Handle time (hour and minute)
    if (minute === "0" && hour === "0") {
      readableFormat = "At midnight";
    } else if (minute === "0") {
      readableFormat = `At ${hour}:00`;
    } else {
      readableFormat = `At ${hour}:${minute.padStart(2, "0")}`;
    }

    // Handle day of month
    if (dayOfMonth !== "*") {
      if (dayOfMonth.includes(",")) {
        const days = dayOfMonth.split(",");
        readableFormat += ` on days ${days.join(", ")}`;
      } else {
        readableFormat += ` on day ${dayOfMonth}`;
      }
    }

    // Handle month
    if (month !== "*") {
      const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (month.includes(",")) {
        const months = month.split(",").map(m => {
          const monthNum = parseInt(m);
          return monthNum >= 1 && monthNum <= 12 ? monthNames[monthNum] : m;
        });
        readableFormat += ` of ${months.join(", ")}`;
      } else {
        const monthNum = parseInt(month);
        if (monthNum >= 1 && monthNum <= 12) {
          readableFormat += ` of ${monthNames[monthNum]}`;
        } else {
          readableFormat += ` of month ${month}`;
        }
      }
    }

    // Handle day of week
    if (dayOfWeek !== "*") {
      const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      if (dayOfWeek.includes(",")) {
        const days = dayOfWeek.split(",").map(d => {
          const dayNum = parseInt(d);
          return dayNum >= 0 && dayNum <= 6 ? weekdayNames[dayNum] : d;
        });
        readableFormat += ` on ${days.join(", ")}`;
      } else {
        const dayNum = parseInt(dayOfWeek);
        if (dayNum >= 0 && dayNum <= 6) {
          readableFormat += ` on ${weekdayNames[dayNum]}`;
        } else {
          readableFormat += ` on day ${dayOfWeek} of week`;
        }
      }
    }

    return readableFormat;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const handleRunWorkflow = async (id: number) => {
    try {
      setRunningWorkflowId(id);
      const response = await runWorkflow(id).unwrap();

      toast({
        title: "Workflow started",
        description: response.message || "The workflow has been triggered. Check back later for results.",
        variant: "default",
      });

      setTimeout(() => {
        refetch();
        setRunningWorkflowId(null);
      }, 2000);
    } catch (error: unknown) {
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error.data as { error?: string })
        : { error: "Failed to run workflow" };

      toast({
        variant: "destructive",
        title: "Error running workflow",
        description: errorData.error || "Failed to run workflow",
      });
      setRunningWorkflowId(null);
    }
  };

  const handleToggleActive = async (id: number, currentState: boolean) => {
    try {
      await toggleWorkflowActive({ id, is_active: !currentState }).unwrap();
      toast({
        title: currentState ? "Workflow disabled" : "Workflow enabled",
        description: `The workflow has been ${currentState ? "disabled" : "enabled"} successfully.`,
      });
      refetch();
    } catch (error: unknown) {
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error.data as { error?: string })
        : { error: "Failed to update workflow status" };

      toast({
        variant: "destructive",
        title: "Error updating workflow",
        description: errorData.error || "Failed to update workflow status",
      });
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    try {
      setDeletingWorkflowId(id);
      await deleteWorkflow(id).unwrap();
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      });
      refetch();
    } catch (error: unknown) {
      console.error("Error deleting workflow:", error);
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error.data as { error?: string })
        : { error: "Failed to delete workflow" };

      toast({
        variant: "destructive",
        title: "Error deleting workflow",
        description: errorData.error || "Failed to delete workflow",
      });
    } finally {
      setDeletingWorkflowId(null);
    }
  };

  const handleEditWorkflow = async (workflow: WorkflowItem) => {
    // Convert WorkflowItem to WorkflowData by asserting the workflow_type as WorkflowType
    const workflowData: WorkflowData = {
      ...workflow,
      workflow_type: workflow.workflow_type as WorkflowType,
    };

    setEditingWorkflow(workflowData);
    if (workflowDialogRef.current) {
      workflowDialogRef.current.openDialog(workflowData);
    }
  };

  const handleViewHistory = (workflow: WorkflowHistoryItem) => {
    setHistoryWorkflow({ id: workflow.id, name: workflow.name });
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

  return (
    <div className="container mx-auto py-8 relative min-h-screen isolate">
      {/* Animated blob background with higher z-index but below content */}
      <AnimatedBlob />

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-secondary">
            Data Workflows
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate your data collection pipelines with intelligent workflows
          </p>
        </div>
        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  className="relative overflow-hidden transition-all hover:shadow-md hover:border-secondary/50 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-secondary/20 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-all after:-translate-x-full hover:after:translate-x-full after:duration-500"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh list</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <WorkflowDialog ref={workflowDialogRef} initialWorkflow={editingWorkflow || undefined} onWorkflowChange={() => setEditingWorkflow(null)} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-md overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-20 mr-2" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : workflows && workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {workflows.map((workflow: WorkflowItem) => (
            <Card
              key={workflow.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl backdrop-blur-sm border ${
                workflow.is_active
                  ? "border-slate-200/50 dark:border-slate-800/50"
                  : "border-dashed border-muted-foreground/30"
              } group`}
            >
              <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>{workflow.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

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

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Workflow Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditWorkflow(workflow)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit Configuration
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(workflow.id, workflow.is_active)}>
                        {workflow.is_active ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" /> Disable Workflow
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" /> Enable Workflow
                          </>
                        )}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" /> Delete Workflow
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this workflow and all its configuration.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteWorkflow(workflow.id)}
                              disabled={isDeleting && deletingWorkflowId === workflow.id}
                            >
                              {isDeleting && deletingWorkflowId === workflow.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {workflow.workflow_type === "CYSTAT" && workflow.indicator_codes && (
                <div className="px-6 pb-1 relative z-10">
                  <ScrollArea className="h-12 w-full">
                    <div className={`flex flex-wrap gap-1.5 ${!workflow.is_active ? "opacity-50" : ""}`}>
                      {workflow.indicator_codes.map((code: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-background/80">
                          {code}
                        </Badge>
                      ))}
                      {!workflow.indicator_codes?.length && (
                        <span className="text-xs text-muted-foreground">No indicators mapped</span>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <CardContent className={`space-y-4 pb-2 relative z-10 ${!workflow.is_active ? "opacity-70" : ""}`}>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-muted to-transparent mb-2"></div>
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
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> Success
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
                    onClick={() => handleViewHistory(workflow)}
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
                      variant="default"
                      size="sm"
                      onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                      className="bg-secondary hover:bg-secondary-foreground"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/20 relative z-10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Workflows Found</h3>
          <p className="text-muted-foreground mb-6">
            Create your first workflow to start automating data collection.
          </p>
          <WorkflowDialog />
        </div>
      )}
      {historyWorkflow && (
        <WorkflowHistoryDialog
          workflowId={historyWorkflow.id}
          workflowName={historyWorkflow.name}
          open={!!historyWorkflow}
          onOpenChange={(open) => !open && setHistoryWorkflow(null)}
        />
      )}
    </div>
  );
}
