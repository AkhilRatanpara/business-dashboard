import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: true,
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { items: true },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, parentId } = await req.json();
    const cleanName = name?.trim();
    const cleanParentId = parentId?.trim() || null;

    if (!cleanName) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: cleanName, mode: 'insensitive' },
        parentId: cleanParentId,
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Category/Subcategory with this name already exists here' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: cleanName,
        parentId: cleanParentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
