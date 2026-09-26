import { calculateAge } from './src/lib/age/calculate-age';
import { createMemberSchema } from '../../packages/shared/src/validation/member-schema';
import { calcParentChildBezier, calcMarriageLine, getParentAnchor } from './src/lib/edges/bezier-calculator';
import { computeTreeLayout } from './src/lib/layout/elk-layout-engine';
import { mockMembers, mockParentChildEdges, mockUnions } from './src/data/mockTreeData';

async function runTests() {
  console.log('🧪 Starting DL-Genealogy Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Age Calculation Tests
  console.log('1. Age Calculation Engine');
  const deceasedAge = calculateAge('1912-04-18', '1994-11-02', true);
  assert(deceasedAge.text === '1912 – 1994', `Deceased text: ${deceasedAge.text}`);
  assert(deceasedAge.isLiving === false, 'Deceased isLiving is false');
  assert(deceasedAge.sub.includes('82'), `Deceased age was 82: ${deceasedAge.sub}`);

  const livingAge = calculateAge('1975-09-04', null, false);
  assert(livingAge.isLiving === true, 'Living isLiving is true');
  assert(livingAge.sub === 'Born 1975', `Living sub: ${livingAge.sub}`);

  // 2. Bezier Edge Calculator Tests
  console.log('\n2. SVG Bezier Mathematics');
  const pAnchor = { x: 500, y: 300 };
  const cAnchor = { x: 400, y: 600 };
  const bezierPath = calcParentChildBezier(pAnchor, cAnchor);
  assert(bezierPath.startsWith('M 500 300 C 500 450, 400 450, 400 600'), `Bezier curve S-path: ${bezierPath}`);

  const marriage = calcMarriageLine(
    { x: 100, y: 200, width: 270, height: 160 },
    { x: 450, y: 200, width: 270, height: 160 }
  );
  assert(marriage.path === 'M 370 280 L 450 280', `Marriage horizontal line: ${marriage.path}`);
  assert(marriage.midpoint.x === 410 && marriage.midpoint.y === 280, `Marriage ring midpoint: (${marriage.midpoint.x}, ${marriage.midpoint.y})`);

  // 3. Zod Schema Validation Tests
  console.log('\n3. Data Schema & Validation');
  const validMember = {
    firstName: 'Archibald',
    lastName: 'Vance',
    dateOfBirth: '1912-04-18',
    isDeceased: true,
    dateOfDeath: '1994-11-02',
  };
  const validResult = createMemberSchema.safeParse(validMember);
  assert(validResult.success, 'Valid member passes schema validation');

  const invalidDeceased = {
    firstName: 'Ghost',
    lastName: 'Vance',
    dateOfBirth: '1900-01-01',
    isDeceased: true,
    dateOfDeath: null,
  };
  const invalidResult = createMemberSchema.safeParse(invalidDeceased);
  assert(!invalidResult.success, 'Deceased without dateOfDeath is properly rejected');

  const memberWithDataUrl = {
    firstName: 'Julian',
    lastName: 'Vance',
    dateOfBirth: '1988-02-14',
    avatarUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
  };
  const dataUrlResult = createMemberSchema.safeParse(memberWithDataUrl);
  assert(dataUrlResult.success, 'Device uploaded base64 data URL passes schema validation');

  // 4. ELK Layout Engine Tests
  console.log('\n4. ELK Layout Engine Graph Execution');
  console.log(`   Laying out ${mockMembers.length} members across 4 generations...`);
  const layout = await computeTreeLayout(mockMembers, mockParentChildEdges, mockUnions);

  assert(layout.size === mockMembers.length, `All ${mockMembers.length} members positioned: received ${layout.size}`);

  // Verify Gen 1 is at top, Gen 4 is below Gen 3
  const gen1Pos = layout.get('mem_1')!;
  const gen2Pos = layout.get('mem_3')!;
  const gen3Pos = layout.get('mem_7')!;
  const gen4Pos = layout.get('mem_12')!;

  assert(gen1Pos.y < gen2Pos.y, `Gen 1 (${gen1Pos.y}) is above Gen 2 (${gen2Pos.y})`);
  assert(gen2Pos.y < gen3Pos.y, `Gen 2 (${gen2Pos.y}) is above Gen 3 (${gen3Pos.y})`);
  assert(gen3Pos.y < gen4Pos.y, `Gen 3 (${gen3Pos.y}) is above Gen 4 (${gen4Pos.y})`);

  // Verify spouses are side-by-side on same horizontal row
  const archibald = layout.get('mem_1')!;
  const beatrice = layout.get('mem_2')!;
  assert(Math.abs(archibald.y - beatrice.y) < 5, `Spouses Archibald & Beatrice on same Y level: ${archibald.y} vs ${beatrice.y}`);

  // 5. Multi-Wife (Polygyny) Clustering & Linkage Tests
  console.log('\n5. Multi-Wife (Polygyny) Clustering & Linkage Tests');
  const polyMembers: any[] = [
    { id: 'lawan', firstName: 'Lawan', lastName: 'Dalhatu', gender: 'male', generation: 1, branch: 'paternal' },
    { id: 'rahmatu', firstName: 'Rahmatu', lastName: 'Lawan', gender: 'female', generation: 1, branch: 'paternal' },
    { id: 'fatima', firstName: 'Fatima', lastName: 'Lawan', gender: 'female', generation: 1, branch: 'paternal' },
    { id: 'dalha', firstName: 'Dalha', lastName: 'Lawan', gender: 'male', generation: 2, branch: 'paternal' },
    { id: 'rukayya', firstName: 'Rukayya', lastName: 'Lawan', gender: 'female', generation: 2, branch: 'paternal' },
  ];
  const polyUnions: any[] = [
    { id: 'u_lr', partner1Id: 'lawan', partner2Id: 'rahmatu', unionType: 'marriage' },
    { id: 'u_lf', partner1Id: 'lawan', partner2Id: 'fatima', unionType: 'marriage' },
  ];
  const polyEdges: any[] = [
    { id: 'pc_ld', parentId: 'lawan', childId: 'dalha' },
    { id: 'pc_rd', parentId: 'rahmatu', childId: 'dalha' },
    { id: 'pc_lr', parentId: 'lawan', childId: 'rukayya' },
    { id: 'pc_fr', parentId: 'fatima', childId: 'rukayya' },
  ];

  const polyLayout = await computeTreeLayout(polyMembers, polyEdges, polyUnions);
  const pLawan = polyLayout.get('lawan')!;
  const pRahmatu = polyLayout.get('rahmatu')!;
  const pFatima = polyLayout.get('fatima')!;
  const pDalha = polyLayout.get('dalha')!;
  const pRukayya = polyLayout.get('rukayya')!;

  assert(Boolean(pLawan && pRahmatu && pFatima), 'All parents positioned in multi-wife family');
  assert(pRahmatu.x < pLawan.x && pLawan.x < pFatima.x, `Husband Lawan centered between Wife 1 & Wife 2: Rahmatu (${pRahmatu.x}) < Lawan (${pLawan.x}) < Fatima (${pFatima.x})`);

  // Verify marriage lines and midpoints
  const m1 = calcMarriageLine(pRahmatu, pLawan);
  const m2 = calcMarriageLine(pLawan, pFatima);
  assert(m1.midpoint.x > pRahmatu.x + pRahmatu.width && m1.midpoint.x < pLawan.x, `Marriage 1 ring is strictly in gap between Rahmatu & Lawan: ${m1.midpoint.x}`);
  assert(m2.midpoint.x > pLawan.x + pLawan.width && m2.midpoint.x < pFatima.x, `Marriage 2 ring is strictly in gap between Lawan & Fatima: ${m2.midpoint.x}`);

  // Verify children positioning aligns with their respective mothers
  assert(pDalha.x < pRukayya.x, `Wife 1 child Dalha (${pDalha.x}) is positioned to the left of Wife 2 child Rukayya (${pRukayya.x})`);

  // Verify non-adjacent marriage bridge under-card routing
  const nonAdjacent = calcMarriageLine(
    { x: 100, y: 12, width: 270, height: 160 },
    { x: 800, y: 12, width: 270, height: 160 }
  );
  assert(nonAdjacent.midpoint.y > 12 + 160, `Non-adjacent spousal curve dips cleanly below cards: apex Y is ${nonAdjacent.midpoint.y}`);

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
