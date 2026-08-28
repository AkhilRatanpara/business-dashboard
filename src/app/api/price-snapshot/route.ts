import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date || Number.isNaN(Date.parse(date))) {
    return NextResponse.json({ success: false, message: 'A valid snapshot date is required.' }, { status: 400 });
  }
  const until = new Date(`${date}T23:59:59.999`);
  const items = await prisma.item.findMany({
    where: { isActive: true, createdAt: { lte: until } },
    include: { category: { include: { parent: true } }, priceHistories: { where: { changedAt: { lte: until } }, orderBy: { changedAt: 'desc' }, take: 1 } },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ success: true, items: items.map(({ priceHistories, ...item }) => {
    const price = priceHistories[0];
    return { ...item, costPrice: Number(price?.newCostPrice ?? item.costPrice), retailerPrice: Number(price?.newRetailerPrice ?? item.retailerPrice), customerPrice: Number(price?.newCustomerPrice ?? item.customerPrice) };
  }) });
}
