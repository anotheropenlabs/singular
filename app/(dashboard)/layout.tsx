import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSession();

  if (!admin) {
    redirect('/login');
  }

  return (
    <DashboardLayout username={admin.username}>
      {children}
    </DashboardLayout>
  );
}
