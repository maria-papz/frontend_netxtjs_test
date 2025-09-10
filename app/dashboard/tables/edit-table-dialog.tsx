import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import EditTableForm from "./edit-table-form"

type EditTableDialogProps = {
  isOpen: boolean
  onClose: () => void
  tableName?: string
  tableId: string
  tableDescription?: string
}

export function EditTableDialog({ isOpen, onClose, tableName,tableDescription,tableId }: EditTableDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
          <DialogDescription>
            Make changes to table name or description here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <EditTableForm tableName={tableName || ""} tableDescription={tableDescription} tableId={tableId} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
