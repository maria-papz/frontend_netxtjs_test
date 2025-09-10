import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";
import PermissionsForm from "./permissions-form";

// TODO: Groups to include group permissions e.g. KOE or specific teams like "Tax team"

interface PermissionsDialogProps {
  indicatorId: string | number;
  triggerLabel?: string;
  onPermissionsChanged?: () => void;
}

const PermissionsDialog: React.FC<PermissionsDialogProps> = ({
  indicatorId,
  triggerLabel = "Manage Access",
  onPermissionsChanged
}) => {
  const [open, setOpen] = React.useState(false);

  const handlePermissionsSaved = () => {
    setOpen(false);
    if (onPermissionsChanged) {
      onPermissionsChanged();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LockIcon className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Access Rights</DialogTitle>
          <DialogDescription>
            Set who can view, edit, and delete this indicator.
          </DialogDescription>
        </DialogHeader>

        <PermissionsForm
          indicatorId={indicatorId}
          onClose={() => setOpen(false)}
          onSaved={handlePermissionsSaved}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PermissionsDialog;
