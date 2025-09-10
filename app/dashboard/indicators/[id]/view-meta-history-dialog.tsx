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
import { IndicatorEditDetails, UserAction } from "@/types/dashboard"

// A more specific type for metadata changes
type MetadataChangeValue = {
  old: string | number | boolean | null;
  new: string | number | boolean;
};

// Define the structure of indicator history details based on existing UserAction type
interface IndicatorHistoryDetail extends Omit<UserAction, 'details'> {
  details: IndicatorEditDetails | Record<string, MetadataChangeValue | string>;
  user_email?: string;
}

// Define the structure of a history entry
interface InfoHistoryEntry {
  timestamp: string;
  details: IndicatorHistoryDetail[];
  useremail: string;
}

interface ViewMetaHistoryDialogProps {
  infoHistory: InfoHistoryEntry[];
}

export function ViewMetaHistoryDialog({ infoHistory }: ViewMetaHistoryDialogProps) {
  // Reverse the info history array to show newest changes first
  infoHistory = (infoHistory || []).slice().reverse();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">View History</Button>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Indicator Information History</DialogTitle>
          <DialogDescription>
            Browse through the timeline of changes to this indicator&apos;s metadata.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 relative">
        <Carousel className="mx-auto">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <CarouselPrevious />
            </div>
          <CarouselContent>
            {infoHistory.map((entry: InfoHistoryEntry, index: number) => (
              <CarouselItem key={index}>
                <Card className="border shadow-sm">
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center border-b">
                    <span className="text-sm font-medium">Change #{infoHistory.length - index}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {entry.details.map((detail: IndicatorHistoryDetail, detailIndex: number) => (
                      <div key={detailIndex} className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span className="text-tertiary text-xs font-semibold">{detail.user_email || entry.useremail || 'anonymous'}</span>
                          <span className=" text-xs">made the following updates:</span>
                        </p>

                        <div className="bg-muted/20 rounded-md p-3 border border-muted">
                          {Object.entries(detail.details).map(([field, change], changeIndex) => (
                            field !== "user_email" && (
                              <div key={changeIndex} className="grid grid-cols-12 gap-1 py-1.5 text-sm border-b border-muted/50 last:border-0">
                                <span className="col-span-3 font-medium text-secondary">{field}:</span>
                                <div className="col-span-9 flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/70"></div>
                                    <span className="text-muted-foreground text-xs">
                                      {typeof change === 'object' && change !== null ? (change.old || "-") : "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400/70"></div>
                                    <span className="font-medium text-xs">
                                      {typeof change === 'object' && change !== null ? change.new : change}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
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
  )
}
