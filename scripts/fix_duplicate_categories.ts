import { prisma } from '../src/lib/db';

async function main() {
  console.log('--- Cleaning up duplicate single-table subcategories ---');

  // 1. "S.S. Submersible Pump Parts"
  const pumpPartsSub = await prisma.category.findUnique({
    where: { id: 'cmtcle6dc02d1siafesg92gkd' },
  });
  if (pumpPartsSub) {
    const moved = await prisma.item.updateMany({
      where: { categoryId: pumpPartsSub.id },
      data: { categoryId: 'pump_parts' },
    });
    console.log(`Moved ${moved.count} items from "${pumpPartsSub.name}" to root "pump_parts"`);
    await prisma.category.delete({ where: { id: pumpPartsSub.id } });
    console.log(`Deleted duplicate subcategory "${pumpPartsSub.name}"`);
  }

  // 2. "S.S. Sleeve & Couple"
  const sleeveSub = await prisma.category.findUnique({
    where: { id: 'cmtcle2x502apsiafr13mmxhd' },
  });
  if (sleeveSub) {
    const moved = await prisma.item.updateMany({
      where: { categoryId: sleeveSub.id },
      data: { categoryId: 'sleeve_couple' },
    });
    console.log(`Moved ${moved.count} items from "${sleeveSub.name}" to root "sleeve_couple"`);
    await prisma.category.delete({ where: { id: sleeveSub.id } });
    console.log(`Deleted duplicate subcategory "${sleeveSub.name}"`);
  }

  // 3. "S.S. Key, S.S./C.I. Bowl & Impeller"
  const keyBowlsSub = await prisma.category.findUnique({
    where: { id: 'cmtcle4n502bvsiaf9awzypey' },
  });
  if (keyBowlsSub) {
    const moved = await prisma.item.updateMany({
      where: { categoryId: keyBowlsSub.id },
      data: { categoryId: 'key_bowls' },
    });
    console.log(`Moved ${moved.count} items from "${keyBowlsSub.name}" to root "key_bowls"`);
    await prisma.category.delete({ where: { id: keyBowlsSub.id } });
    console.log(`Deleted duplicate subcategory "${keyBowlsSub.name}"`);
  }

  // 4. "Studs, Nuts, Bolts & Washers" -> subcat "S.S. 410 Stud, Nut, Bolt, Washer"
  const studsSub = await prisma.category.findUnique({
    where: { id: 'cmtcldzmc028jsiaf7qnvixa5' },
  });
  if (studsSub) {
    const moved = await prisma.item.updateMany({
      where: { categoryId: studsSub.id },
      data: { categoryId: 'studs_bolts' },
    });
    console.log(`Moved ${moved.count} items from "${studsSub.name}" to root "studs_bolts"`);
    await prisma.category.delete({ where: { id: studsSub.id } });
    console.log(`Deleted duplicate subcategory "${studsSub.name}"`);
  }

  console.log('--- RE-VERIFYING DATABASE CATEGORIES ---');
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: true,
          _count: { select: { items: true } },
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  for (const c of categories) {
    console.log(`\n[ROOT] "${c.name}" | Direct Items: ${c._count.items} | Subcategories: ${c.children.length}`);
    for (const ch of c.children) {
      console.log(`   ├── [L2] "${ch.name}" | Direct Items: ${ch._count.items} | Sub-subs: ${ch.children.length}`);
      for (const ch2 of ch.children) {
        console.log(`   │      └── [L3] "${ch2.name}"`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
