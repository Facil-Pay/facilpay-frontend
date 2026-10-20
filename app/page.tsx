'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMerchantUser } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getMerchantUser();
    if (user && user.isLoggedIn) {
      router.replace('/overview');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
