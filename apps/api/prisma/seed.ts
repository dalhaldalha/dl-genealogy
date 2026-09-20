import { PrismaClient, Branch, Gender } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.mediaArtifact.deleteMany();
  await prisma.parentChild.deleteMany();
  await prisma.union.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.familyTree.deleteMany();

  const tree = await prisma.familyTree.create({
    data: {
      name: 'House of Vance',
      subtitle: 'Dynasty Lineage · 4 Generations · Est. 1892',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // GENERATION 1: FOUNDERS
  // ═══════════════════════════════════════════════════════════

  const archibald = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Archibald',
      lastName: 'Vance',
      gender: Gender.male,
      dateOfBirth: new Date('1912-04-18'),
      dateOfDeath: new Date('1994-11-02'),
      isDeceased: true,
      generation: 1,
      branch: Branch.paternal,
      profession: 'Maritime Architect & Merchant',
      residence: 'Edinburgh & Boston',
      bio: 'Pioneered transatlantic cargo routes and designed specialized timber freighters. Known for his meticulous handwritten journals and collection of antique nautical charts.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=260',
    },
  });

  const beatrice = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Beatrice',
      lastName: 'Vance',
      maidenName: 'née Sterling',
      gender: Gender.female,
      dateOfBirth: new Date('1916-08-22'),
      dateOfDeath: new Date('2003-01-14'),
      isDeceased: true,
      generation: 1,
      branch: Branch.paternal,
      profession: 'Botanist & Landscape Painter',
      residence: 'Boston, Massachusetts',
      bio: 'Authored several treatises on coastal flora. Established the Beacon Hill Conservatory garden that still stands today as a public sanctuary.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=260',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // GENERATION 2: SIBLINGS & SPOUSES
  // ═══════════════════════════════════════════════════════════

  const alasdair = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Alasdair',
      lastName: 'Vance',
      gender: Gender.male,
      dateOfBirth: new Date('1942-03-11'),
      dateOfDeath: new Date('2018-09-24'),
      isDeceased: true,
      generation: 2,
      branch: Branch.paternal,
      profession: 'Professor of Classical Literature',
      residence: 'Oxford & Cambridge, UK',
      bio: 'Spent four decades deciphering archaic Mediterranean scripts. Awarded the Queen\'s Jubilee medal for humanities scholarship.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=260',
    },
  });

  const margaux = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Margaux',
      lastName: 'Vance',
      maidenName: 'née de Clairmont',
      gender: Gender.female,
      dateOfBirth: new Date('1946-06-19'),
      isDeceased: false,
      generation: 2,
      branch: Branch.maternal,
      profession: 'Concert Pianist & Philanthropist',
      residence: 'Geneva, Switzerland',
      bio: 'Toured with the Vienna Philharmonic during the 70s. Passionate advocate for children\'s music conservatory endowments.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=260',
    },
  });

  const cordelia = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Cordelia',
      lastName: 'Vance-Hayward',
      gender: Gender.female,
      dateOfBirth: new Date('1949-11-05'),
      isDeceased: false,
      generation: 2,
      branch: Branch.paternal,
      profession: 'Diplomat & UNESCO Delegate',
      residence: 'Paris & New York',
      bio: 'Led international cultural heritage preservation missions across Central Asia and the Levant. Multilingual scholar of world treaties.',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=260',
    },
  });

  const julianHayward = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Julian',
      lastName: 'Hayward',
      gender: Gender.male,
      dateOfBirth: new Date('1945-02-14'),
      dateOfDeath: new Date('2015-08-30'),
      isDeceased: true,
      generation: 2,
      branch: Branch.maternal,
      profession: 'Surgeon General & Medical Author',
      residence: 'London, England',
      bio: 'Pioneered reconstructive cardiovascular surgical techniques. Author of standard clinical reference textbooks.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=260',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // GENERATION 3: THE INNOVATORS
  // ═══════════════════════════════════════════════════════════

  const sebastian = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Sebastian',
      lastName: 'Vance',
      gender: Gender.male,
      dateOfBirth: new Date('1975-09-04'),
      isDeceased: false,
      generation: 3,
      branch: Branch.paternal,
      profession: 'Venture Architect & DeepTech Investor',
      residence: 'San Francisco, CA',
      bio: 'Founder of Vance Synergies. Passionate about oceanic energy harvesting and autonomous satellite communications.',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=260',
    },
  });

  const evelyn = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Evelyn',
      lastName: 'Vance',
      maidenName: 'née Thorne',
      gender: Gender.female,
      dateOfBirth: new Date('1978-12-15'),
      isDeceased: false,
      generation: 3,
      branch: Branch.maternal,
      profession: 'Curator of Modern Art',
      residence: 'San Francisco & New York',
      bio: 'Curated landmark retrospectives at the Guggenheim and Tate Modern. Avid restorer of mid-century brutalist residences.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=260',
    },
  });

  const gwendolyn = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Gwendolyn',
      lastName: 'Vance',
      gender: Gender.female,
      dateOfBirth: new Date('1982-04-03'),
      isDeceased: false,
      generation: 3,
      branch: Branch.paternal,
      profession: 'Neuroscientist & Biotech Founder',
      residence: 'Zurich, Switzerland',
      bio: 'Heads the Synapse Dynamics Institute investigating brain-computer interfaces for sensory restoration.',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=260',
    },
  });

  const felix = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Felix',
      lastName: 'Hayward',
      gender: Gender.male,
      dateOfBirth: new Date('1980-07-28'),
      isDeceased: false,
      generation: 3,
      branch: Branch.maternal,
      profession: 'Documentary Filmmaker & National Geographic Fellow',
      residence: 'Nairobi & Vancouver',
      bio: 'Emmy-winning director of ecological documentaries focusing on glacial retreat and wildlife corridor restoration.',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=260',
    },
  });

  const amara = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Amara',
      lastName: 'Khoury-Hayward',
      maidenName: 'née Khoury',
      gender: Gender.female,
      dateOfBirth: new Date('1984-01-19'),
      isDeceased: false,
      generation: 3,
      branch: Branch.maternal,
      profession: 'Aerospace Systems Lead',
      residence: 'Vancouver, Canada',
      bio: 'Leads propulsion integration for zero-emission passenger flight prototypes.',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=260',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // GENERATION 4: THE NEXT ERA
  // ═══════════════════════════════════════════════════════════

  const julianVance = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Julian',
      lastName: 'Vance',
      gender: Gender.male,
      dateOfBirth: new Date('2006-05-14'),
      isDeceased: false,
      generation: 4,
      branch: Branch.paternal,
      profession: 'Student of Astrophysics',
      residence: 'Oxford, UK',
      bio: 'Captain of the competitive rowing eight and researcher into exoplanet atmospheric spectroscopy.',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=260',
    },
  });

  const clara = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Clara',
      lastName: 'Vance',
      gender: Gender.female,
      dateOfBirth: new Date('2010-09-29'),
      isDeceased: false,
      generation: 4,
      branch: Branch.paternal,
      profession: 'Competitive Equestrian & Cello Scholar',
      residence: 'San Francisco, CA',
      bio: 'Junior champion in dressage and first-chair cellist in the Bay Area Youth Symphony.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=260',
    },
  });

  const leo = await prisma.familyMember.create({
    data: {
      treeId: tree.id,
      firstName: 'Leo',
      lastName: 'Hayward',
      gender: Gender.male,
      dateOfBirth: new Date('2014-02-17'),
      isDeceased: false,
      generation: 4,
      branch: Branch.maternal,
      profession: 'Young Naturalist & Robotics Enthusiast',
      residence: 'Vancouver, Canada',
      bio: 'Wins regional STEM competitions with autonomous shoreline trash-collecting aquatic probes.',
      avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=260',
    },
  });

  // ═══════════════════════════════════════════════════════════
  // PARENT-CHILD RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════

  await prisma.parentChild.createMany({
    data: [
      // Gen 1 → Gen 2
      { parentId: archibald.id, childId: alasdair.id },
      { parentId: beatrice.id, childId: alasdair.id },
      { parentId: archibald.id, childId: cordelia.id },
      { parentId: beatrice.id, childId: cordelia.id },
      // Gen 2 → Gen 3
      { parentId: alasdair.id, childId: sebastian.id },
      { parentId: margaux.id, childId: sebastian.id },
      { parentId: alasdair.id, childId: gwendolyn.id },
      { parentId: margaux.id, childId: gwendolyn.id },
      { parentId: cordelia.id, childId: felix.id },
      { parentId: julianHayward.id, childId: felix.id },
      // Gen 3 → Gen 4
      { parentId: sebastian.id, childId: julianVance.id },
      { parentId: evelyn.id, childId: julianVance.id },
      { parentId: sebastian.id, childId: clara.id },
      { parentId: evelyn.id, childId: clara.id },
      { parentId: felix.id, childId: leo.id },
      { parentId: amara.id, childId: leo.id },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // SPOUSAL UNIONS
  // ═══════════════════════════════════════════════════════════

  await prisma.union.createMany({
    data: [
      { partner1Id: archibald.id, partner2Id: beatrice.id },
      { partner1Id: alasdair.id, partner2Id: margaux.id },
      { partner1Id: cordelia.id, partner2Id: julianHayward.id },
      { partner1Id: sebastian.id, partner2Id: evelyn.id },
      { partner1Id: felix.id, partner2Id: amara.id },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`   Tree: "${tree.name}" (${tree.id})`);
  console.log('   14 family members across 4 generations');
  console.log('   16 parent-child relationships');
  console.log('   5 spousal unions');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
