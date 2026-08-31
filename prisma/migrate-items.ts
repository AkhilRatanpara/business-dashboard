import { prisma } from '../src/lib/db';

async function migrate() {
  console.log('Starting data migration...');

  // 1. Ensure Brand "J.K. Spares" exists
  const defaultBrand = await prisma.brand.upsert({
    where: { name: 'J.K. Spares' },
    update: {},
    create: { name: 'J.K. Spares' },
  });
  console.log('Default Brand created/verified:', defaultBrand);

  // 2. Fetch all items
  const items = await prisma.item.findMany();
  console.log(`Found ${items.length} items to update...`);

  let updatedCount = 0;
  for (const item of items) {
    let computedSrNo: string | null = item.srNo;
    if (!computedSrNo && item.catalogSrNo !== null && item.catalogSrNo !== undefined) {
      if (item.variantSrNo !== null && item.variantSrNo !== undefined && item.variantSrNo > 0) {
        computedSrNo = `${item.catalogSrNo}.${item.variantSrNo}`;
      } else {
        computedSrNo = `${item.catalogSrNo}`;
      }
    }

    // Clean notes if it matches the default imported string
    let cleanNotes = item.notes;
    if (cleanNotes && cleanNotes.includes('JK Spares catalogue, page')) {
      cleanNotes = null;
    }

    // Clean auto-generated itemCode if it starts with JK-P
    let cleanItemCode = item.itemCode;
    if (cleanItemCode && /^JK-P\d+-\d+-\d+$/i.test(cleanItemCode)) {
      cleanItemCode = null;
    }

    await prisma.item.update({
      where: { id: item.id },
      data: {
        brand: 'J.K. Spares',
        srNo: computedSrNo,
        notes: cleanNotes,
        itemCode: cleanItemCode,
      },
    });
    updatedCount++;
  }

  console.log(`Successfully migrated ${updatedCount} items!`);

  // Sample verification
  const sampleItems = await prisma.item.findMany({ take: 5 });
  console.log('Sample updated items:', sampleItems.map(i => ({ id: i.id, name: i.name, brand: i.brand, srNo: i.srNo, itemCode: i.itemCode })));
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
