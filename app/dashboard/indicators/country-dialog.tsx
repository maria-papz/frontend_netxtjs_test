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
import { ChevronDown, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  useCreateCountryMutation,
  useGetRegionsQuery,
  useGetCountryCodesQuery
} from "@/redux/services/indicatorsApiSlice";
import { Region } from "@/types/dashboard";

interface DialogCountriesProps {
  onCountryAdded: (newCountry: { id: number; code: string; name: string; }) => void;
}

export function DialogCountries({ onCountryAdded }: DialogCountriesProps) {
    const { toast } = useToast();
    const [createCountry, { isLoading }] = useCreateCountryMutation();
    const { data: regionsData = [] } = useGetRegionsQuery({});
    const { data: codesData = [] } = useGetCountryCodesQuery({});
    const [regions, setRegions] = useState<Region[]>([]);
    const [codes, setCodes] = useState<string[]>([]);

    useEffect(() => {
      if (regionsData) setRegions(regionsData as Region[]);
      if (codesData) setCodes(codesData as string[]);
    }, [regionsData, codesData]);

    const countrySchema = z.object({
      name: z.string().min(1, "Name is required"),
      regions: z.array(z.number()).optional(),
      code: z.string().refine((val) => !codes.includes(val), {
        message: "Code must be unique",
      }),
    });

    const form = useForm<z.infer<typeof countrySchema>>({
      resolver: zodResolver(countrySchema),
    });

    const handleSubmit = async (data: z.infer<typeof countrySchema>) => {
      try {
        const response = await createCountry(data).unwrap();
        onCountryAdded({ id: response.id, name: data.name, code: data.code });
        toast({
          title: `Country Created Successfully!`,
          description: `${data.name}`,
        });
      } catch (error: unknown) {
        console.error("An error occurred while creating the country", error);
        const apiError = error as { data?: { error?: string } };
        toast({
          variant: "destructive",
          title: "Error creating country",
          description: apiError.data?.error || "An error occurred while creating the country",
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
          <DialogTitle>Add Country</DialogTitle>
          <DialogDescription>
            Add a country to the database.
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
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
          />
            <FormField control={form.control} name="regions" render={({ field }) => (
              <FormItem>
                <div className="flex flex-col space-y-2">
                <FormLabel>Regions</FormLabel>
                <FormControl>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline">Select Regions <ChevronDown/></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {regions.map((region) => (
                      <DropdownMenuCheckboxItem
                        key={region.id}
                        checked={field.value?.includes(region.id) ?? false}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value ?? []), region.id]
                            : (field.value ?? []).filter((id) => id !== region.id);
                          field.onChange(newValue);
                        } }
                      >
                        {region.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormControl></div></FormItem>
            )} />
          </div>
        <DialogFooter>
          <Button onClick={handleDialogSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Country"}
          </Button>
        </DialogFooter>
    </Form>
      </DialogContent>
    </Dialog>
  )
}
