import { redirect } from 'next/navigation';
import { db, admin } from '@/lib/db';
import LoginForm from '@/components/auth/LoginForm';

// Server Component
export default async function LoginPage() {
  // Check if system is initialized (admin exists)
  const existingAdmin = await db.select({ id: admin.id }).from(admin).limit(1).get();

  if (!existingAdmin) {
    redirect('/setup');
  }

  return <LoginForm />;
}
