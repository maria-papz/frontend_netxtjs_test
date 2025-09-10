"use client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useResetPasswordMutation } from "@/redux/features/authApiSlice"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { setAuth } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";



export default function PaawordResetForm() {
  const [passwordreset, {isLoading }] = useResetPasswordMutation();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { toast } = useToast();
  const registerSchema = z.object({
      email: z.string().email("Invalid email address"),
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const handleSubmit = async (data: z.infer<typeof registerSchema>) => {
    const email = data.email;
    // console.log(data.first_name,data.last_name,data.email,data.password,data.re_password);
    passwordreset(email)
    .unwrap()
    .then(() => {
      dispatch(setAuth());
      toast({
      title: `Success!`,
      description: `Request sent, check your email for reset link`,
      });
      router.push("/auth/login");
    })
    .catch((error) => {
      console.error("An error occurred while creating the user", error);
      if (error.data && typeof error.data === 'object') {
        toast({
          variant: "destructive",
          title: "Reset attempt failed",
          description: `Failed to send request. Please try again: ${JSON.stringify(error.data)}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Failed to send request. Please try again.",
        });
      }
    });
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit) } >
    <div className="space-y-2">
    <FormField control={form.control} name="email" render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>

    )}
    />
        <div className="pt-4 w-full">
          <Button type="submit" disabled={isLoading} className="w-full hover:bg-secondary">
            {isLoading ? <Spinner size="sm" className="bg-black dark:bg-white" /> : "Request Reset"}
          </Button>
        </div>
    </div>

    </form>
</Form>

   );


}
