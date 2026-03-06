import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    count?: number; // Optional for list responses
}

// Reusable standard success format
export function successResponse<T>(data: T, extra?: Partial<ApiResponse<T>>) {
    return NextResponse.json({ success: true, data, ...extra }, { status: 200 });
}

// Reusable standard error format
export function errorResponse(error: string | Error | any, status: number = 500) {
    const errorMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error) || 'Unknown error occurred';
    return NextResponse.json({ success: false, error: errorMsg }, { status });
}

// High Order Function Wrapper to eliminate repetitive Try-Catch and Auth checks
type ApiHandler = (req: NextRequest, session?: any, context?: any) => Promise<NextResponse<any>>;

export function withAuth(handler: ApiHandler): (req: NextRequest, context: any) => Promise<NextResponse<any>> {
    return async (req: NextRequest, context: any) => {
        try {
            const session = await getSession();
            if (!session) {
                return errorResponse('Unauthorized', 401);
            }
            return await handler(req, session, context);
        } catch (error) {
            console.error('[API Route Handler Error]:', error);
            return errorResponse(error);
        }
    };
}

// Optional Wrapper for public routes that only intercepts Try-Catch without blocking on Auth
export function withCatchBlock(handler: ApiHandler): (req: NextRequest, context: any) => Promise<NextResponse<any>> {
    return async (req: NextRequest, context: any) => {
        try {
            return await handler(req, undefined, context);
        } catch (error) {
            console.error('[API Route Handler Error]:', error);
            return errorResponse(error);
        }
    };
}
