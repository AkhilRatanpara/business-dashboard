import { prisma } from '../src/lib/db';

async function migrateFast() {
  console.log('Fast batch migration...');
  const items = await prisma.item.findMany();
  console.log(`Fetched ${items.length} items.`);

  const batchSize = 40;
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(
      chunk.map((item) => {
        let computedSrNo: string | null = item.srNo;
        if (!computedSrNo && item.catalogSrNo !== null && item.catalogSrNo !== undefined) {
          if (item.variantSrNo !== null && item.variantSrNo !== undefined && item.variantSrNo > 0) {
            computedSrNo = `${item.catalogSrNo}.${item.variantSrNo}`;
          } else {
            computedSrNo = `${item.catalogSrNo}`;
          }
        }

        let cleanNotes = item.notes;
        if (cleanNotes && cleanNotes.includes('JK Spares catalogue, page')) {
          cleanNotes = null;
        }

        let cleanItemCode = item.itemCode;
        if (cleanItemCode && /^JK-P\d+-\d+-\d+$/i.test(cleanItemCode)) {
          cleanItemCode = null;
        }

        return prisma.item.update({
          where: { id: item.id },
          data: {
            brand: 'J.K. Spares',
            srNo: computedSrNo,
            notes: cleanNotes,
            itemCode: cleanItemCode,
          },
        });
      })
    );
    console.log(`Updated ${Math.min(i + batchSize, items.length)} / ${items.length}`);
  }

  console.log('Fast migration completed!');
}

migrateFast()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
