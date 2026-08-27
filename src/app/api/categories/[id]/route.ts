import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name } = await req.json();
    const cleanName = name?.trim();

    if (!cleanName) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { name: cleanName },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if category has items
    const itemCount = await prisma.item.count({
      where: { categoryId: params.id },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete category containing ${itemCount} items.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete category' }, { status: 500 });
  }
}
