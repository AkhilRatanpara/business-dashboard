import { prisma } from '../src/lib/db';

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('=== CHECKING SR NO GAPS IN ALL CATEGORIES ===');
  for (const cat of categories) {
    if (cat.items.length === 0) continue;
    const srNos = cat.items.map(i => i.srNo || 'NONE');
    console.log(`\nCategory: "${cat.name}" (Items: ${cat.items.length})`);
    console.log(`First 10 Sr Nos: ${srNos.slice(0, 10).join(', ')}`);
    console.log(`Last 5 Sr Nos: ${srNos.slice(-5).join(', ')}`);

    // Check for gaps
    for (let i = 0; i < srNos.length - 1; i++) {
      const cur = parseFloat(srNos[i]);
      const next = parseFloat(srNos[i + 1]);
      if (!isNaN(cur) && !isNaN(next)) {
        if (next - cur > 1.5) {
          console.log(`   ⚠ GAP FOUND: Sr. ${srNos[i]} -> Sr. ${srNos[i+1]} (Item: "${cat.items[i].name}" -> "${cat.items[i+1].name}")`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
