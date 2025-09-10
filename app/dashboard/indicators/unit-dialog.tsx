import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useCreateUnitMutation, useGetUnitsQuery } from "@/redux/services/indicatorsApiSlice";

interface UnitApiError {
  status?: number;
  data?: {
    error?: string;
    message?: string;
    detail?: string;
  };
  message?: string;
}

interface DialogUnitsProps {
  onUnitAdded: (newUnit: { id: number; name: string; description?: string; }) => void;
}

export function DialogUnits({ onUnitAdded }: DialogUnitsProps) {
    const { toast } = useToast();
    // Use the API slice mutation hook instead of axios
    const [createUnit, { isLoading }] = useCreateUnitMutation();
    // Get existing units for validation
    const { data: units = [] } = useGetUnitsQuery(undefined);

    const unitSchema = z.object({
      name: z.string()
        .min(1, "Name is required")
        .max(50, "Name must be at most 50 characters")
        .refine(
          (val) => {
            // Safe type check for units data
            if (!Array.isArray(units)) return true;
            return !units.some((unit) =>
              typeof unit === 'object' &&
              unit !== null &&
              'name' in unit &&
              typeof unit.name === 'string' &&
              unit.name.toLowerCase() === val.toLowerCase()
            );
          },
          { message: "Unit with this name already exists" }
        ),
      symbol: z.string().min(1, "Symbol is required").max(10, "Symbol must be at most 10 characters"),
      description: z.string().optional(),
    });

    const form = useForm<z.infer<typeof unitSchema>>({
      resolver: zodResolver(unitSchema),
    });

    const handleSubmit = async (data: z.infer<typeof unitSchema>) => {
      try {
        // Disable form resetting until the API call is complete
        const response = await createUnit(data).unwrap();
        form.reset(); // Reset form after successful submission
        onUnitAdded({ id: response.id, name: data.name, description: data.description });
        toast({
          title: `Unit Created Successfully!`,
          description: `${data.name}`,
        });
      } catch (error: unknown) {
        console.error("An error occurred while creating the unit", error);
        const apiError = error as UnitApiError;
        toast({
          variant: "destructive",
          title: "Error creating unit",
          description: apiError.data?.error || apiError.data?.message || apiError.data?.detail || apiError.message || "An error occurred while creating the unit",
        });
      }
    }

    const handleDialogSubmit = () => {
      form.handleSubmit(handleSubmit)();
    }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isLoading}><Plus/></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Unit</DialogTitle>
          <DialogDescription>
            Create a new unit by entering the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
            )}
          />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
          />
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
          />
          </div>
        <DialogFooter>
          <Button onClick={handleDialogSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Unit"}
          </Button>
        </DialogFooter>
    </Form>
      </DialogContent>
    </Dialog>
  )
}
