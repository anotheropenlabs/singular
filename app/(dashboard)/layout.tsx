import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Shell from '@/components/layout/Shell';

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
    <Shell username={admin.username}>
      {children}
    </Shell>
  );
}
