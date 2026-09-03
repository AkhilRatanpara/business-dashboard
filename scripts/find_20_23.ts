import { prisma } from '../src/lib/db';

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
  });

  for (const cat of categories) {
    for (let i = 0; i < cat.items.length - 1; i++) {
      const a = cat.items[i];
      const b = cat.items[i + 1];
      if (a.srNo && b.srNo) {
        const numA = parseInt(a.srNo);
        const numB = parseInt(b.srNo);
        if (numA === 20 && numB === 23) {
          console.log(`FOUND 20 -> 23 in Category: "${cat.name}" (ID: ${cat.id})`);
          console.log(`Item 20: "${a.name}"`);
          console.log(`Item 23: "${b.name}"`);
        }
        if (numB - numA > 1 && !a.srNo.includes('.') && !b.srNo.includes('.')) {
          console.log(`GAP in "${cat.name}": srNo ${a.srNo} ("${a.name}") -> srNo ${b.srNo} ("${b.name}")`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
