import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { SquarePen } from "lucide-react"
import { EditIndicatorDialog } from "../edit-indicator-dialog";
import { useState } from "react";
import { getFrequencyDisplayName, getAccessLevelDisplayName } from "@/types/dashboard";

type CardProps = React.ComponentProps<typeof Card>

interface IndicatorMetadata {
  id: string;
  unit?: string;
  name: string;
  region?: string;
  country?: string;
  code: string;
  base_year?: number;
  description: string;
  source?: string;
  category: string;
  is_seasonally_adjusted?: boolean;
  frequency: string;
  is_custom?: boolean;
  currentPrices?: boolean;
  access_level: string;
}

interface IndicatorCardProps{
  CardProps: CardProps
  indicatorInfo: IndicatorMetadata
  refetch?: () => void; // Add refetch function prop
}

export function IndicatorInfoCard({ CardProps: { className, ...props }, indicatorInfo, refetch }: IndicatorCardProps) {
  const [open, setOpen] = useState(false);

  // Create a function to handle dialog close with refetch
  const handleDialogClose = () => {
    setOpen(false);
    if (refetch) {
      refetch();
    }
  };

  return (
    <>
    <Card className={cn("min-w-[40vw] justify-center items-center mx-auto my-auto hover:bg-zinc-50 dark:hover:bg-zinc-900", className)} {...props} style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <CardHeader className="flex justify-between items-left pt-2 pl-2 pr-2">
      {/* <CardTitle className="flex items-left text-xl font-semibold"> */}

      <Button onClick={()=>setOpen(true)} size="icon" variant="outline" className="ml-auto">
      <SquarePen />
      </Button>
      {/* </CardTitle> */}

      </CardHeader>

      <CardContent>
      <div className="text-sm">
        <div className="grid grid-cols-1 gap-x-4 gap-y-1">
        {indicatorInfo.region && (
          <div className="hover:text-gray-500">
          <strong className="text-secondary">Region:</strong> {indicatorInfo.region}
          </div>
        )}
        {indicatorInfo.country && (
          <div className="hover:text-gray-500">
          <strong className="text-secondary">Country:</strong> {indicatorInfo.country}
          </div>
        )}
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Code:</strong> {indicatorInfo.code}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Base Year:</strong> {indicatorInfo.base_year}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Source:</strong> {indicatorInfo.source}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Unit:</strong> {indicatorInfo.unit}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Category:</strong> {indicatorInfo.category}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Seasonally Adjusted:</strong> {indicatorInfo.is_seasonally_adjusted ? "Yes" : "No"}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Data Frequency:</strong> {getFrequencyDisplayName(indicatorInfo.frequency)}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Custom Indicator:</strong> {indicatorInfo.is_custom ? "Yes" : "No"}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Current Prices:</strong> {indicatorInfo.currentPrices ? "Yes" : "No"}
        </div>
        <div className="hover:text-gray-500">
          <strong className="text-secondary">Access Level:</strong> {getAccessLevelDisplayName(indicatorInfo.access_level)}
        </div>
        </div>
      </div>
      </CardContent>
      {/* <CardFooter></CardFooter> */}
    </Card>
    <EditIndicatorDialog
      id={indicatorInfo.id}
      name={indicatorInfo.name}
      code={indicatorInfo.code}
      description={indicatorInfo.description}
      source={indicatorInfo.source}
      frequency={indicatorInfo.frequency.toString()}
      seasonallyAdjusted={indicatorInfo.is_seasonally_adjusted ? "true" : "false"}
      baseYear={indicatorInfo.base_year}
      isCustom={indicatorInfo.is_custom ? "true" : "false"}
      country={indicatorInfo.country}
      region={indicatorInfo.region}
      category={indicatorInfo.category}
      currentPrices={indicatorInfo.currentPrices ? "true" : "false"}
      isOpen={open}
      setOpen={handleDialogClose} // Use the custom handler that includes refetch
      unit={indicatorInfo.unit}/>
    </>
  )
}
