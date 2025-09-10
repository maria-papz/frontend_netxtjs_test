'use client';

import { redirect } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

interface Props {
	children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  const {toast} = useToast();
	const { isLoading, isAuthenticated } = useAppSelector(state => state.auth);

	if (isLoading) {
		return (
			<div className='flex justify-center my-8'>
				<Spinner size="md" className="bg-black dark:bg-white" />
			</div>
		);
	}

	if (!isAuthenticated) {
    toast({
      title: 'Unauthorized',
      description: 'You need to login to access this page',
      variant: 'destructive',
    });
		redirect('/auth/login');
	}

	return <>{children}</>;
}
