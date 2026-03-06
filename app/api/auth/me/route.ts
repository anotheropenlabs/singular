import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, admin } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '@/lib/password';
import { logAction } from '@/lib/audit';
import { getClientIP } from '@/lib/security';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: session.id,
      username: session.username,
    },
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { username, password, newPassword } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and current password are required' },
        { status: 400 }
      );
    }

    // Verify current password
    const currentAdmin = await db.select().from(admin).where(eq(admin.id, session.id)).get();

    if (!currentAdmin) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    const isValid = await verifyPassword(password, currentAdmin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid current password' },
        { status: 403 }
      );
    }

    // Prepare updates
    const updates: any = {};
    if (username !== currentAdmin.username) {
      // Check if username taken (if we support multiple admins in future, currently only 1 but good practice)
      // For now safe
      updates.username = username;
    }

    if (newPassword) {
      updates.password = await hashPassword(newPassword);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(admin).set(updates).where(eq(admin.id, session.id)).run();

      const clientIp = await getClientIP();
      await logAction('UPDATE_PROFILE', session.username, {
        changed_username: !!updates.username,
        changed_password: !!updates.password
      }, clientIp);
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
