import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db, admin, loginAttempts } from './db';
import { eq, and, gt, count } from 'drizzle-orm';
import { verifyPassword } from './password';

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

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const adminUser = await db.select().from(admin).where(eq(admin.id, payload.userId)).get();
  return adminUser || null;
}

export async function login(username: string, password: string, ip: string): Promise<{ success: boolean; error?: string }> {
  // Check login attempts (last 15 mins)
  const fifteenMinutesAgo = Math.floor(Date.now() / 1000) - 15 * 60;

  const recentAttempts = await db.select({ count: count() })
    .from(loginAttempts)
    .where(and(
      eq(loginAttempts.ip, ip),
      eq(loginAttempts.success, false),
      gt(loginAttempts.created_at, fifteenMinutesAgo)
    ))
    .get();

  if (recentAttempts && recentAttempts.count >= 5) {
    return { success: false, error: 'Too many failed attempts. Try again in 15 minutes.' };
  }

  const adminUser = await db.select().from(admin).where(eq(admin.username, username)).get();

  if (!adminUser) {
    await logLoginAttempt(ip, username, false);
    return { success: false, error: 'Invalid credentials' };
  }

  const valid = await verifyPassword(password, adminUser.password_hash);

  if (!valid) {
    await logLoginAttempt(ip, username, false);
    return { success: false, error: 'Invalid credentials' };
  }

  await logLoginAttempt(ip, username, true);

  const token = await createSession(adminUser.id);
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

async function logLoginAttempt(ip: string, username: string | null, success: boolean) {
  await db.insert(loginAttempts).values({
    ip,
    username: username || null,
    success: success,
    created_at: Math.floor(Date.now() / 1000)
  });
}

// Middleware helper
export async function withAuth(
  request: NextRequest,
  handler: (adminUser: typeof admin.$inferSelect) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  const adminUser = await db.select().from(admin).where(eq(admin.id, payload.userId)).get();
  if (!adminUser) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
  }

  return handler(adminUser);
}
