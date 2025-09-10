"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkflowData } from "./workflow-dialog";
import { useCreateWorkflowMutation, useUpdateWorkflowMutation } from "@/redux/services/workflowApiSlice";
import { Loader2 } from "lucide-react";

// Cron pattern: minute hour dayOfMonth month dayOfWeek
const workflowSchema = z.object({
  name: z.string().optional(),
  workflow_type: z.enum(["CYSTAT", "ECB", "EUROSTAT"]),
  schedule_type: z.enum(["preset", "custom"]),
  schedule_preset: z.string().optional(),
  schedule_custom: z.string().optional(),
  minute: z.string().optional(),
  hour: z.string().optional(),
  day_of_month: z.string().optional(),
  month: z.string().optional(),
  day_of_week: z.string().optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.schedule_type === "preset" && !data.schedule_preset) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a schedule preset",
      path: ["schedule_preset"]
    });
  }

  if (data.schedule_type === "custom" &&
    (!data.minute || !data.hour || !data.day_of_month || !data.month || !data.day_of_week)) {
    if (!data.minute) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minute is required for custom schedule",
        path: ["minute"]
      });
    }
    if (!data.hour) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hour is required for custom schedule",
        path: ["hour"]
      });
    }
    if (!data.day_of_month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Day of month is required for custom schedule",
        path: ["day_of_month"]
      });
    }
    if (!data.month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Month is required for custom schedule",
        path: ["month"]
      });
    }
    if (!data.day_of_week) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Day of week is required for custom schedule",
        path: ["day_of_week"]
      });
    }
  }
});

interface WorkflowSetupFormProps {
  initialData: WorkflowData;
  onNext: (data: Partial<WorkflowData>) => void;
  isEditing?: boolean;
}

export default function WorkflowSetupForm({ initialData, onNext, isEditing = false }: WorkflowSetupFormProps) {
  const [createWorkflow, { isLoading: isCreating }] = useCreateWorkflowMutation();
  const [updateWorkflow, { isLoading: isUpdating }] = useUpdateWorkflowMutation();
  const [scheduleType, setScheduleType] = useState<"preset" | "custom">("preset");
  const [processingSubmit, setProcessingSubmit] = useState(false);

  const isLoading = isCreating || isUpdating || processingSubmit;

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: initialData.name || "",
      workflow_type: initialData.workflow_type || "",
      schedule_type: "preset",
      schedule_preset: initialData.schedule_cron || "0 0 1 * *",
      is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      minute: "0",
      hour: "0",
      day_of_month: "1",
      month: "*",
      day_of_week: "*",
    },
  });

  console.log("Form default values:", initialData);

  useEffect(() => {
    if (isEditing && initialData.schedule_cron) {
      const cronParts = initialData.schedule_cron.split(' ');
      if (cronParts.length === 5) {
        form.setValue('minute', cronParts[0]);
        form.setValue('hour', cronParts[1]);
        form.setValue('day_of_month', cronParts[2]);
        form.setValue('month', cronParts[3]);
        form.setValue('day_of_week', cronParts[4]);

        const presetCrons = [
          '0 0 1 * *', // Monthly (1st)
          '0 0 15 * *', // Monthly (15th)
          '0 0 * * 1', // Weekly (Monday)
          '0 0 * * 5', // Weekly (Friday)
          '0 0 * * *', // Daily
          '0 0 1 1,4,7,10 *', // Quarterly
          '0 0 1 1 *' // Yearly
        ];

        if (presetCrons.includes(initialData.schedule_cron)) {
          form.setValue('schedule_type', 'preset');
          form.setValue('schedule_preset', initialData.schedule_cron);
          setScheduleType('preset');
        } else {
          form.setValue('schedule_type', 'custom');
          setScheduleType('custom');
        }
      }
    }

    if (isEditing) {
      console.log("Editing workflow with name:", initialData.name);
      console.log("Form values:", form.getValues());

      if (initialData.name && !form.getValues().name) {
        form.setValue('name', initialData.name);
      }
    }
  }, [isEditing, initialData, form]);

  const handleScheduleTypeChange = (value: "preset" | "custom") => {
    setScheduleType(value);
    form.setValue("schedule_type", value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isLoading) return;

    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors.",
      });
      return;
    }

    setProcessingSubmit(true);

    try {
      const formValues = form.getValues();

      let cronExpression: string;
      if (formValues.schedule_type === "preset") {
        cronExpression = formValues.schedule_preset || "0 0 1 * *";
      } else {
        cronExpression = `${formValues.minute} ${formValues.hour} ${formValues.day_of_month} ${formValues.month} ${formValues.day_of_week}`;
      }

      const workflowData = {
        name: formValues.name,
        workflow_type: formValues.workflow_type,
        schedule_cron: cronExpression,
        is_active: formValues.is_active,
      };

      let response;

      if (isEditing) {
        console.log(`Updating existing workflow ID ${initialData.id}`);
        response = await updateWorkflow({
          id: initialData.id!,
          ...workflowData
        }).unwrap();
        console.log("Workflow updated successfully:", response);
      } else {
        console.log("Creating new workflow:", workflowData);
        response = await createWorkflow(workflowData).unwrap();
        console.log("Workflow created successfully:", response);
      }

      const resultData = {
        ...formValues,
        id: initialData.id || response.id,
        schedule_cron: cronExpression,
      };

      console.log("Moving to next step with:", resultData);
      onNext(resultData);
    } catch (error: unknown) {
      console.error(`Error ${isEditing ? "updating" : "creating"} workflow:`, error);
      const errorMessage = error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data
        ? String(error.data.error)
        : "An unexpected error occurred";

      toast({
        variant: "destructive",
        title: `Error ${isEditing ? "updating" : "creating"} workflow`,
        description: errorMessage,
      });
    } finally {
      setProcessingSubmit(false);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {isEditing && initialData.name && (
          <div className="text-sm text-muted-foreground mb-4">
            Editing workflow: <span className="font-semibold">{initialData.name}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="workflow_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workflow Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CYSTAT">CyStat</SelectItem>
                  <SelectItem value="ECB">ECB</SelectItem>
                  <SelectItem value="EUROSTAT">EuroStat</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the data source type for this workflow.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? "Workflow Name" : "Workflow Name (Optional)"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEditing ? "Enter workflow name" : "Enter a name or leave blank to use source title"}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isEditing
                  ? "Edit the name of this workflow"
                  : "You can provide a custom name or leave blank to use the data source title."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Update Schedule</FormLabel>
          <Tabs
            defaultValue="preset"
            value={scheduleType}
            onValueChange={(value) => handleScheduleTypeChange(value as "preset" | "custom")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">Preset Schedules</TabsTrigger>
              <TabsTrigger value="custom">Custom Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="preset" className="space-y-4">
              <FormField
                control={form.control}
                name="schedule_preset"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select update frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0 0 1 * *">Monthly (1st day)</SelectItem>
                        <SelectItem value="0 0 15 * *">Monthly (15th day)</SelectItem>
                        <SelectItem value="0 0 * * 1">Weekly (Monday)</SelectItem>
                        <SelectItem value="0 0 * * 5">Weekly (Friday)</SelectItem>
                        <SelectItem value="0 0 * * *">Daily</SelectItem>
                        <SelectItem value="0 0 1 1,4,7,10 *">Quarterly (Jan, Apr, Jul, Oct)</SelectItem>
                        <SelectItem value="0 0 1 1 *">Yearly (Jan 1st)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose how often this workflow should run.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minute (0-59)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 0 or */15" />
                      </FormControl>
                      <FormDescription>
                        Use * for any, */15 for every 15 minutes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hour (0-23)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 0 or */2" />
                      </FormControl>
                      <FormDescription>
                        Use * for any, */2 for every 2 hours
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="day_of_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month (1-31)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 1 or 1,15" />
                      </FormControl>
                      <FormDescription>
                        Use * for any day
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month (1-12)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., * or 1,6" />
                      </FormControl>
                      <FormDescription>
                        Use * for every month
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week (0-6)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., * or 1" />
                      </FormControl>
                      <FormDescription>
                        0=Sunday, 1=Monday
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Active
                </FormLabel>
                <FormDescription>
                  Enable or disable this workflow
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update & Continue" : "Next"
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
}
