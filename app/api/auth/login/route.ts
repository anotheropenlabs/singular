import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { isIPBlocked, getClientIP } from '@/lib/security';
import { logAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const ip = await getClientIP();

    if (await isIPBlocked(ip)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    const result = await login(username, password, ip);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    await logAction('LOGIN', username, { success: true }, ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
