import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { categoryId } = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Find all items belonging to this category
    const itemsToDelete = await prisma.item.findMany({
      where: { categoryId },
      select: { id: true },
    });

    const itemIds = itemsToDelete.map((i) => i.id);

    if (itemIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No items found in this category',
      });
    }

    // Delete price histories for these items
    await prisma.priceHistory.deleteMany({
      where: { itemId: { in: itemIds } },
    });

    // Delete the items
    const result = await prisma.item.deleteMany({
      where: { categoryId },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully deleted all ${result.count} items in category`,
    });
  } catch (error: any) {
    console.error('Delete by category error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete items by category' },
      { status: 500 }
    );
  }
}
