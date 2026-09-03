import { prisma } from '../src/lib/db';

async function main() {
  const cat = await prisma.category.findFirst({
    where: { name: 'V-4 C.I. Submersible Parts' },
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
      }
    }
  });

  if (!cat) return;
  console.log(`=== ITEMS IN ${cat.name} (${cat.items.length}) ===`);
  for (const item of cat.items) {
    console.log(`srNo: "${item.srNo}", sortOrder: ${item.sortOrder}, name: "${item.name}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
