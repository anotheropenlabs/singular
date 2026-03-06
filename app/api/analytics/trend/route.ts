import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { trafficStats } from '@/lib/db/schema';
import { sql, gte, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const searchParams = req.nextUrl.searchParams;
        const minutesParam = searchParams.get('minutes');
        const minutes = minutesParam ? Math.max(1, Math.min(10080, parseInt(minutesParam, 10))) : 1440;

        const since = Math.floor(Date.now() / 1000) - minutes * 60;

        // Choose bucket size: ≤60m→1min, ≤6h→5min, ≤24h→15min, >24h→60min
        let bucketSeconds: number;
        if (minutes <= 60) {
            bucketSeconds = 60;
        } else if (minutes <= 360) {
            bucketSeconds = 300;
        } else if (minutes <= 1440) {
            bucketSeconds = 900;
        } else {
            bucketSeconds = 3600;
        }

        // Use sql.raw() to inline the integer – SQLite cannot bind parameters
        // inside arithmetic expressions in GROUP BY.
        const b = sql.raw(String(bucketSeconds));

        // strftime returns ISO 8601 so JS new Date() parses it correctly.
        const trend = await db.select({
            time: sql<string>`strftime('%Y-%m-%dT%H:%M:00Z', datetime(
                (${trafficStats.timestamp} / ${b}) * ${b},
                'unixepoch'
            ))`,
            upload: sql<number>`sum(${trafficStats.upload})`,
            download: sql<number>`sum(${trafficStats.download})`,
        })
            .from(trafficStats)
            .where(gte(trafficStats.timestamp, since))
            .groupBy(sql`(${trafficStats.timestamp} / ${b}) * ${b}`)
            .orderBy(asc(sql`min(${trafficStats.timestamp})`))
            .all();

        return NextResponse.json({ success: true, data: trend });
    } catch (error: any) {
        console.error('Analytics trend error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
