// "use client";
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import RegisterForm from "./register-form"
import RotatingTexts from "../rotating-text";

export const metadata: Metadata = {
  title: "KOE DB | Register",
  description: "Create an account to access the KOE DB",
}


export default function AuthenticationPage() {
  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/images/ucy-library.jpg"
            fill
            style={{ objectFit: "cover", clipPath: "inset(0 50% 0 0)" }}
            alt="Authentication"
            className="block dark:hidden halfLaptop:hidden"
          />
          <Image
            src="/images/KOE.jpg"
            layout="fill"
            objectFit="cover"
            alt="Authentication"
            className="hidden dark:block halfLaptop:hidden"
            style={{ clipPath: "inset(0 0 50% 0)" }}
          />
        </div>
      </div>
      <div className="container h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          className="absolute right-4 top-4 md:right-8 md:top-8 underline underline-offset-4 hover:text-secondary z-50"
          href="/auth/login"
        >
          Login
        </Link>
        <div className="relative hidden flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900 opacity-70 h-60" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Image
              src="/images/University_of_Cyprus-white.svg"
              width={50}
              height={50}
              alt="University of Cyprus Logo"
              className="h-6 w-6 flex-shrink-0"
            />
            <span className="m-2 font-medium">CypERC DB</span>
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <div className="h-24 overflow-hidden">
          <RotatingTexts />
              </div>
              <footer className="text-sm">
          <a href="https://www.ucy.ac.cy/erc/?lang=en">Economics Research Centre webpage</a>
              </footer>
            </blockquote>
          </div>
        </div>
        <div className="relative z-10 lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your details below to create your account
              </p>
            </div>
            {/* <UserAuthForm /> */}
            <RegisterForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking create, you agree to our{" "}

                <Link href="/terms" className="underline underline-offset-4 hover:text-secondary">Terms of Service</Link>
              {" "}
              and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-secondary">Privacy Policy</Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
