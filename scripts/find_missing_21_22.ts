import { prisma } from '../src/lib/db';

async function main() {
  const items = await prisma.item.findMany({
    orderBy: [
      { categoryId: 'asc' },
      { sortOrder: 'asc' },
      { id: 'asc' }
    ],
    include: { category: true }
  });

  console.log(`Total items in DB: ${items.length}`);
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i];
    const b = items[i + 1];
    if (a.categoryId === b.categoryId) {
      if (a.srNo === '20' && b.srNo === '23') {
        console.log(`FOUND in ${a.category.name}: sr 20 (${a.name}) -> sr 23 (${b.name})`);
      }
      // What if srNo is 20 and next is 23 or gap?
      if (a.srNo && b.srNo) {
        if (a.srNo.includes('20') && b.srNo.includes('23')) {
          console.log(`POTENTIAL MATCH in ${a.category.name}: sr "${a.srNo}" (${a.name}) -> sr "${b.srNo}" (${b.name})`);
        }
      }
    }
  }

  // Also check if any category has items with srNo 20 and 23 but missing 21 or 22
  const categories = await prisma.category.findMany({
    include: { items: true }
  });

  for (const c of categories) {
    const srList = c.items.map(i => i.srNo).filter(Boolean) as string[];
    const has20 = srList.some(s => s === '20' || s.startsWith('20.'));
    const has23 = srList.some(s => s === '23' || s.startsWith('23.'));
    const has21 = srList.some(s => s === '21' || s.startsWith('21.'));
    const has22 = srList.some(s => s === '22' || s.startsWith('22.'));

    if (has20 && has23 && (!has21 || !has22)) {
      console.log(`CATEGORY MISSING 21 or 22: "${c.name}" (has20=${has20}, has21=${has21}, has22=${has22}, has23=${has23})`);
      console.log(`All SrNos in "${c.name}":`, srList.join(', '));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
