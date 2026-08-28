import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Auto purge older logs first to keep DB size small
    try {
      await prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: sevenDaysAgo },
        },
      });
    } catch (purgeError) {
      console.error('Error purging old audit logs:', purgeError);
    }

    // Fetch logs from the last 7 days
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
