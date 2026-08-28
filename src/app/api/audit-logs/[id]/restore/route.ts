import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: params.id },
    });

    if (!log) {
      return NextResponse.json({ success: false, message: 'Log entry not found' }, { status: 404 });
    }

    const { actionType, entityType, oldData } = log;
    if (!oldData) {
      return NextResponse.json({ success: false, message: 'No backup data available to restore' }, { status: 400 });
    }

    const backup = oldData as any;

    if (actionType === 'DELETE' && entityType === 'BATCH_ITEMS') {
      // Restore multiple items deleted in a batch
      await prisma.$transaction(async (tx) => {
        if (backup.items && Array.isArray(backup.items)) {
          for (const itemData of backup.items) {
            // Ensure category exists
            const catId = itemData.categoryId;
            const catExists = await tx.category.findUnique({ where: { id: catId } });
            if (!catExists) {
              await tx.category.create({
                data: {
                  id: catId,
                  name: itemData.categoryName || 'Restored Category',
                  parentId: itemData.categoryParentId || null,
                },
              });
            }

            // Create the item
            const restoredItem = await tx.item.create({
              data: {
                id: itemData.id,
                name: itemData.name,
                itemCode: itemData.itemCode || null,
                categoryId: itemData.categoryId,
                brand: itemData.brand || null,
                modelNumber: itemData.modelNumber || null,
                costPrice: itemData.costPrice,
                retailerPrice: itemData.retailerPrice,
                customerPrice: itemData.customerPrice,
                unit: itemData.unit || 'pcs',
                notes: itemData.notes || null,
                isActive: itemData.isActive ?? true,
                createdAt: new Date(itemData.createdAt),
              },
            });

            // Create price history entry
            await tx.priceHistory.create({
              data: {
                itemId: restoredItem.id,
                oldCostPrice: itemData.costPrice,
                newCostPrice: itemData.costPrice,
                oldRetailerPrice: itemData.retailerPrice,
                newRetailerPrice: itemData.retailerPrice,
                oldCustomerPrice: itemData.customerPrice,
                newCustomerPrice: itemData.customerPrice,
                changeNote: 'Restored from batch deletion',
              },
            });
          }
        }
      });

      await prisma.auditLog.delete({ where: { id: log.id } });
      return NextResponse.json({
        success: true,
        message: `Successfully restored all ${backup.items?.length || 0} batch-deleted items`,
      });
    }

    if (actionType === 'DELETE' && entityType === 'ITEM') {
      // Restore a deleted item
      await prisma.$transaction(async (tx) => {
        // Ensure category exists
        const catId = backup.categoryId;
        const catExists = await tx.category.findUnique({ where: { id: catId } });
        if (!catExists) {
          await tx.category.create({
            data: {
              id: catId,
              name: backup.categoryName || 'Restored Category',
              parentId: backup.categoryParentId || null,
            },
          });
        }

        // Create the item with its original ID
        const restored = await tx.item.create({
          data: {
            id: backup.id,
            name: backup.name,
            itemCode: backup.itemCode || null,
            categoryId: backup.categoryId,
            brand: backup.brand || null,
            modelNumber: backup.modelNumber || null,
            costPrice: backup.costPrice,
            retailerPrice: backup.retailerPrice,
            customerPrice: backup.customerPrice,
            unit: backup.unit || 'pcs',
            notes: backup.notes || null,
            isActive: backup.isActive ?? true,
            createdAt: new Date(backup.createdAt),
          },
        });

        // Log initial price history for restored item
        await tx.priceHistory.create({
          data: {
            itemId: restored.id,
            oldCostPrice: backup.costPrice,
            newCostPrice: backup.costPrice,
            oldRetailerPrice: backup.retailerPrice,
            newRetailerPrice: backup.retailerPrice,
            oldCustomerPrice: backup.customerPrice,
            newCustomerPrice: backup.customerPrice,
            changeNote: 'Restored from Activity Log',
          },
        });
      });

      // Delete the log entry since it has been restored
      await prisma.auditLog.delete({ where: { id: log.id } });
      return NextResponse.json({ success: true, message: `Successfully restored item "${backup.name}"` });
    }

    if (actionType === 'UPDATE' && entityType === 'ITEM') {
      // Revert an updated item back to its old state
      await prisma.$transaction(async (tx) => {
        const itemExists = await tx.item.findUnique({ where: { id: log.entityId } });
        if (!itemExists) {
          throw new Error('Item does not exist anymore. Use DELETE restore if it was deleted.');
        }

        const oldCost = Number(itemExists.costPrice);
        const oldRetailer = Number(itemExists.retailerPrice);
        const oldCustomer = Number(itemExists.customerPrice);

        const newCost = Number(backup.costPrice);
        const newRetailer = Number(backup.retailerPrice);
        const newCustomer = Number(backup.customerPrice);

        await tx.item.update({
          where: { id: log.entityId },
          data: {
            name: backup.name,
            itemCode: backup.itemCode || null,
            categoryId: backup.categoryId,
            brand: backup.brand || null,
            modelNumber: backup.modelNumber || null,
            costPrice: newCost,
            retailerPrice: newRetailer,
            customerPrice: newCustomer,
            unit: backup.unit || 'pcs',
            notes: backup.notes || null,
            isActive: backup.isActive ?? true,
          },
        });

        const pricesChanged = oldCost !== newCost || oldRetailer !== newRetailer || oldCustomer !== newCustomer;
        if (pricesChanged) {
          await tx.priceHistory.create({
            data: {
              itemId: log.entityId,
              oldCostPrice: oldCost,
              newCostPrice: newCost,
              oldRetailerPrice: oldRetailer,
              newRetailerPrice: newRetailer,
              oldCustomerPrice: oldCustomer,
              newCustomerPrice: newCustomer,
              changeNote: 'Reverted via Activity History',
            },
          });
        }
      });

      await prisma.auditLog.delete({ where: { id: log.id } });
      return NextResponse.json({ success: true, message: `Reverted changes for "${backup.name}"` });
    }

    if (actionType === 'DELETE' && entityType === 'CATEGORY') {
      // Restore a deleted category and all cascaded items if available
      await prisma.$transaction(async (tx) => {
        // Restore category itself
        await tx.category.create({
          data: {
            id: backup.id,
            name: backup.name,
            parentId: backup.parentId || null,
          },
        });

        // Restore cascaded items if logged
        if (backup.items && Array.isArray(backup.items)) {
          for (const itemData of backup.items) {
            const restoredItem = await tx.item.create({
              data: {
                id: itemData.id,
                name: itemData.name,
                itemCode: itemData.itemCode || null,
                categoryId: backup.id,
                brand: itemData.brand || null,
                modelNumber: itemData.modelNumber || null,
                costPrice: itemData.costPrice,
                retailerPrice: itemData.retailerPrice,
                customerPrice: itemData.customerPrice,
                unit: itemData.unit || 'pcs',
                notes: itemData.notes || null,
                isActive: itemData.isActive ?? true,
                createdAt: new Date(itemData.createdAt),
              },
            });

            await tx.priceHistory.create({
              data: {
                itemId: restoredItem.id,
                oldCostPrice: itemData.costPrice,
                newCostPrice: itemData.costPrice,
                oldRetailerPrice: itemData.retailerPrice,
                newRetailerPrice: itemData.retailerPrice,
                oldCustomerPrice: itemData.customerPrice,
                newCustomerPrice: itemData.customerPrice,
                changeNote: 'Restored with parent category',
              },
            });
          }
        }
      });

      await prisma.auditLog.delete({ where: { id: log.id } });
      return NextResponse.json({
        success: true,
        message: `Successfully restored category "${backup.name}" ${
          backup.items ? `and ${backup.items.length} items` : ''
        }`,
      });
    }

    return NextResponse.json({ success: false, message: 'Restoration for this action type is not implemented' }, { status: 400 });
  } catch (error: any) {
    console.error('Error restoring audit log:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to restore changes' }, { status: 500 });
  }
}
