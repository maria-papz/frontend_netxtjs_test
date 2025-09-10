'use client';

import { Toaster } from "@/components/ui/toaster";
import useVerify from "@/hooks/use-verify";

export default function Setup() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
	const verify = useVerify();

	return <Toaster />;
}
