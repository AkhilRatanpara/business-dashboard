import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });

    // Also find any distinct brand names in items that might not be in Brand table
    const itemBrands = await prisma.item.findMany({
      where: { brand: { not: null } },
      distinct: ['brand'],
      select: { brand: true },
    });

    const brandNamesSet = new Set<string>();
    brands.forEach((b) => brandNamesSet.add(b.name.trim()));
    itemBrands.forEach((ib) => {
      if (ib.brand && ib.brand.trim()) {
        brandNamesSet.add(ib.brand.trim());
      }
    });

    const allBrands = Array.from(brandNamesSet).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      brands: allBrands,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ success: false, message: 'Brand name is required' }, { status: 400 });
    }

    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ success: false, message: 'Failed to create brand' }, { status: 500 });
  }
}
