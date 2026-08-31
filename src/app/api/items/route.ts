import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { calculateProfit, calculateMarkupPercent, matchSmartSearch } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function compareSrNo(a?: string | null, b?: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const brand = searchParams.get('brand') || '';
    const sort = searchParams.get('sort') || 'default';

    const where: Prisma.ItemWhereInput = {
      isActive: true,
    };

    if (categoryId) {
      const subCategories = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      const categoryIds = [categoryId, ...subCategories.map((s) => s.id)];
      where.categoryId = {
        in: categoryIds,
      };
    }

    if (brand) {
      where.brand = brand;
    }

    let orderBy: Prisma.ItemOrderByWithRelationInput | Prisma.ItemOrderByWithRelationInput[] = [
      { category: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ];

    switch (sort) {
      case 'name_desc':
        orderBy = [
          { name: 'desc' },
          { category: { sortOrder: 'asc' } },
        ];
        break;
      case 'name_asc':
        orderBy = [
          { name: 'asc' },
          { category: { sortOrder: 'asc' } },
        ];
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
      case 'default':
      case 'catalog':
      default:
        orderBy = [
          { category: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
        ];
        break;
    }

    const rawItems = await prisma.item.findMany({
      where,
      orderBy,
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    // Compute prices and margins
    let items = rawItems.map((item) => {
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

    // Apply smart fuzzy dimension & name matching if search query provided
    if (q) {
      items = items.filter((item) =>
        matchSmartSearch(item.name, q) ||
        matchSmartSearch(item.srNo, q) ||
        matchSmartSearch(item.itemCode, q) ||
        matchSmartSearch(item.brand, q) ||
        matchSmartSearch(item.modelNumber, q)
      );
    }

    // Natural sort by srNo within category if default/catalog sort
    if (sort === 'default' || sort === 'catalog') {
      items.sort((a, b) => {
        const catA = a.category?.sortOrder ?? 0;
        const catB = b.category?.sortOrder ?? 0;
        if (catA !== catB) return catA - catB;

        const subCatA = a.category?.name ?? '';
        const subCatB = b.category?.name ?? '';
        if (a.category?.parentId && b.category?.parentId && a.category.parentId !== b.category.parentId) {
          return subCatA.localeCompare(subCatB);
        }

        // Natural sort by Sr. No. (e.g. 1 < 1.1 < 1.2 < 2 < 10)
        const srComp = compareSrNo(a.srNo, b.srNo);
        if (srComp !== 0) return srComp;

        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      srNo,
      itemCode,
      categoryId,
      brand,
      modelNumber,
      costPrice,
      retailerPrice,
      customerPrice,
      unit,
      notes,
    } = body;

    if (!name?.trim() || !categoryId) {
      return NextResponse.json({ success: false, message: 'Item name and category are required.' }, { status: 400 });
    }

    const costNum = Number(costPrice);
    const retailerNum = Number(retailerPrice);
    const customerNum = Number(customerPrice);

    if (isNaN(costNum) || isNaN(retailerNum) || isNaN(customerNum) || costNum < 0 || retailerNum < 0 || customerNum < 0) {
      return NextResponse.json({ success: false, message: 'Prices must be non-negative valid numbers.' }, { status: 400 });
    }

    const brandVal = brand?.trim() ? brand.trim() : null;
    const srNoVal = srNo?.trim() ? srNo.trim() : null;

    // If brand is provided, ensure it exists in Brand entity table
    if (brandVal) {
      await prisma.brand.upsert({
        where: { name: brandVal },
        update: {},
        create: { name: brandVal },
      });
    }

    // Atomic creation of Item + initial PriceHistory log
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: name.trim(),
          srNo: srNoVal,
          itemCode: itemCode?.trim() || null,
          categoryId,
          brand: brandVal,
          modelNumber: modelNumber?.trim() || null,
          costPrice: costNum,
          retailerPrice: retailerNum,
          customerPrice: customerNum,
          unit: unit?.trim() || 'pcs',
          notes: notes?.trim() || null,
        },
        include: {
          category: {
            include: {
              parent: true,
            },
          },
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

      await tx.auditLog.create({
        data: {
          actionType: 'CREATE',
          entityType: 'ITEM',
          entityId: item.id,
          entityName: item.name,
          newData: {
            id: item.id,
            name: item.name,
            srNo: item.srNo,
            itemCode: item.itemCode,
            brand: item.brand,
            modelNumber: item.modelNumber,
            costPrice: costNum,
            retailerPrice: retailerNum,
            customerPrice: customerNum,
            unit: item.unit,
            notes: item.notes,
            categoryId: item.categoryId,
            categoryName: item.category.name,
            categoryParentId: item.category.parentId,
          } as any,
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
