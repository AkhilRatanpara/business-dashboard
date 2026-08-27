import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No item IDs provided for batch deletion' },
        { status: 400 }
      );
    }

    // Delete related price history records first to maintain referential integrity
    await prisma.priceHistory.deleteMany({
      where: { itemId: { in: ids } },
    });

    // Delete items
    const result = await prisma.item.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} items from database`,
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete selected items' },
      { status: 500 }
    );
  }
}
