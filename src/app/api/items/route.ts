import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { calculateProfit, calculateMarkupPercent } from '@/lib/utils';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sort = searchParams.get('sort') || 'name_asc';

    const where: Prisma.ItemWhereInput = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { itemCode: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { modelNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ItemOrderByWithRelationInput = { name: 'asc' };

    switch (sort) {
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'updated_desc':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'created_desc':
        orderBy = { createdAt: 'desc' };
        break;
      case 'cost_asc':
        orderBy = { costPrice: 'asc' };
        break;
      case 'cost_desc':
        orderBy = { costPrice: 'desc' };
        break;
      case 'retailer_asc':
        orderBy = { retailerPrice: 'asc' };
        break;
      case 'customer_asc':
        orderBy = { customerPrice: 'asc' };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    const rawItems = await prisma.item.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
    });

    const items = rawItems.map((item) => {
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

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, itemCode, categoryId, brand, modelNumber, costPrice, retailerPrice, customerPrice, unit, notes } = body;

    if (!name?.trim() || !categoryId) {
      return NextResponse.json({ success: false, message: 'Item name and category are required.' }, { status: 400 });
    }

    const costNum = Number(costPrice);
    const retailerNum = Number(retailerPrice);
    const customerNum = Number(customerPrice);

    if (isNaN(costNum) || isNaN(retailerNum) || isNaN(customerNum) || costNum < 0 || retailerNum < 0 || customerNum < 0) {
      return NextResponse.json({ success: false, message: 'Prices must be non-negative valid numbers.' }, { status: 400 });
    }

    // Atomic creation of Item + initial PriceHistory log in Neon PostgreSQL
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: name.trim(),
          itemCode: itemCode?.trim() || null,
          categoryId,
          brand: brand?.trim() || null,
          modelNumber: modelNumber?.trim() || null,
          costPrice: costNum,
          retailerPrice: retailerNum,
          customerPrice: customerNum,
          unit: unit?.trim() || 'pcs',
          notes: notes?.trim() || null,
        },
        include: {
          category: true,
        },
      });

      await tx.priceHistory.create({
        data: {
          itemId: item.id,
          oldCostPrice: costNum,
          newCostPrice: costNum,
          oldRetailerPrice: retailerNum,
          newRetailerPrice: retailerNum,
          oldCustomerPrice: customerNum,
          newCustomerPrice: customerNum,
          changeNote: 'Initial price creation',
        },
      });

      return item;
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ success: false, message: 'Failed to create item' }, { status: 500 });
  }
}
