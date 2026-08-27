import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Neon PostgreSQL database...');

  // Initialize System Settings with Default Security PIN (1234)
  const pinHash = await bcrypt.hash('1234', 10);
  await prisma.systemSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      pinHash,
      themeMode: 'dark',
    },
  });

  // Seed Categories
  const categoriesData = [
    { name: 'Bearings' },
    { name: 'Electrical & Capacitors' },
    { name: 'Motor Parts' },
    { name: 'Pump Parts & Impellers' },
    { name: 'Mechanical Seals & Gaskets' },
    { name: 'Tools & Accessories' },
  ];

  const categoriesMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
    categoriesMap.set(cat.name, created.id);
  }

  // Seed Sample Items for Submersible Pump Repair Shop
  const sampleItems = [
    {
      name: 'Bearing 6203 ZZ',
      itemCode: 'BRG-6203ZZ',
      categoryName: 'Bearings',
      brand: 'SKF',
      modelNumber: '6203-2Z',
      costPrice: 92,
      retailerPrice: 120,
      customerPrice: 150,
      unit: 'pcs',
      notes: 'High speed ball bearing for V4/V6 motor',
    },
    {
      name: 'Bearing 6204 2RS',
      itemCode: 'BRG-6204RS',
      categoryName: 'Bearings',
      brand: 'NBC',
      modelNumber: '6204-2RS',
      costPrice: 110,
      retailerPrice: 140,
      customerPrice: 175,
      unit: 'pcs',
      notes: 'Rubber sealed bearing for water pumps',
    },
    {
      name: 'Capacitor 36µF / 440V',
      itemCode: 'CAP-36UF',
      categoryName: 'Electrical & Capacitors',
      brand: 'Tibcon',
      modelNumber: '36 MFD',
      costPrice: 110,
      retailerPrice: 150,
      customerPrice: 180,
      unit: 'pcs',
      notes: 'Starting capacitor for 1HP submersible motor',
    },
    {
      name: 'Capacitor 50µF Heavy Duty',
      itemCode: 'CAP-50UF',
      categoryName: 'Electrical & Capacitors',
      brand: 'Keltron',
      modelNumber: '50 MFD',
      costPrice: 145,
      retailerPrice: 190,
      customerPrice: 230,
      unit: 'pcs',
      notes: 'Heavy duty motor running capacitor',
    },
    {
      name: 'Super Enamelled Copper Wire (21 SWG)',
      itemCode: 'WRE-21SWG',
      categoryName: 'Motor Parts',
      brand: 'RR Shramik',
      modelNumber: '21 Gauge',
      costPrice: 850,
      retailerPrice: 1000,
      customerPrice: 1150,
      unit: 'kg',
      notes: 'Pure copper winding wire per kg',
    },
    {
      name: 'Mechanical Seal 19mm',
      itemCode: 'SEAL-19MM',
      categoryName: 'Mechanical Seals & Gaskets',
      brand: 'Leakproof',
      modelNumber: 'MS-19',
      costPrice: 65,
      retailerPrice: 95,
      customerPrice: 130,
      unit: 'set',
      notes: 'Waterproof shaft seal for 1.5HP openwell pump',
    },
    {
      name: 'Bronze Impeller V4 (V-Type)',
      itemCode: 'IMP-BRZ-V4',
      categoryName: 'Pump Parts & Impellers',
      brand: 'Gunatit',
      modelNumber: 'V4-100',
      costPrice: 320,
      retailerPrice: 420,
      customerPrice: 520,
      unit: 'pcs',
      notes: 'High efficiency bronze impeller',
    },
    {
      name: 'Control Box Single Phase 1.5HP',
      itemCode: 'CTL-BOX-1.5HP',
      categoryName: 'Electrical & Capacitors',
      brand: 'L&T',
      modelNumber: 'CB-1.5',
      costPrice: 1250,
      retailerPrice: 1600,
      customerPrice: 1950,
      unit: 'unit',
      notes: 'Includes ammeter, voltmeter, overload relay',
    },
  ];

  for (const item of sampleItems) {
    const categoryId = categoriesMap.get(item.categoryName);
    if (!categoryId) continue;

    // Check if item exists
    const existing = await prisma.item.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      const createdItem = await prisma.item.create({
        data: {
          name: item.name,
          itemCode: item.itemCode,
          categoryId,
          brand: item.brand,
          modelNumber: item.modelNumber,
          costPrice: item.costPrice,
          retailerPrice: item.retailerPrice,
          customerPrice: item.customerPrice,
          unit: item.unit,
          notes: item.notes,
        },
      });

      // Initial price history record
      await prisma.priceHistory.create({
        data: {
          itemId: createdItem.id,
          oldCostPrice: item.costPrice,
          newCostPrice: item.costPrice,
          oldRetailerPrice: item.retailerPrice,
          newRetailerPrice: item.retailerPrice,
          oldCustomerPrice: item.customerPrice,
          newCustomerPrice: item.customerPrice,
          changeNote: 'Initial item price setup',
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
