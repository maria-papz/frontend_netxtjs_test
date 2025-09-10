import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import {  Redo, Undo } from "lucide-react"
import { useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { useDataRestoreMutation } from "@/redux/services/indicatorsApiSlice"

interface HistoryEntry {
  period: string;
  value: string;
  user?: string | null;
}

interface History {
  [timestamp: string]: HistoryEntry[];
}

interface DataUpdateAction {
  action_type: string;
  history: History;
}


const tableCols: ColumnDef<HistoryEntry>[] = [
  {
    header: "Period",
    accessorKey: "period",
    cell: ({ row }) => {
      const value = row.getValue("value") as string;
      if (value && value.includes("->")) {
        return <span className="font-semibold text-tertiary">{row.getValue("period")}</span>;
      }
      return <span>{row.getValue("period")}</span>;
    },
  },
  {
    header: "Value",
    accessorKey: "value",
    cell: ({ row }) => {
      const value = row.getValue("value") as string;
      if (value && value.includes("->")) {
        const [oldValue, newValue] = value.split("->");
        return (
          <span className="font-semibold text-tertiary">
            {oldValue.trim()} → {newValue.trim()}
          </span>
        );
      }
      return <span>{value}</span>;
    },
  },
  {
    header: "User",
    accessorKey: "user",
    cell: ({ row }) => {
      const value = row.getValue("value") as string;
      const user = row.getValue("user") as string | null;
      if (value && value.includes("->")) {
        return <span className="font-semibold text-tertiary">{user || "Automated Workflow"}</span>;
      }
      return <span>{user}</span>;
    },
  },
];

interface ViewDataHistoryDialogProps {
  dataHistory: DataUpdateAction;
  refetch?: () => void; // Add refetch function prop
}

export function ViewDataHistoryDialog({ dataHistory, refetch }: ViewDataHistoryDialogProps) {
  const timestamps = Object.keys(dataHistory.history);
  const historyArrays = timestamps.map((timestamp) => dataHistory.history[timestamp]);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const [restoreData] = useDataRestoreMutation();

  const handleRestore = async (
    timestamp: string,
    type: "original" | "changed",
    entries: HistoryEntry[]
  ) => {
    if (!params.id) return;

    try {
      setIsRestoring(type);

      const response = await restoreData({
        id: params.id,
        timestamp,
        type,
        entries
      }).unwrap();

      toast({
        title: "Data restored successfully",
        description: response.message || `Successfully restored data to ${type} values`,
        variant: "default",
      });

      // Call the refetch function if provided
      if (refetch) {
        refetch();
      }

      // Refresh the page to show updated data
      // router.refresh();
    } catch (error) {
      console.error("Error restoring data:", error);
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">View Data Value History</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Indicator Data History</DialogTitle>
          <DialogDescription>
            Below is a series of the latest changes on this indicator&apos;s data values.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 relative">
          <Carousel className="max-w-xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <CarouselPrevious />
            </div>
            <CarouselContent>
              {timestamps.map((timestamp, index) => (
                <CarouselItem key={index}>
                  <Card className="border shadow-sm w-full">
                    <CardContent className="p-4 max-h-[80vh] ">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b">
                        <div className="text-right">
                          <span className="text-secondary font-medium text-sm">timestamp: </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-full overflow-auto" style={{ maxHeight: "50vh" }}>
                        <DataTable
                          columns={tableCols}
                          data={historyArrays[index]}
                          name={""}
                          isInfo={true}
                        />
                      </div>
                      <div className="mt-4 pt-3 border-t">
                        <div className="bg-gradient-to-r from-secondary/90 via-secondary/90 to-yellow-500/90 p-4 rounded-full shadow-md border border-yellow-500/30 backdrop-blur-sm">
                          <span className="font-medium text-white text-sm text-center block mb-2">
                            Restore data values from this timestamp
                          </span>
                          <div className="flex gap-2 justify-center items-center">
                            <Button
                              size="sm"
                              className="text-xs h-8 rounded-full bg-black/10 dark:bg-black/10 hover:bg-yellow-800/30 dark:hover:bg-yellow-800/30 transition-all"
                              onClick={() => handleRestore(timestamp, "original", historyArrays[index])}
                              disabled={!!isRestoring}
                            >
                              {isRestoring === "original" ? (
                                <span className="flex items-center">
                                  <span className="h-3 w-3 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                                  <span className="text-slate-100">Restoring...</span>
                                </span>
                              ) : (
                                <>
                                  <Undo className="mr-1.5 h-3.5 w-3.5 text-yellow-300" />
                                  <span className="text-slate-100">Original Values</span>
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              className="text-xs h-8 rounded-full bg-black/10 dark:bg-black/10 hover:bg-yellow-800/30 dark:hover:bg-yellow-800/30 transition-all"
                              onClick={() => handleRestore(timestamp, "changed", historyArrays[index])}
                              disabled={!!isRestoring}
                            >
                              {isRestoring === "changed" ? (
                                <span className="flex items-center">
                                  <span className="h-3 w-3 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                                  <span className="text-slate-100">Restoring...</span>
                                </span>
                              ) : (
                                <>
                                  <span className="text-slate-100">Changed Values</span>
                                  <Redo className="ml-1.5 h-3.5 w-3.5 text-yellow-300" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <CarouselNext />
            </div>
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}
