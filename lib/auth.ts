import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { get, run } from './db';
import { verifyPassword } from './password';
import type { Admin } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

const TOKEN_NAME = 'auth_token';
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function createSession(userId: number): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  return token;
}

export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { userId: number };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Admin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const admin = get<Admin>('SELECT * FROM admin WHERE id = ?', [payload.userId]);
  return admin || null;
}

export async function login(username: string, password: string, ip: string): Promise<{ success: boolean; error?: string }> {
  // Check login attempts
  const recentAttempts = get<{ count: number }>(
    `SELECT COUNT(*) as count FROM login_attempts
     WHERE ip = ? AND success = 0 AND created_at > datetime('now', '-15 minutes')`,
    [ip]
  );

  if (recentAttempts && recentAttempts.count >= 5) {
    return { success: false, error: 'Too many failed attempts. Try again in 15 minutes.' };
  }

  const admin = get<Admin>('SELECT * FROM admin WHERE username = ?', [username]);

  if (!admin) {
    logLoginAttempt(ip, username, false);
    return { success: false, error: 'Invalid credentials' };
  }

  const valid = await verifyPassword(password, admin.password_hash);

  if (!valid) {
    logLoginAttempt(ip, username, false);
    return { success: false, error: 'Invalid credentials' };
  }

  logLoginAttempt(ip, username, true);

  const token = await createSession(admin.id);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });

  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

function logLoginAttempt(ip: string, username: string | null, success: boolean) {
  run(
    'INSERT INTO login_attempts (ip, username, success) VALUES (?, ?, ?)',
    [ip, username || null, success ? 1 : 0]
  );
}

// Middleware helper
export async function withAuth(
  request: NextRequest,
  handler: (admin: Admin) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  const admin = get<Admin>('SELECT * FROM admin WHERE id = ?', [payload.userId]);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
  }

  return handler(admin);
}
