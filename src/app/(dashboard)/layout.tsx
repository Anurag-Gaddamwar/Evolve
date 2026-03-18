'use client';

import PersistentLayout from '../components/PersistentLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersistentLayout>
      {children}
    </PersistentLayout>
  );
}