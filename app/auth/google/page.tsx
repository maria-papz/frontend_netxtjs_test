'use client';

import { Suspense } from 'react';
import { useSocialAuthenticateMutation } from '@/redux/features/authApiSlice';
import useSocialAuth from '@/hooks/use-social-auth';
import { Spinner } from '@/components/ui/spinner';

function GoogleAuthContent() {
  const [googleAuthenticate] = useSocialAuthenticateMutation();
  useSocialAuth(googleAuthenticate, 'google-oauth2');

  return (
    <div className='my-8'>
      <Spinner size="md" className="bg-black dark:bg-white" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className='my-8'>
        <Spinner size="md" className="bg-black dark:bg-white" />
      </div>
    }>
      <GoogleAuthContent />
    </Suspense>
  );
}
