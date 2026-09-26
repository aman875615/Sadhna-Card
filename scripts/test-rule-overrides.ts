import { prisma } from '../src/lib/prisma';
import {
  DEFAULT_RULE_DEFINITIONS,
  calculateAllowedRange,
  validateRuleOverrideInput,
  verifyOverridePermission,
  getEffectiveSadhanaRulesForDate,
  getEffectiveSadhanaRulesForRange,
} from '../src/lib/rule-override-engine';
import { evaluateDailyEntry, generatePeriodReport } from '../src/lib/scoring-engine';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING HIERARCHICAL SADHANA RULE OVERRIDE TEST SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // ------------------------------------------------------------------------
  // TEST 1: Default Rule Configurations & Boundaries
  // ------------------------------------------------------------------------
  console.log('\n--- 1. Testing Default Rules & Allowed Deviation Ranges ---');
  const bedDef = DEFAULT_RULE_DEFINITIONS.BED_TIME;
  const studentBedBounds = calculateAllowedRange(bedDef, 'STUDENT');
  assert(studentBedBounds.defaultVal === '22:00', 'Student Bed Time default is 22:00 (10:00 PM)');
  assert(studentBedBounds.min === '21:30' && studentBedBounds.max === '22:30', 'Student Bed Time allowed deviation is [21:30 - 22:30]');

  const wakeDef = DEFAULT_RULE_DEFINITIONS.WAKE_UP_TIME;
  const bWakeBounds = calculateAllowedRange(wakeDef, 'BRAHMACHARI');
  assert(bWakeBounds.defaultVal === '03:45', 'Brahmachari Wake Up default is 03:45 AM');

  // ------------------------------------------------------------------------
  // TEST 2: Strict Deviation Limits Enforcement
  // ------------------------------------------------------------------------
  console.log('\n--- 2. Testing Deviation Boundary Validation ---');
  // Valid Bed Time override (22:15 is within 21:30 - 22:30)
  const validBedRes = validateRuleOverrideInput(
    bedDef,
    'STUDENT',
    '22:15',
    '2026-10-01',
    '2026-10-15',
    'Exam preparation schedule'
  );
  assert(validBedRes.isValid === true, 'Validation passes for 22:15 (within bounds)');

  // Invalid Bed Time override (23:30 is WAY beyond 22:30)
  const invalidBedRes = validateRuleOverrideInput(
    bedDef,
    'STUDENT',
    '23:30',
    '2026-10-01',
    '2026-10-15',
    'Late night gaming'
  );
  assert(invalidBedRes.isValid === false, 'Validation rejects 23:30 (exceeds max deviation)');

  // Missing reason
  const noReasonRes = validateRuleOverrideInput(
    bedDef,
    'STUDENT',
    '22:15',
    '2026-10-01',
    '2026-10-15',
    ''
  );
  assert(noReasonRes.isValid === false, 'Validation rejects override without mandatory reason');

  // ------------------------------------------------------------------------
  // TEST 3: Backend Security & Ownership Verification
  // ------------------------------------------------------------------------
  console.log('\n--- 3. Testing Role-Based Hierarchy Authorization ---');

  // Find or create mock users for testing hierarchy
  let counsellorA = await prisma.user.findFirst({ where: { role: 'COUNSELLOR' } });
  let brahmachariA = await prisma.user.findFirst({ where: { role: 'BRAHMACHARI' } });
  let studentA = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

  if (counsellorA && brahmachariA) {
    // Counsellor modifying their own Brahmachari
    await prisma.user.update({
      where: { id: brahmachariA.id },
      data: { counsellorId: counsellorA.id },
    });

    const cAuthPerm = await verifyOverridePermission(
      { id: counsellorA.id, role: 'COUNSELLOR' },
      brahmachariA.id
    );
    assert(cAuthPerm.allowed === true, 'Counsellor is authorized to customize their assigned Brahmachari');

    // Brahmachari trying to customize another user who is NOT their student
    if (studentA) {
      await prisma.user.update({
        where: { id: studentA.id },
        data: { preacherId: '65f000000000000000000000' }, // Different preacher
      });

      const unauthB = await verifyOverridePermission(
        { id: brahmachariA.id, role: 'BRAHMACHARI' },
        studentA.id
      );
      assert(unauthB.allowed === false, 'Brahmachari CANNOT modify student assigned to another preacher (403)');
    }

    // Student trying to customize rules
    if (studentA) {
      const studentPerm = await verifyOverridePermission(
        { id: studentA.id, role: 'STUDENT' },
        studentA.id
      );
      assert(studentPerm.allowed === false, 'Student CANNOT modify rules (403 Forbidden)');
    }
  }

  // ------------------------------------------------------------------------
  // TEST 4: Date-Range Effective Rule Resolution
  // ------------------------------------------------------------------------
  console.log('\n--- 4. Testing Date-Range & Historical Override Resolution ---');

  if (studentA && brahmachariA) {
    // Assign studentA to brahmachariA
    await prisma.user.update({
      where: { id: studentA.id },
      data: { preacherId: brahmachariA.id },
    });

    // Clean up test overrides
    await prisma.sadhanaRuleOverride.deleteMany({
      where: { targetUserId: studentA.id },
    });

    // Create a temporary override for studentA:
    // Bed Time 22:15 from 2026-09-05 to 2026-09-10
    const ovr = await prisma.sadhanaRuleOverride.create({
      data: {
        ruleKey: 'BED_TIME',
        targetUserId: studentA.id,
        targetRole: 'STUDENT',
        createdById: brahmachariA.id,
        createdByRole: 'BRAHMACHARI',
        originalValue: '22:00',
        overrideValue: '22:15',
        reason: 'Temporary study schedule',
        effectiveFrom: '2026-09-05',
        effectiveUntil: '2026-09-10',
        status: 'ACTIVE',
      },
    });

    // Test date before override: 2026-09-01 -> Should be default 22:00
    const dayBefore = await getEffectiveSadhanaRulesForDate(studentA.id, 'STUDENT', '2026-09-01');
    assert(dayBefore.bedTime === '22:00', 'Date before override (2026-09-01) resolves to global default 22:00');

    // Test date during override: 2026-09-07 -> Should be 22:15
    const dayDuring = await getEffectiveSadhanaRulesForDate(studentA.id, 'STUDENT', '2026-09-07');
    assert(dayDuring.bedTime === '22:15', 'Date within override window (2026-09-07) resolves to custom 22:15');

    // Test date after override expires: 2026-09-15 -> Should revert to default 22:00
    const dayAfter = await getEffectiveSadhanaRulesForDate(studentA.id, 'STUDENT', '2026-09-15');
    assert(dayAfter.bedTime === '22:00', 'Date after override expiry (2026-09-15) automatically reverts to default 22:00');

    // ------------------------------------------------------------------------
    // TEST 5: Date-Range Scoring Calculation Accuracy
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Testing Interval Report Scoring Engine Integration ---');

    // Suppose devotee went to bed at 22:12 on all three days:
    // On 2026-09-01 (default target 22:00): 22:12 is +12m (between +10 and +15) -> 10 marks
    // On 2026-09-07 (override target 22:15): 22:12 is <= target 22:15 -> 25 marks (Full marks!)
    // On 2026-09-15 (default target 22:00): 22:12 is +12m (between +10 and +15) -> 10 marks
    const evalDay1 = evaluateDailyEntry({ sleepBedTime: '22:12' }, 'STUDENT_S2', '2026-09-01', dayBefore);
    const evalDay2 = evaluateDailyEntry({ sleepBedTime: '22:12' }, 'STUDENT_S2', '2026-09-07', dayDuring);
    const evalDay3 = evaluateDailyEntry({ sleepBedTime: '22:12' }, 'STUDENT_S2', '2026-09-15', dayAfter);

    assert(evalDay1.scores.bedTime.marks === 10, 'Day 1 (default 22:00) scores 10/25 pts for 22:12 sleep time');
    assert(evalDay2.scores.bedTime.marks === 25, 'Day 2 (override 22:15) scores 25/25 pts for 22:12 sleep time');
    assert(evalDay3.scores.bedTime.marks === 10, 'Day 3 (reverted default 22:00) scores 10/25 pts for 22:12 sleep time');

    // Generate Period Report across 2026-09-01 to 2026-09-15
    const rulesRange = await getEffectiveSadhanaRulesForRange(studentA.id, 'STUDENT', '2026-09-01', '2026-09-15');
    const periodReport = generatePeriodReport(
      {
        id: studentA.id,
        name: studentA.name,
        email: studentA.email,
        role: 'STUDENT',
        cardType: 'STUDENT_S2',
      },
      '2026-09-01',
      '2026-09-15',
      [
        { date: '2026-09-01', sleepBedTime: '22:12' },
        { date: '2026-09-07', sleepBedTime: '22:12' },
        { date: '2026-09-15', sleepBedTime: '22:12' },
      ],
      rulesRange
    );

    assert(periodReport.hasCustomOverrides === true, 'Period report recognizes custom override active during interval');
    assert(periodReport.dailyBreakdown.length === 15, 'Period report generated continuous 15-day interval');

    // Clean up test override
    await prisma.sadhanaRuleOverride.delete({ where: { id: ovr.id } });
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
