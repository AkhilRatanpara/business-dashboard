import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateProfit, calculateMarkupPercent } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        priceHistories: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    const cost = Number(item.costPrice);
    const retailer = Number(item.retailerPrice);
    const customer = Number(item.customerPrice);

    const formattedHistories = item.priceHistories.map((h) => ({
      ...h,
      oldCostPrice: Number(h.oldCostPrice),
      newCostPrice: Number(h.newCostPrice),
      oldRetailerPrice: Number(h.oldRetailerPrice),
      newRetailerPrice: Number(h.newRetailerPrice),
      oldCustomerPrice: Number(h.oldCustomerPrice),
      newCustomerPrice: Number(h.newCustomerPrice),
    }));

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        costPrice: cost,
        retailerPrice: retailer,
        customerPrice: customer,
        retailerProfit: calculateProfit(retailer, cost),
        customerProfit: calculateProfit(customer, cost),
        retailerMarkup: calculateMarkupPercent(retailer, cost),
        customerMarkup: calculateMarkupPercent(customer, cost),
        priceHistories: formattedHistories,
      },
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch item details' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const existingItem = await prisma.item.findUnique({
      where: { id: params.id },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    const oldCost = Number(existingItem.costPrice);
    const oldRetailer = Number(existingItem.retailerPrice);
    const oldCustomer = Number(existingItem.customerPrice);

    const newCost = body.costPrice !== undefined ? Number(body.costPrice) : oldCost;
    const newRetailer = body.retailerPrice !== undefined ? Number(body.retailerPrice) : oldRetailer;
    const newCustomer = body.customerPrice !== undefined ? Number(body.customerPrice) : oldCustomer;

    const pricesChanged = oldCost !== newCost || oldRetailer !== newRetailer || oldCustomer !== newCustomer;

    // Atomic update in Neon PostgreSQL
    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id: params.id },
        data: {
          name: body.name !== undefined ? body.name.trim() : existingItem.name,
          itemCode: body.itemCode !== undefined ? (body.itemCode?.trim() || null) : existingItem.itemCode,
          categoryId: body.categoryId !== undefined ? body.categoryId : existingItem.categoryId,
          brand: body.brand !== undefined ? (body.brand?.trim() || null) : existingItem.brand,
          modelNumber: body.modelNumber !== undefined ? (body.modelNumber?.trim() || null) : existingItem.modelNumber,
          costPrice: newCost,
          retailerPrice: newRetailer,
          customerPrice: newCustomer,
          unit: body.unit !== undefined ? (body.unit?.trim() || 'pcs') : existingItem.unit,
          notes: body.notes !== undefined ? (body.notes?.trim() || null) : existingItem.notes,
        },
        include: {
          category: true,
        },
      });

      if (pricesChanged) {
        await tx.priceHistory.create({
          data: {
            itemId: updated.id,
            oldCostPrice: oldCost,
            newCostPrice: newCost,
            oldRetailerPrice: oldRetailer,
            newRetailerPrice: newRetailer,
            oldCustomerPrice: oldCustomer,
            newCustomerPrice: newCustomer,
            changeNote: body.changeNote?.trim() || 'Price updated',
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ success: false, message: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete item' }, { status: 500 });
  }
}
