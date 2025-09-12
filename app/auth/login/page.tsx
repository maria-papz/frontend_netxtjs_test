// "use client";
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import LoginForm from "./login-form"
import RotatingTexts from "../rotating-text";

export const metadata: Metadata = {
  title: "KOE DB | Login",
  description: "Login to access the KOE DB",
}


export default function AuthenticationPage() {
  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/images/KOE-dark.jpeg"
            fill
            style={{ objectFit: "cover", clipPath: "inset(0 50% 0 0)", filter: "grayscale(100%)  contrast(140%)" }}
            alt="Authentication"
            className="block halfLaptop:hidden"
          />
        </div>
      </div>
      <div className="container h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Mobile home link */}
        <Link
          className="absolute left-4 top-4 md:left-8 md:top-8 text-xs sm:text-sm underline underline-offset-4 hover:text-secondary z-50 lg:hidden pointer-events-auto"
          href="/"
        >
          ← Home
        </Link>
        <Link
          className="absolute right-4 top-4 md:right-8 md:top-8 text-xs sm:text-sm underline underline-offset-4 hover:text-secondary z-50 pointer-events-auto"
          href="/auth/register"
        >
          Create an account
        </Link>
        <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex h-full">
          <div className="absolute inset-0  bg-gradient-to-r from-secondary via-tertiary to-secondary bg-[length:200%_200%] animate-gradient opacity-90 h-full" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/images/University_of_Cyprus-white.svg"
                width={50}
                height={50}
                alt="University of Cyprus Logo"
                className="h-6 w-6 flex-shrink-0"
              />
              <span className="m-2 font-medium">CypERC DB</span>
            </Link>
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
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 px-4 sm:px-0 sm:w-[350px] pt-16 lg:pt-0">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-xl sm:text-2xl font-semibold">
                Login to KOE DB
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Welcome to the KOE DB. Please login to access the database.
              </p>
            </div>
            {/* <UserAuthForm /> */}
            <LoginForm />
            <p className="px-4 sm:px-8 text-center text-xs sm:text-sm text-muted-foreground">
              By clicking create, you agree to our{" "}

                <Link href="/privacy" className="underline underline-offset-4 hover:text-secondary">Privacy Policy</Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
