import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { setAuth } from '@/redux/features/authSlice';
// import { useToast } from './use-toast';

interface AuthResponse {
	user?: {
		id: string;
		name?: string;
		email?: string;
	};
	token?: string;
}

interface AuthFunction {
	(params: { provider: string; state: string; code: string }): {
		unwrap: () => Promise<AuthResponse>;
	};
}

export default function useSocialAuth(authenticate: AuthFunction, provider: string) {
	const dispatch = useAppDispatch();
	const router = useRouter();
	const searchParams = useSearchParams();
  // const { toast } = useToast();

	const effectRan = useRef(false);

	useEffect(() => {
		const state = searchParams.get('state');
		const code = searchParams.get('code');

		if (state && code && !effectRan.current) {
			authenticate({ provider, state, code })
				.unwrap()
				.then(() => {
					dispatch(setAuth());
					// toast({title: 'Success', description: 'Logged in'});
					router.push('/dashboard');
				})
				.catch((error: { data?: string }) => {
					console.log(`An error occurred while logging in to your account. Please try again: ${error.data}`);
					router.push('/auth/login');
				});
		}

		return () => {
			effectRan.current = true;
		};
	}, [authenticate, provider, dispatch, router, searchParams]);
}
