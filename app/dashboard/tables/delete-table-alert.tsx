import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast";
import { useDeleteTableMutation } from "@/redux/services/tablesApiSlice";

type EditTableDialogProps = {
  isOpen: boolean
  onClose: () => void
  tableId: string
}

export function DeleteTableAlert({ isOpen, onClose, tableId }: EditTableDialogProps) {
  const [deleteTable] = useDeleteTableMutation();

  const handleDeleteTable = async (tableId: string) => {
    try {
      await deleteTable(tableId).unwrap();
      toast({
        title: `Table Deleted Successfully!`,
        description: `Table has been deleted.`,
      });
      onClose();
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error deleting table:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data
        ? String(error.data.error)
        : "Failed to delete table";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            table and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDeleteTable(tableId)}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
