import { prisma } from '../src/lib/db';

async function main() {
  const deletedLogs = await prisma.auditLog.findMany({
    where: { actionType: 'DELETE' },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${deletedLogs.length} DELETE audit logs:`);
  for (const log of deletedLogs) {
    console.log(`[${log.createdAt.toISOString()}] Entity: ${log.entityType} ${log.entityId} | Name: ${log.entityName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
