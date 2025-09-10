"use client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useResetPasswordConfirmMutation } from "@/redux/features/authApiSlice"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface PasswordResetConfirmFormProps {
  uid : string;
  token : string;
}

export default function PasswordResetConfirmForm({uid,token}: PasswordResetConfirmFormProps) {
  const [resetPasswordConfirm, {isLoading }] = useResetPasswordConfirmMutation();
  const router = useRouter();

  const { toast } = useToast();
  const registerSchema = z.object({
      password: z.string().min(8, "Password must be at least 8 characters"),
      re_password: z.string().min(8, "Password must be at least 8 characters"),
  }).refine((data) => data.password === data.re_password, {
    message: "Passwords do not match",
    path: ["re_password"],
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const handleSubmit = async (data: z.infer<typeof registerSchema>) => {
    const new_password = data.password;
    const re_new_password = data.re_password;
    console.log("uid",uid);
    console.log("token",token);

    // console.log(data.first_name,data.last_name,data.email,data.password,data.re_password);
    resetPasswordConfirm({uid,token,new_password,re_new_password})
    .unwrap()
    .then(() => {
      toast({
      title: `Password updated successfully!`,
      description: `You can now login to your account`,
      });
      router.push("/auth/login");
    })
    .catch((error) => {
      console.error("An error occurred while creating the user", error);
      toast({
      variant: "destructive",
      title: "Password reset failed",
      description: `An error occurred while creating your account. Please try again: ${typeof error.data === 'object' ? JSON.stringify(error.data) : ''}`,
      });
    });
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit) } >
    <div className="space-y-2">
      <FormField control={form.control} name="password" render={({ field }) => (
      <FormItem>
        <FormLabel>Password</FormLabel>
        <FormControl>
          <Input {...field} type="password" />
        </FormControl>
        <FormMessage />
      </FormItem>

    )}
    />
    <FormField control={form.control} name="re_password" render={({ field }) => (
      <FormItem>
        <FormLabel>Confirm Password</FormLabel>
        <FormControl>
          <Input {...field} type="password" />
        </FormControl>
        <FormMessage />
      </FormItem>

    )}
    />
        <div className="pt-4 w-full">
          <Button type="submit" disabled={isLoading} className="w-full hover:bg-secondary">
            {isLoading ? <Spinner size="sm" className="bg-black dark:bg-white" /> : "Create Account"}
          </Button>
        </div>
    </div>

    </form>
</Form>

   );


}
