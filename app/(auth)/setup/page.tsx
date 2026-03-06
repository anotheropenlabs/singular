import { redirect } from 'next/navigation';
import { db, admin } from '@/lib/db';
import SetupForm from '@/components/auth/SetupForm';

// Server Component
export default async function SetupPage() {
  // Check if system is already initialized
  const existingAdmin = await db.select({ id: admin.id }).from(admin).limit(1).get();

  if (existingAdmin) {
    redirect('/login');
  }

  return <SetupForm />;
}
