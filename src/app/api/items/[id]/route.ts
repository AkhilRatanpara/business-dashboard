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
        category: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
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
      include: {
        category: true,
      },
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

    const oldItemForLog = {
      id: existingItem.id,
      name: existingItem.name,
      srNo: existingItem.srNo,
      itemCode: existingItem.itemCode,
      brand: existingItem.brand,
      modelNumber: existingItem.modelNumber,
      costPrice: oldCost,
      retailerPrice: oldRetailer,
      customerPrice: oldCustomer,
      unit: existingItem.unit,
      notes: existingItem.notes,
      categoryId: existingItem.categoryId,
      categoryName: existingItem.category?.name,
      categoryParentId: existingItem.category?.parentId,
    };

    const brandVal = body.brand !== undefined ? (body.brand?.trim() || null) : existingItem.brand;
    const srNoVal = body.srNo !== undefined ? (body.srNo?.trim() || null) : existingItem.srNo;

    // If brand changed or provided, ensure in Brand table
    if (brandVal) {
      await prisma.brand.upsert({
        where: { name: brandVal },
        update: {},
        create: { name: brandVal },
      });
    }

    // Atomic update in Neon PostgreSQL
    const updatedItem = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id: params.id },
        data: {
          name: body.name !== undefined ? body.name.trim() : existingItem.name,
          srNo: srNoVal,
          itemCode: body.itemCode !== undefined ? (body.itemCode?.trim() || null) : existingItem.itemCode,
          categoryId: body.categoryId !== undefined ? body.categoryId : existingItem.categoryId,
          brand: brandVal,
          modelNumber: body.modelNumber !== undefined ? (body.modelNumber?.trim() || null) : existingItem.modelNumber,
          costPrice: newCost,
          retailerPrice: newRetailer,
          customerPrice: newCustomer,
          unit: body.unit !== undefined ? (body.unit?.trim() || 'pcs') : existingItem.unit,
          notes: body.notes !== undefined ? (body.notes?.trim() || null) : existingItem.notes,
        },
        include: {
          category: {
            include: {
              parent: true,
            },
          },
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

      await tx.auditLog.create({
        data: {
          actionType: 'UPDATE',
          entityType: 'ITEM',
          entityId: updated.id,
          entityName: updated.name,
          oldData: oldItemForLog as any,
          newData: {
            id: updated.id,
            name: updated.name,
            srNo: updated.srNo,
            itemCode: updated.itemCode,
            brand: updated.brand,
            modelNumber: updated.modelNumber,
            costPrice: newCost,
            retailerPrice: newRetailer,
            customerPrice: newCustomer,
            unit: updated.unit,
            notes: updated.notes,
            categoryId: updated.categoryId,
            categoryName: updated.category.name,
            categoryParentId: updated.category.parentId,
          } as any,
        },
      });

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
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        category: true,
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actionType: 'DELETE',
          entityType: 'ITEM',
          entityId: item.id,
          entityName: item.name,
          oldData: {
            id: item.id,
            name: item.name,
            srNo: item.srNo,
            itemCode: item.itemCode,
            brand: item.brand,
            modelNumber: item.modelNumber,
            costPrice: Number(item.costPrice),
            retailerPrice: Number(item.retailerPrice),
            customerPrice: Number(item.customerPrice),
            unit: item.unit,
            notes: item.notes,
            createdAt: item.createdAt,
            categoryId: item.categoryId,
            categoryName: item.category.name,
            categoryParentId: item.category.parentId,
          } as any,
        },
      });

      await tx.item.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete item' }, { status: 500 });
  }
}
