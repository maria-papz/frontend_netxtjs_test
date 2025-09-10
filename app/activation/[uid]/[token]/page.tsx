'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActivationMutation } from '@/redux/features/authApiSlice';
import { useToast } from '@/hooks/use-toast';

interface Props {
	params: {
		uid: string;
		token: string;
	};
}

export default function Page({ params }: Props) {
	const router = useRouter();
  const {toast} = useToast();
	const [activation] = useActivationMutation();

	useEffect(() => {
		const { uid, token } = params;

		activation({ uid, token })
			.unwrap()
			.then(() => {
				toast({
      title: `Account activated successfully!`,
      description: `You can now login to your account`,
      });
			})
			.catch((error) => {
				toast({title:'Failed to activate account',
            description: `An error occurred while activating your account. Please try again: ${error.data}`,
        });
			})
			.finally(() => {
				router.push('/auth/login');
			});
	}, []);

	return (
<div className="relative w-full h-screen">
	  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-secondary to-tertiary bg-[length:200%_200%] animate-gradient"></div>
	  <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-white text-opacity-55 text-4xl font-bold">Activating Your Account...</h1>
      </div>
    </div>
	);
}
