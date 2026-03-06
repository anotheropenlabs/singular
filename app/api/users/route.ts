import { NextRequest } from 'next/server';
import { db, nodeUser } from '@/lib/db';
import { desc, eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/users
export const GET = withAuth(async () => {
  const users = await db.select().from(nodeUser)
    .orderBy(desc(nodeUser.created_at))
    .all();

  return successResponse(users);
});

// POST /api/users
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const { username, password, traffic_limit, expire_at, allowed_inbounds } = body;

  if (!username) {
    return errorResponse('Username is required', 400);
  }

  // Check if username exists
  const existing = await db.select({ id: nodeUser.id })
    .from(nodeUser)
    .where(eq(nodeUser.username, username))
    .get();

  if (existing) {
    return errorResponse('Username already exists', 400);
  }

  const uuid = uuidv4();
  const result = await db.insert(nodeUser).values({
    username,
    uuid,
    password: password || null,
    traffic_limit: traffic_limit || 0,
    expire_at: expire_at || null,
    allowed_inbounds: allowed_inbounds ? JSON.stringify(allowed_inbounds) : null,
  }).returning({ id: nodeUser.id }).get();

  return successResponse({ id: result.id, uuid });
});
