import { NextRequest } from 'next/server';
import { db, nodeUser } from '@/lib/db';
import { eq, and, ne } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/users/:id
export const GET = withAuth(async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const userId = parseInt(id);
  const user = await db.select().from(nodeUser)
    .where(eq(nodeUser.id, userId))
    .get();

  if (!user) {
    return errorResponse('User not found', 404);
  }

  return successResponse(user);
});

// PUT /api/users/:id
export const PUT = withAuth(async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const userId = parseInt(id);
  const body = await request.json();
  const { username, password, traffic_limit, expire_at, enabled, allowed_inbounds } = body;

  const existing = await db.select({ id: nodeUser.id })
    .from(nodeUser)
    .where(eq(nodeUser.id, userId))
    .get();

  if (!existing) {
    return errorResponse('User not found', 404);
  }

  // Check username conflict
  if (username) {
    const conflict = await db.select({ id: nodeUser.id })
      .from(nodeUser)
      .where(and(eq(nodeUser.username, username), ne(nodeUser.id, userId)))
      .get();

    if (conflict) {
      return errorResponse('Username already exists', 400);
    }
  }

  const updates: Partial<typeof nodeUser.$inferInsert> = {};
  if (username !== undefined) updates.username = username;
  if (password !== undefined) updates.password = password;
  if (traffic_limit !== undefined) updates.traffic_limit = traffic_limit;
  if (expire_at !== undefined) updates.expire_at = expire_at;
  if (enabled !== undefined) updates.enabled = !!enabled;
  if (allowed_inbounds !== undefined) updates.allowed_inbounds = allowed_inbounds ? JSON.stringify(allowed_inbounds) : null;

  if (Object.keys(updates).length > 0) {
    await db.update(nodeUser).set(updates).where(eq(nodeUser.id, userId)).run();
  }

  return successResponse(null);
});

// DELETE /api/users/:id
export const DELETE = withAuth(async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const userId = parseInt(id);
  await db.delete(nodeUser).where(eq(nodeUser.id, userId)).run();

  return successResponse(null);
});
