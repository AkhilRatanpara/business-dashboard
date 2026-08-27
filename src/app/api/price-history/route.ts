import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const categoryId = searchParams.get('categoryId');
    const filter = searchParams.get('filter'); // 'today', '7days', '30days'
    const search = searchParams.get('search')?.trim() || '';

    const where: Prisma.PriceHistoryWhereInput = {};

    if (itemId) {
      where.itemId = itemId;
    }

    const itemWhere: Prisma.ItemWhereInput = {};

    if (categoryId) {
      itemWhere.categoryId = categoryId;
    }

    if (search) {
      itemWhere.name = { contains: search, mode: 'insensitive' };
    }

    if (Object.keys(itemWhere).length > 0) {
      where.item = itemWhere;
    }

    if (filter) {
      const now = new Date();
      let startDate = new Date();

      if (filter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (filter === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (filter === '30days') {
        startDate.setDate(now.getDate() - 30);
      }

      where.changedAt = {
        gte: startDate,
      };
    }

    const rawHistories = await prisma.priceHistory.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    const histories = rawHistories.map((h) => ({
      ...h,
      oldCostPrice: Number(h.oldCostPrice),
      newCostPrice: Number(h.newCostPrice),
      oldRetailerPrice: Number(h.oldRetailerPrice),
      newRetailerPrice: Number(h.newRetailerPrice),
      oldCustomerPrice: Number(h.oldCustomerPrice),
      newCustomerPrice: Number(h.newCustomerPrice),
      costDiff: Number(h.newCostPrice) - Number(h.oldCostPrice),
      retailerDiff: Number(h.newRetailerPrice) - Number(h.oldRetailerPrice),
      customerDiff: Number(h.newCustomerPrice) - Number(h.oldCustomerPrice),
    }));

    return NextResponse.json({ success: true, histories });
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch price history' }, { status: 500 });
  }
}
