"use client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLoginMutation } from "@/redux/features/authApiSlice"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link"
import { setAuth } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { SocialButtons } from "@/components/social-buttons/social-buttons";



export default function LoginForm() {
  const [login, {isLoading }] = useLoginMutation();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { toast } = useToast();
  const registerSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const handleSubmit = async (data: z.infer<typeof registerSchema>) => {
    const email = data.email;
    const password = data.password;
    // console.log(data.first_name,data.last_name,data.email,data.password,data.re_password);
    login({email,password})
    .unwrap()
    .then(() => {
      dispatch(setAuth());
      toast({
      title: `Success!`,
      description: `You have successfully logged in!`,
      });
      router.push("/dashboard");
    })
    .catch((error) => {
      console.error("An error occurred while creating the user", error);
      if (error.data && typeof error.data === 'object') {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: `An error occurred while logging in to your account. Please try again: ${JSON.stringify(error.data)}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "An error occurred while logging in to your account. Please try again.",
        });
      }
    });
  }
  return (
    <div className="space-y-2">

    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit) } className="space-y-2">
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
        <div className="flex justify-between items-center">
          <FormLabel>Password</FormLabel>
          <Link className="underline underline-offset-4 hover:text-secondary text-xs" href='/password-reset'>Forgot password?</Link>
        </div>
        <FormControl>
          <Input {...field} type="password" />
        </FormControl>
        <FormMessage />
      </FormItem>

    )}
    />
        <div className="pt-4 w-full">
          <Button type="submit" disabled={isLoading} className="w-full hover:bg-secondary">
            {isLoading ? <Spinner size="sm" className="bg-black dark:bg-white" /> : "Login"}
          </Button>

        </div>


    </form>
</Form>
<SocialButtons/>
</div>

   );


}
