'use client';

import AppSidebarShell from '../components/AppSidebarShell';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

// Auth check moved to server/middleware - client useEffect removed to prevent re-renders
// useEffect(() => {
//     // Auth check - redirect if not logged in
//     fetch('/api/users/me')
//       .then(res => {
//         if (!res.ok) {
//           router.push('/login');
//           router.refresh();
//         }
//       })
//       .catch(() => {
//         router.push('/login');
//         router.refresh();
//       });
//   }, [router]);

  return <AppSidebarShell>{children}</AppSidebarShell>;
}
