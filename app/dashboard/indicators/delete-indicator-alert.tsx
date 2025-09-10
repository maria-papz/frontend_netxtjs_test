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
import { useDeleteIndicatorMutation } from "@/redux/services/indicatorsApiSlice";

type EditIndicatorDialogProps = {
  isOpen: boolean
  onClose: () => void
  id: string
}

export function DeleteIndicatorAlert({ isOpen, onClose, id }: EditIndicatorDialogProps) {
  const [deleteIndicator] = useDeleteIndicatorMutation();

  const handleDeleteIndicator = async (id: string) => {
    try {
      await deleteIndicator(id).unwrap();
      toast({
        title: `Indicator Deleted Successfully!`,
        description: `Indicator has been deleted.`,
      });
      onClose();
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
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this indicator and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDeleteIndicator(id)}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
