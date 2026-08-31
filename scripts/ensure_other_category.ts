import { prisma } from '../src/lib/db';

async function main() {
  const otherCat = await prisma.category.findFirst({
    where: {
      OR: [
        { id: 'other' },
        { name: { equals: 'Other', mode: 'insensitive' } },
        { name: { equals: 'Others', mode: 'insensitive' } },
      ],
    },
  });

  if (!otherCat) {
    const created = await prisma.category.create({
      data: {
        id: 'other',
        name: 'Other',
        sortOrder: 99,
      },
    });
    console.log('Created default "Other" category:', created);
  } else {
    console.log('"Other" category already exists:', otherCat);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
