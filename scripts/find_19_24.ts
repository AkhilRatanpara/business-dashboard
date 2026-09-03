import { prisma } from '../src/lib/db';

async function main() {
  const items = await prisma.item.findMany({
    where: {
      srNo: {
        in: ['19', '20', '21', '22', '23', '24'],
      },
    },
    include: {
      category: {
        include: { parent: true }
      }
    },
    orderBy: [
      { categoryId: 'asc' },
      { srNo: 'asc' }
    ]
  });

  console.log('=== ITEMS WITH SR 19 to 24 ===');
  for (const item of items) {
    console.log(`[Cat: ${item.category?.parent ? item.category.parent.name + ' > ' : ''}${item.category?.name}] Sr: "${item.srNo}" - "${item.name}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
