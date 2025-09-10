import React from "react";
import { Label } from "@/components/ui/label";
import { FieldWrapperProps } from "@autoform/react";

const DISABLED_LABELS = ["boolean", "object", "array"];

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  children,
  id,
  field,
  error,
}) => {
  const isDisabled = DISABLED_LABELS.includes(field.type);

  return (
    <div className="space-y-2">
      {!isDisabled && (
        <Label htmlFor={id}>
          {label}
          {field.required && <span className="text-red-500 dark:text-red-900"> *</span>}
        </Label>
      )}
      {children}
      {field.fieldConfig?.description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {field.fieldConfig.description}
        </p>
      )}
      {error && <p className="text-sm text-red-500 dark:text-red-900">{error}</p>}
    </div>
  );
};
