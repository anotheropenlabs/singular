import { NextRequest } from 'next/server';
import { restartService } from '@/lib/daemon/process-manager';
import { withAuth, successResponse } from '@/lib/api-response';

export const POST = withAuth(async () => {
    await restartService();
    return successResponse({ message: 'Service restarted' });
});
