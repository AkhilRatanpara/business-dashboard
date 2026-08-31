import { prisma } from '../src/lib/db';

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      parent: {
        include: {
          parent: true,
        },
      },
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

  console.log('--- ALL CATEGORIES IN DATABASE ---');
  for (const c of categories) {
    if (!c.parentId) {
      console.log(`\n[ROOT CATEGORY] id: "${c.id}" | Name: "${c.name}" | Direct Items: ${c._count.items} | Subcategories: ${c.children.length}`);
      for (const ch of c.children) {
        console.log(`   ├── [L2 SUBCAT] id: "${ch.id}" | Name: "${ch.name}" | Direct Items: ${ch._count.items} | Sub-subs: ${ch.children.length}`);
        for (const ch2 of ch.children) {
          console.log(`   │      └── [L3 SUB-SUBCAT] id: "${ch2.id}" | Name: "${ch2.name}"`);
        }
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
