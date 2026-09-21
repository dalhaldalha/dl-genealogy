import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all genealogy data...');
  await prisma.mediaArtifact.deleteMany();
  await prisma.parentChild.deleteMany();
  await prisma.union.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.familyTree.deleteMany();

  const defaultTree = await prisma.familyTree.create({
    data: {
      name: 'My Family Tree',
      subtitle: 'Our Family Lineage',
    },
  });

  console.log(`✅ Database cleared! Created clean, empty tree: "${defaultTree.name}" (ID: ${defaultTree.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
