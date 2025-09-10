import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {Trash} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast";
import { useDeleteIndicatorFromTableMutation } from "@/redux/services/tablesApiSlice";

interface DeleteIndicatorsAlertProps {
  tableId: string
  indicatorId: string
  tableName: string
  indicatorName: string
}

export function DeleteIndicatorsAlert({tableId, indicatorId, tableName, indicatorName}: DeleteIndicatorsAlertProps) {
  const [deleteIndicatorFromTable] = useDeleteIndicatorFromTableMutation();

  const handleDeleteIndicator = async (tableId: string, indicatorId: string) => {
    try {
      await deleteIndicatorFromTable({ tableId, indicatorId }).unwrap();
      toast({
        title: `Indicator Deleted Successfully!`,
        description: `Indicator has been deleted.`,
      });
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error deleting indicator:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data
        ? String(error.data.error)
        : "Failed to delete indicator";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="on-hover:size-lg"><Trash/></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove this indicator ({indicatorName}, id:{indicatorId}) from the table {tableName}, id:{tableId}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDeleteIndicator(tableId,indicatorId)}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
