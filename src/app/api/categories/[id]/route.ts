import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, parentId } = await req.json();
    const cleanName = name?.trim();
    const cleanParentId = parentId === undefined ? undefined : (parentId?.trim() || null);

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const data: any = {};
    if (cleanName) data.name = cleanName;
    if (cleanParentId !== undefined) data.parentId = cleanParentId;

    // Check if new name conflicts under the target parent
    if (cleanName) {
      const targetParentId = cleanParentId !== undefined ? cleanParentId : category.parentId;
      const existing = await prisma.category.findFirst({
        where: {
          id: { not: params.id },
          name: { equals: cleanName, mode: 'insensitive' },
          parentId: targetParentId,
        },
      });
      if (existing) {
        return NextResponse.json({ success: false, message: 'A category/subcategory with this name already exists there' }, { status: 400 });
      }
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data,
      include: {
        parent: true,
      },
    });

    // Log update
    await prisma.auditLog.create({
      data: {
        actionType: 'UPDATE',
        entityType: 'CATEGORY',
        entityId: category.id,
        entityName: category.name,
        oldData: category as any,
        newData: updated as any,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // Find child categories
    const childCategories = await prisma.category.findMany({
      where: { parentId: params.id },
    });
    const childCategoryIds = childCategories.map((c) => c.id);

    // Get items directly under this category
    const directItems = await prisma.item.findMany({
      where: { categoryId: params.id },
      include: { category: true },
    });

    // Get items under subcategories
    const subItems = childCategoryIds.length > 0 ? await prisma.item.findMany({
      where: { categoryId: { in: childCategoryIds } },
      include: { category: true },
    }) : [];

    const allItems = [...directItems, ...subItems];

    if (allItems.length > 0 && !force) {
      return NextResponse.json(
        { success: false, message: `Contains ${allItems.length} items. Use force delete to remove them too.` },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Log deleted items to AuditLog
      for (const item of allItems) {
        await tx.auditLog.create({
          data: {
            actionType: 'DELETE',
            entityType: 'ITEM',
            entityId: item.id,
            entityName: item.name,
            oldData: {
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
            } as any,
          },
        });
      }

      // Log deleted category
      await tx.auditLog.create({
        data: {
          actionType: 'DELETE',
          entityType: 'CATEGORY',
          entityId: category.id,
          entityName: category.name,
          oldData: {
            id: category.id,
            name: category.name,
            parentId: category.parentId,
            items: allItems.map((item) => ({
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
            })),
          } as any,
        },
      });

      // Delete items
      if (directItems.length > 0) {
        await tx.item.deleteMany({ where: { categoryId: params.id } });
      }
      if (childCategoryIds.length > 0) {
        await tx.item.deleteMany({ where: { categoryId: { in: childCategoryIds } } });
        await tx.category.deleteMany({ where: { parentId: params.id } });
      }

      // Delete category itself
      await tx.category.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete category' }, { status: 500 });
  }
}
