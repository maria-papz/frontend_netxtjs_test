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
import { useCreateCategoryMutation, useGetCategoriesQuery } from "@/redux/services/indicatorsApiSlice";
import { Category } from "@/types/dashboard";

interface DialogCategoriesProps {
  onCategoryAdded: (newCategory: { id: number; name: string; description?: string; }) => void;
}

export function DialogCategories({ onCategoryAdded }: DialogCategoriesProps) {
    const { toast } = useToast();
    // Use the API slice mutation hook instead of axios
    const [createCategory, { isLoading }] = useCreateCategoryMutation();
    // Get existing categories for validation
    const { data: categoriesData = [] } = useGetCategoriesQuery({});
    // Cast the categories data to the correct type
    const categories = categoriesData as Category[];

    const categorySchema = z.object({
        name: z.string()
          .min(1, "Name is required")
          .refine(
            (val) => !categories.some((category) =>
              category.name.toLowerCase() === val.toLowerCase()
            ),
            { message: "Category with this name already exists" }
          ),
        description: z.string().optional(),
    });

    const form = useForm<z.infer<typeof categorySchema>>({
      resolver: zodResolver(categorySchema),
    });

    const handleSubmit = async (data: z.infer<typeof categorySchema>) => {
      try {
        const response = await createCategory(data).unwrap();
        onCategoryAdded({ id: response.id, name: data.name, description: data.description });
        toast({
          title: `Category Created Successfully!`,
          description: `${data.name}`,
        });
      } catch (error) {
        console.error("An error occurred while creating the category", error);
        toast({
          variant: "destructive",
          title: "Error creating category",
          description: "An error occurred while creating the category",
        });
      }
    }

    const handleDialogSubmit = () => {
      form.handleSubmit(handleSubmit)();
    }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus/></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Create a new category by entering the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
            )}
          />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
          />
          </div>
        <DialogFooter>
          <Button onClick={handleDialogSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Category"}
          </Button>
        </DialogFooter>
    </Form>
      </DialogContent>
    </Dialog>
  )
}
