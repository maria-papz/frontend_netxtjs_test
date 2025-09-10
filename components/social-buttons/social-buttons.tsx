import { Button } from "../ui/button";
import Image from 'next/image';
import { continueWithGoogle } from "@/utils";

export  function SocialButtons() {
  return (
    <div className="flex flex-col space-y-2">
      <Button variant="outline" onClick={continueWithGoogle}>
      <Image src="/images/google.svg" alt="Google logo" width={30} height={25} className="animate-sparkle hover:scale-110"/>
      Continue with Google
      </Button>
    </div>
  );
};
