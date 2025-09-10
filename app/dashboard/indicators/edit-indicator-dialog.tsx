import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import EditIndicatorForm from "./edit-indicator-form"

type EditIndicatorDialogProps = {
  isOpen: boolean
  setOpen: (open: boolean) => void // This can be a function that does more than just set state
  id:string,
  name: string;
  code: string;
  description: string;
  source?: string;
  frequency: string;
  otherFrequency?: string;
  seasonallyAdjusted?: string;
  baseYear?: number;
  isCustom?: string;
  country?: string;
  region?: string;
  category: string;
  currentPrices?: string;
  unit?:string;
}

export function EditIndicatorDialog({
  isOpen,
  setOpen,
  id,
  name,
  unit,
  code,
  description,
  source,
  frequency,
  otherFrequency,
  seasonallyAdjusted,
  baseYear,
  isCustom,
  country,
  region,
  category,
  currentPrices
}: EditIndicatorDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Indicator</DialogTitle>
          <DialogDescription>
            Make changes to indicator information here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <EditIndicatorForm
            id={id}
            name={name}
            code={code}
            description={description}
            source={source}
            frequency={frequency}
            otherFrequency={otherFrequency}
            seasonallyAdjusted={seasonallyAdjusted}
            baseYear={baseYear}
            isCustom={isCustom}
            country={country}
            region={region}
            category={category}
            currentPrices={currentPrices}
            unit={unit}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
