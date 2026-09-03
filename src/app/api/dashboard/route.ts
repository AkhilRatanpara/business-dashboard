import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { calculateProfit, calculateMarkupPercent } from '@/lib/utils';

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run query stats in parallel
    const [
      totalItems,
      totalCategories,
      updatedTodayCount,
      priceChanges7DaysCount,
      recentItemsRaw,
      recentPriceChangesRaw,
      categoriesWithCount,
    ] = await Promise.all([
      prisma.item.count({ where: { isActive: true } }),
      prisma.category.count(),
      prisma.item.count({
        where: {
          isActive: true,
          updatedAt: { gte: todayStart },
        },
      }),
      prisma.priceHistory.count({
        where: {
          changedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.item.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { category: true },
      }),
      prisma.priceHistory.findMany({
        orderBy: { changedAt: 'desc' },
        take: 6,
        include: { item: true },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const recentItems = recentItemsRaw.map((item) => {
      const cost = Number(item.costPrice);
      const retailer = Number(item.retailerPrice);
      const customer = Number(item.customerPrice);
      return {
        ...item,
        costPrice: cost,
        retailerPrice: retailer,
        customerPrice: customer,
        retailerProfit: calculateProfit(retailer, cost),
        customerProfit: calculateProfit(customer, cost),
        retailerMarkup: calculateMarkupPercent(retailer, cost),
        customerMarkup: calculateMarkupPercent(customer, cost),
      };
    });

    const recentPriceChanges = recentPriceChangesRaw.map((h) => ({
      ...h,
      oldCostPrice: Number(h.oldCostPrice),
      newCostPrice: Number(h.newCostPrice),
      oldRetailerPrice: Number(h.oldRetailerPrice),
      newRetailerPrice: Number(h.newRetailerPrice),
      oldCustomerPrice: Number(h.oldCustomerPrice),
      newCustomerPrice: Number(h.newCustomerPrice),
      costDiff: Number(h.newCostPrice) - Number(h.oldCostPrice),
    }));

    const categoryStats = categoriesWithCount.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      count: c._count.items,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalItems,
        totalCategories,
        updatedTodayCount,
        priceChanges7DaysCount,
      },
      recentItems,
      recentPriceChanges,
      categoryStats,
    });
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return NextResponse.json({ success: false, message: 'Failed to load dashboard data' }, { status: 500 });
  }
}
