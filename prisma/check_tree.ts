import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    include: {
      parent: true,
      children: {
        include: {
          children: {
            include: {
              _count: { select: { items: true } }
            }
          },
          _count: { select: { items: true } }
        }
      },
      _count: { select: { items: true } }
    },
    orderBy: { name: 'asc' }
  });

  const roots = cats.filter(c => !c.parentId);
  console.log(`=== CATEGORY TREE (${roots.length} Root Categories) ===`);
  
  for (const root of roots) {
    console.log(`\n📁 [L1] ${root.name} (${root._count.items} direct items)`);
    for (const sub of root.children) {
      console.log(`   📂 [L2] ${sub.name} (${sub._count.items} direct items)`);
      for (const subsub of sub.children) {
        console.log(`      📄 [L3] ${subsub.name} (${subsub._count.items} direct items)`);
      }
    }
  }

  const totalItems = await prisma.item.count();
  console.log(`\nTotal items in database: ${totalItems}`);
}

main().finally(() => prisma.$disconnect());
