import { NextRequest } from 'next/server';
import { regenerateConfigAndReload } from '@/lib/config/config-hotreload';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// POST /api/system/reload — Regenerate config and reload sing-box service
export const POST = withAuth(async () => {
    const result = await regenerateConfigAndReload();

    if (result.success) {
        return successResponse({ message: result.message || 'Configuration regenerated and service reloaded' });
    }

    return errorResponse(result.error || 'Reload failed', 500);
});
