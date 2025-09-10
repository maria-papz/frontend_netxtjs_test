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
import { useCreateRegionMutation, useGetRegionsQuery } from "@/redux/services/indicatorsApiSlice"

interface RegionApiError {
  status?: number;
  data?: {
    error?: string;
    message?: string;
    detail?: string;
  };
  message?: string;
}

interface DialogRegionsProps {
  onRegionAdded: (newRegion: { id: number; name: string; description: string;  }) => void;
}

export function DialogRegions({ onRegionAdded }: DialogRegionsProps) {
    const { toast } = useToast();
    const [createRegion, { isLoading }] = useCreateRegionMutation();
    // Get existing regions for validation
    const { data: regions = [] } = useGetRegionsQuery({});

    const regionSchema = z.object({
        name: z.string()
          .min(1, "Name is required")
          .refine(
            (val) => {
              // Safe type check for regions data
              if (!Array.isArray(regions)) return true;
              return !regions.some((region) =>
                typeof region === 'object' &&
                region !== null &&
                'name' in region &&
                typeof region.name === 'string' &&
                region.name.toLowerCase() === val.toLowerCase()
              );
            },
            { message: "Region with this name already exists" }
          ),
        description: z.string().optional(),
    });

    const form = useForm<z.infer<typeof regionSchema>>({
      resolver: zodResolver(regionSchema),
    });

    const handleSubmit = async (data: z.infer<typeof regionSchema>) => {
      try {
        const response = await createRegion(data).unwrap();
        form.reset(); // Reset form after successful submission
        onRegionAdded({
          id: response.id,
          name: data.name,
          description: data.description || "" // Ensure description is a string
        });
        toast({
          title: `Region Created Successfully!`,
          description: `${data.name}`,
        });
      } catch (error: unknown) {
        console.error("An error occurred while creating the region", error);
        const apiError = error as RegionApiError;
        toast({
          variant: "destructive",
          title: "Error creating region",
          description: apiError.data?.error || apiError.data?.message || apiError.data?.detail || apiError.message || "An error occurred while creating the region",
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
          <DialogTitle>Create Region</DialogTitle>
          <DialogDescription>
            Create a new region by entering the details below.
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
          </div>
        <DialogFooter>
          <Button onClick={handleDialogSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Region"}
          </Button>
        </DialogFooter>
    </Form>
      </DialogContent>
    </Dialog>
  )
}
