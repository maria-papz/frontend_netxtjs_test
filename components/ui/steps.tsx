import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label: string;
  description?: string;
  "data-value"?: number;
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full items-center",
          className
        )}
        {...props}
      />
    );
  }
);

Steps.displayName = "Steps";

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, value, label, description, "data-value": dataValue, ...props }, ref) => {
    // Get the current step value from the parent Steps component
    const currentValue = dataValue !== undefined
      ? Number(dataValue)
      : 0;

    // Determine if this step is active, completed, or upcoming
    const isCompleted = currentValue > value;
    const isActive = currentValue === value;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-1 flex-col relative",
          className
        )}
        {...props}
      >
        {/* Connecting line */}
        {value > 0 && (
          <div
            className={cn(
              "absolute left-0 top-5 h-0.5 w-full -translate-x-1/2",
              isCompleted || isActive ? "bg-secondary" : "bg-muted"
            )}
          />
        )}

        {/* Step circle */}
        <div className="flex flex-col items-center z-10 mb-2">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2",
              isCompleted
                ? "border-secondary bg-secondary text-secondary-foreground"
                : isActive
                  ? "border-secondary bg-background text-secondary"
                  : "border-muted bg-muted/30 text-muted-foreground"
            )}
          >
            {isCompleted ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <span className="text-base font-medium">{value + 1}</span>
            )}
          </div>
        </div>

        {/* Step text */}
        <div className="text-center space-y-1 px-3">
          <p
            className={cn(
              "text-sm font-medium",
              isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </p>
          {description && (
            <p
              className={cn(
                "text-xs",
                isActive || isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Step.displayName = "Step";

export { Steps, Step };
