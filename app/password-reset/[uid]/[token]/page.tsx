import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RotatingTexts from "../../../auth/rotating-text";
import PasswordResetConfirmForm from "./password-reset-confirm-form";


export const metadata: Metadata = {
  title: "KOE DB | Password Reset",
  description: "Request Password Reset",
};

interface Props {
  params: {
    uid: string;
    token: string;
  }
}

export default function Page(params: Props) {
  const { uid, token } = params.params;
  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/images/KOE-dark.jpeg"
            fill
            style={{ objectFit: "cover", clipPath: "inset(0 50% 0 0)", filter: "grayscale(100%)  contrast(140%)" }}
            alt="Authentication"
            className="block dark:hidden halfLaptop:hidden"
          />
        </div>
      </div>
      <div className="container h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          className="absolute right-4 top-4 md:right-8 md:top-8 underline underline-offset-4 hover:text-secondary z-10"
          href="/auth/register"
        >
          Create an account
        </Link>
        <div className="relative hidden flex-col bg-muted p-10 text-white dark:border-r lg:flex h-full">
          <div className="absolute inset-0  bg-gradient-to-r from-secondary via-tertiary to-secondary bg-[length:200%_200%] animate-gradient opacity-90 h-full" />
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
                Password Reset
              </h1>
              <p className="text-sm text-muted-foreground">
                Type in your new password.
              </p>
            </div>
            {/* <UserAuthForm /> */}
            <PasswordResetConfirmForm uid={uid} token={token} />
          </div>
        </div>
      </div>
    </>
  )
}
