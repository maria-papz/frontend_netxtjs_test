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
import { ScrollArea } from "@/components/ui/scroll-area"
import { FormulaUpdateDetails } from "@/types/dashboard"

interface InfoHistoryEntry {
  timestamp: string;
  details: {
    action_type: string;
    details: FormulaUpdateDetails;
  }[];
  useremail: string;
}

interface ViewFormulaHistoryDialogProps {
  infoHistory: InfoHistoryEntry[];
}
export function ViewFormulaHistoryDialog({ infoHistory }: ViewFormulaHistoryDialogProps) {
  // Reverse the info history array to show newest changes first
  infoHistory = infoHistory ? [...infoHistory].reverse() : [];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">View Formula History</Button>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Custom Indicator Formula History</DialogTitle>
          <DialogDescription>
            Browse through the timeline of changes to this indicator&apos;s formula.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 relative">
          <Card className="border shadow-sm">
            <CardContent className="p-5 space-y-4">
            <ScrollArea className="max-h-[50vh] overflow-y-auto">

              {infoHistory.map((entry: InfoHistoryEntry, index: number) => (
                <div key={index} className="border-b pb-4 mb-4">
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center border-b">
                    <span className="text-sm font-medium">Change #{infoHistory.length - index}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="space-y-2 mt-2">
                      {/* <p className="text-sm font-medium flex items-center gap-2">
                        <span className="text-tertiary text-xs font-semibold">{entry.useremail || 'anonymous'}</span>
                        <span className="text-xs">made the following updates:</span>
                      </p> */}
                      <div className="bg-muted/20 rounded-md p-3 border border-muted">
                        <div className="grid grid-cols-12 gap-1 py-1.5 text-sm border-b border-muted/50 last:border-0">
                          <span className="col-span-3 font-medium text-secondary">{entry.useremail || 'anonymous'}</span>
                          <div className="col-span-9 flex flex-col">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400/70"></div>
                              <span className="text-muted-foreground text-xs">{detail.details.old_formula || "-"}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400/70"></div>
                              <span className="font-medium text-xs">{detail.details.new_formula}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>

            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
