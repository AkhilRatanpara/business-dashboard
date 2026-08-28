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

    // Fetch items with category details for logging BEFORE deletion
    const itemsToDelete = await prisma.item.findMany({
      where: { id: { in: ids } },
      include: { category: true },
    });

    if (itemsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No matching items found to delete' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Log the batch delete action in AuditLog
      await tx.auditLog.create({
        data: {
          actionType: 'DELETE',
          entityType: 'BATCH_ITEMS',
          entityId: 'batch_' + Date.now(),
          entityName: `${itemsToDelete.length} items (Batch Delete)`,
          oldData: {
            items: itemsToDelete.map((item) => ({
              id: item.id,
              name: item.name,
              itemCode: item.itemCode,
              brand: item.brand,
              modelNumber: item.modelNumber,
              costPrice: Number(item.costPrice),
              retailerPrice: Number(item.retailerPrice),
              customerPrice: Number(item.customerPrice),
              unit: item.unit,
              notes: item.notes,
              isActive: item.isActive,
              createdAt: item.createdAt,
              categoryId: item.categoryId,
              categoryName: item.category.name,
              categoryParentId: item.category.parentId,
            })),
          } as any,
        },
      });

      // 2. Delete related price histories
      await tx.priceHistory.deleteMany({
        where: { itemId: { in: ids } },
      });

      // 3. Delete items
      await tx.item.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return NextResponse.json({
      success: true,
      count: itemsToDelete.length,
      message: `Successfully deleted ${itemsToDelete.length} items from database`,
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete selected items' },
      { status: 500 }
    );
  }
}
