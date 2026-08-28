import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const PARENT_CATEGORIES = [
  { id: 'ci_parts', name: 'C.I. Submersible Parts', sortOrder: 10 },
  { id: 'impellers', name: 'Impellers (Openwell & Mono Block)', sortOrder: 20 },
  { id: 'bearing_set', name: 'Thrust Bearing, Counter & Bearing Set', sortOrder: 30 },
  { id: 'bush_rubber', name: 'L.B. Bush & Rubber Bush', sortOrder: 40 },
  { id: 'diffuser_bowl', name: 'Diffuser (Bowl) & Impeller', sortOrder: 50 },
  { id: 'studs_bolts', name: 'Studs, Nuts, Bolts & Washers', sortOrder: 60 },
  { id: 'sleeve_couple', name: 'S.S. Sleeve & Couple', sortOrder: 70 },
  { id: 'key_bowls', name: 'S.S. Key, S.S./C.I. Bowl & Impeller', sortOrder: 80 },
  { id: 'pump_parts', name: 'S.S. Submersible Pump Parts', sortOrder: 90 },
];

async function main() {
  console.log('Starting catalog seeding...');
  
  // Set up settings
  const pinHash = await bcrypt.hash('1234', 10);
  await prisma.systemSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings', pinHash, themeMode: 'light' },
  });

  // Clear existing items and categories
  console.log('Clearing old data to ensure clean hierarchical structure...');
  await prisma.priceHistory.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();

  // 1. Seed Parent Categories
  console.log('Seeding parent categories...');
  for (const parent of PARENT_CATEGORIES) {
    await prisma.category.create({
      data: {
        id: parent.id,
        name: parent.name,
        sortOrder: parent.sortOrder,
      },
    });
  }

  // 2. Read structured catalog JSON
  const catalogPath = path.join(__dirname, '../src/lib/jkCatalog.json');
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog JSON file not found at: ${catalogPath}`);
  }
  
  const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Loaded ${catalogData.length} category groups from JSON.`);

  let totalItemsSeeded = 0;

  // 3. Seed subcategories and items
  for (const group of catalogData) {
    const parentId = group.parentId || null;
    
    // Create subcategory
    const subcategory = await prisma.category.create({
      data: {
        name: group.name,
        parentId: parentId,
        sortOrder: group.sortOrder || 0,
        sourcePage: group.sourcePage || null,
      },
    });

    console.log(`Seeding items for subcategory: ${group.name} (${group.items.length} items)...`);

    for (const sourceItem of group.items) {
      // Generate item code dynamically
      const pageStr = sourceItem.sourcePage ? `P${sourceItem.sourcePage}` : 'PX';
      const itemCode = `JK-${pageStr}-${subcategory.sortOrder || 0}-${sourceItem.sortOrder || 0}`;

      // Create the item
      const item = await prisma.item.create({
        data: {
          name: sourceItem.name,
          itemCode: itemCode,
          categoryId: subcategory.id,
          costPrice: sourceItem.costPrice || 0,
          retailerPrice: 0,
          customerPrice: 0,
          unit: sourceItem.unit || 'pcs',
          catalogGroup: sourceItem.catalogGroup || null,
          catalogSrNo: sourceItem.catalogSrNo || null,
          variantSrNo: sourceItem.variantSrNo || null,
          sortOrder: sourceItem.sortOrder || 0,
          sourcePage: sourceItem.sourcePage || null,
          notes: `JK Spares catalogue, page ${sourceItem.sourcePage || 'unknown'}. Prices are from 2023 list.`,
        },
      });

      // Log initial price history
      await prisma.priceHistory.create({
        data: {
          itemId: item.id,
          oldCostPrice: sourceItem.costPrice || 0,
          newCostPrice: sourceItem.costPrice || 0,
          oldRetailerPrice: 0,
          newRetailerPrice: 0,
          oldCustomerPrice: 0,
          newCustomerPrice: 0,
          changeNote: 'Imported from JK Spares catalogue',
        },
      });

      totalItemsSeeded++;
    }
  }

  console.log(`Seeding completed successfully! Total items seeded: ${totalItemsSeeded}`);
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
