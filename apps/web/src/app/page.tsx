'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingState } from '../components/states';
import { useSession } from '../lib/auth';
import { landingPath } from '../lib/landing';

export default function HomePage() {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session.isSuccess) router.replace(landingPath(session.data));
    if (session.isError && (session.error as { code?: string }).code === 'UNAUTHENTICATED') router.replace('/login');
  }, [router, session]);
  return <LoadingState />;
}
