"use client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRegisterMutation } from "@/redux/features/authApiSlice"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SocialButtons } from "@/components/social-buttons/social-buttons";

export default function RegisterForm() {
  const [register, {isLoading }] = useRegisterMutation();
  const router = useRouter();

  const { toast } = useToast();
  const registerSchema = z.object({
      first_name: z.string().min(1, "Name is required"),
      last_name: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
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
    const first_name = data.first_name;
    const last_name = data.last_name;
    const email = data.email;
    const password = data.password;
    const re_password = data.re_password;
    // console.log(data.first_name,data.last_name,data.email,data.password,data.re_password);
    register({first_name,last_name,email,password,re_password})
    .unwrap()
    .then(() => {
      toast({
      title: `Please check your email to verify the account`,
      description: `${data.first_name} ${data.last_name}`,
      });
      router.push("/auth/login");
    })
    .catch((error) => {
      console.error("An error occurred while creating the user", error);
      toast({
      variant: "destructive",
      title: "Registration failed",
      description: `An error occurred while creating your account. Please try again: ${typeof error.data === 'object' ? JSON.stringify(error.data) : ''}`,
      });
    });
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit) } >
    <div className="space-y-2">
      <FormField control={form.control} name="first_name" render={({ field }) => (
      <FormItem>
        <FormLabel>First Name</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
      )}
    />
    <FormField control={form.control} name="last_name" render={({ field }) => (
      <FormItem>
        <FormLabel>Last Name</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>

    )}
    />
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
        <SocialButtons/>
    </div>

    </form>
</Form>

   );


}
