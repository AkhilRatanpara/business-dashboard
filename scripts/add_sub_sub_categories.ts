import { prisma } from '../src/lib/db';

async function main() {
  console.log('--- ADDING 3-LEVEL SUB-SUB CATEGORIES & REASSIGNING ITEMS ---');

  // Define 3rd level subcategories
  const subSubCategories = [
    // ── Under V-4 C.I. Submersible Parts (v4_ci) ──
    { id: 'v4_nrv', name: 'V-4 NRV', parentId: 'v4_ci', sortOrder: 1 },
    { id: 'v4_suction', name: 'V-4 Suction', parentId: 'v4_ci', sortOrder: 2 },
    { id: 'v4_connective', name: 'V-4 Connective', parentId: 'v4_ci', sortOrder: 3 },
    { id: 'v4_upper_housing', name: 'V-4 Upper Housing', parentId: 'v4_ci', sortOrder: 4 },
    { id: 'v4_lower_housing', name: 'V-4 Lower Housing', parentId: 'v4_ci', sortOrder: 5 },
    { id: 'v4_motor_base', name: 'V-4 Motor Base', parentId: 'v4_ci', sortOrder: 6 },
    { id: 'v4_bowls_accessories', name: 'V-4 Bowls & Accessories', parentId: 'v4_ci', sortOrder: 7 },

    // ── Under V-3 C.I. Submersible Parts (v3_ci) ──
    { id: 'v3_nrv', name: 'V-3 NRV', parentId: 'v3_ci', sortOrder: 1 },
    { id: 'v3_suction', name: 'V-3 Suction', parentId: 'v3_ci', sortOrder: 2 },
    { id: 'v3_upper_housing', name: 'V-3 Upper Housing', parentId: 'v3_ci', sortOrder: 3 },
    { id: 'v3_lower_housing', name: 'V-3 Lower Housing', parentId: 'v3_ci', sortOrder: 4 },
    { id: 'v3_motor_base', name: 'V-3 Motor Base', parentId: 'v3_ci', sortOrder: 5 },

    // ── Under V-5 C.I. Submersible Parts (v5_ci) ──
    { id: 'v5_nrv', name: 'V-5 NRV', parentId: 'v5_ci', sortOrder: 1 },
    { id: 'v5_suction', name: 'V-5 Suction', parentId: 'v5_ci', sortOrder: 2 },
    { id: 'v5_connective', name: 'V-5 Connective', parentId: 'v5_ci', sortOrder: 3 },
    { id: 'v5_upper_housing', name: 'V-5 Upper Housing', parentId: 'v5_ci', sortOrder: 4 },
    { id: 'v5_lower_housing', name: 'V-5 Lower Housing', parentId: 'v5_ci', sortOrder: 5 },
    { id: 'v5_motor_base', name: 'V-5 Motor Base', parentId: 'v5_ci', sortOrder: 6 },

    // ── Under S.S. Pump Parts (V-6) (v6_ss_pump_parts) ──
    { id: 'v6_suction', name: 'V-6 Suction', parentId: 'v6_ss_pump_parts', sortOrder: 1 },
    { id: 'v6_nrv', name: 'V-6 NRV', parentId: 'v6_ss_pump_parts', sortOrder: 2 },
    { id: 'v6_connective', name: 'V-6 Connective', parentId: 'v6_ss_pump_parts', sortOrder: 3 },
    { id: 'v6_upper_housing', name: 'V-6 Upper Housing', parentId: 'v6_ss_pump_parts', sortOrder: 4 },
    { id: 'v6_lower_housing', name: 'V-6 Lower Housing', parentId: 'v6_ss_pump_parts', sortOrder: 5 },
    { id: 'v6_motor_base', name: 'V-6 Motor Base', parentId: 'v6_ss_pump_parts', sortOrder: 6 },
    { id: 'v6_accessories', name: 'V-6 Accessories', parentId: 'v6_ss_pump_parts', sortOrder: 7 },
  ];

  for (const cat of subSubCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
      },
      create: {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log(`Created/updated ${subSubCategories.length} sub-sub categories.`);

  // Re-assign V-4 items
  const v4Items = await prisma.item.findMany({
    where: { categoryId: { in: ['v4_ci', 'v4_nrv', 'v4_suction', 'v4_connective', 'v4_upper_housing', 'v4_lower_housing', 'v4_motor_base', 'v4_bowls_accessories'] } },
  });
  console.log(`Found ${v4Items.length} V-4 items to organize.`);

  for (const item of v4Items) {
    const sr = item.srNo || '';
    let targetCat = 'v4_nrv';

    if (sr.startsWith('12.')) {
      targetCat = 'v4_suction';
    } else if (sr.startsWith('13.')) {
      targetCat = 'v4_connective';
    } else if (sr.startsWith('14.')) {
      targetCat = 'v4_upper_housing';
    } else if (sr.startsWith('15.')) {
      targetCat = 'v4_lower_housing';
    } else if (sr.startsWith('16.')) {
      targetCat = 'v4_motor_base';
    } else if (['17', '18', '19', '20', '21', '22'].includes(sr)) {
      targetCat = 'v4_bowls_accessories';
    } else {
      targetCat = 'v4_nrv';
    }

    if (item.categoryId !== targetCat) {
      await prisma.item.update({
        where: { id: item.id },
        data: { categoryId: targetCat },
      });
    }
  }

  // Re-assign V-3 items
  const v3Items = await prisma.item.findMany({
    where: { categoryId: { in: ['v3_ci', 'v3_nrv', 'v3_suction', 'v3_upper_housing', 'v3_lower_housing', 'v3_motor_base'] } },
  });
  for (const item of v3Items) {
    const sr = item.srNo || '';
    let targetCat = 'v3_nrv';
    if (sr.startsWith('2.')) targetCat = 'v3_suction';
    else if (sr === '3' || sr === '4') targetCat = 'v3_upper_housing';
    else if (sr === '5') targetCat = 'v3_lower_housing';
    else if (sr === '6') targetCat = 'v3_motor_base';

    if (item.categoryId !== targetCat) {
      await prisma.item.update({
        where: { id: item.id },
        data: { categoryId: targetCat },
      });
    }
  }

  // Re-assign V-5 items
  const v5Items = await prisma.item.findMany({
    where: { categoryId: { in: ['v5_ci', 'v5_nrv', 'v5_suction', 'v5_connective', 'v5_upper_housing', 'v5_lower_housing', 'v5_motor_base'] } },
  });
  for (const item of v5Items) {
    const sr = item.srNo || '';
    let targetCat = 'v5_nrv';
    if (sr === '2') targetCat = 'v5_suction';
    else if (sr === '3') targetCat = 'v5_connective';
    else if (sr === '4') targetCat = 'v5_upper_housing';
    else if (sr === '5') targetCat = 'v5_lower_housing';
    else if (sr === '6') targetCat = 'v5_motor_base';

    if (item.categoryId !== targetCat) {
      await prisma.item.update({
        where: { id: item.id },
        data: { categoryId: targetCat },
      });
    }
  }

  // Re-assign V-6 SS Pump Parts items
  const v6Items = await prisma.item.findMany({
    where: { categoryId: { in: ['v6_ss_pump_parts', 'v6_suction', 'v6_nrv', 'v6_connective', 'v6_upper_housing', 'v6_lower_housing', 'v6_motor_base', 'v6_accessories'] } },
  });
  for (const item of v6Items) {
    const sr = item.srNo || '';
    let targetCat = 'v6_suction';
    if (sr === '1' || sr === '2') targetCat = 'v6_suction';
    else if (sr === '3' || sr === '4' || sr === '5') targetCat = 'v6_nrv';
    else if (sr === '6') targetCat = 'v6_connective';
    else if (sr === '7') targetCat = 'v6_upper_housing';
    else if (sr === '8' || sr === '9') targetCat = 'v6_lower_housing';
    else if (sr === '10' || sr === '11') targetCat = 'v6_motor_base';
    else if (sr === '12' || sr === '13' || sr === '14') targetCat = 'v6_accessories';

    if (item.categoryId !== targetCat) {
      await prisma.item.update({
        where: { id: item.id },
        data: { categoryId: targetCat },
      });
    }
  }

  console.log('All 3-level sub-sub categories and items configured successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
