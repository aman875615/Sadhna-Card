import {
  scoreBedTime,
  scoreWakeUpTime,
  scoreDaySleep,
  scoreJapa,
  scoreAttendanceSlot,
  generatePeriodReport,
} from '../src/lib/scoring-engine';

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`✅ PASS: ${testName} => ${actual}`);
  } else {
    console.error(`❌ FAIL: ${testName} => Expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  }
}

console.log('--- TESTING SCORING ENGINE RULES ---');

// Bed Time tests
assertEqual(scoreBedTime('21:55'), 25, 'Bed time 21:55 <= 10:00 PM');
assertEqual(scoreBedTime('22:00'), 25, 'Bed time 22:00 <= 10:00 PM');
assertEqual(scoreBedTime('22:05'), 20, 'Bed time 22:05 <= 10:05 PM');
assertEqual(scoreBedTime('22:10'), 15, 'Bed time 22:10 <= 10:10 PM');
assertEqual(scoreBedTime('22:15'), 10, 'Bed time 22:15 <= 10:15 PM');
assertEqual(scoreBedTime('22:20'), 5, 'Bed time 22:20 <= 10:20 PM');
assertEqual(scoreBedTime('22:25'), 0, 'Bed time 22:25 <= 10:25 PM');
assertEqual(scoreBedTime('22:30'), -5, 'Bed time 22:30 <= 10:30 PM');
assertEqual(scoreBedTime('23:15'), -5, 'Bed time 23:15 > 10:30 PM');

// Wake Up tests
assertEqual(scoreWakeUpTime('03:40'), 25, 'Wake up 03:40 <= 03:45 AM');
assertEqual(scoreWakeUpTime('03:45'), 25, 'Wake up 03:45 <= 03:45 AM');
assertEqual(scoreWakeUpTime('03:50'), 20, 'Wake up 03:50 <= 03:50 AM');
assertEqual(scoreWakeUpTime('03:55'), 15, 'Wake up 03:55 <= 03:55 AM');
assertEqual(scoreWakeUpTime('04:00'), 10, 'Wake up 04:00 <= 04:00 AM');
assertEqual(scoreWakeUpTime('04:05'), 5, 'Wake up 04:05 <= 04:05 AM');
assertEqual(scoreWakeUpTime('04:10'), 0, 'Wake up 04:10 <= 04:10 AM');
assertEqual(scoreWakeUpTime('04:15'), -5, 'Wake up 04:15 <= 04:15 AM');
assertEqual(scoreWakeUpTime('05:00'), -5, 'Wake up 05:00 > 04:15 AM');

// Day Sleep tests
assertEqual(scoreDaySleep(30), 25, 'Day sleep 30 mins <= 60 min');
assertEqual(scoreDaySleep(60), 25, 'Day sleep 60 mins <= 60 min');
assertEqual(scoreDaySleep(70), 20, 'Day sleep 70 mins (25 - 10/2)');
assertEqual(scoreDaySleep(80), 15, 'Day sleep 80 mins (25 - 20/2)');
assertEqual(scoreDaySleep(120), -5, 'Day sleep 120 mins');

// Japa tests
assertEqual(scoreJapa('07:10', 16), 25, 'Japa completed 07:10 <= 07:15 AM');
assertEqual(scoreJapa('08:15', 16), 20, 'Japa completed 08:15 before breakfast');
assertEqual(scoreJapa('10:45', 16), 15, 'Japa completed 10:45 <= 11:00 AM');
assertEqual(scoreJapa('14:15', 16), 10, 'Japa completed 14:15 <= 02:30 PM');
assertEqual(scoreJapa('16:30', 16), 5, 'Japa completed 16:30 <= 05:00 PM');
assertEqual(scoreJapa('18:45', 16), 0, 'Japa completed 18:45 <= 07:00 PM');
assertEqual(scoreJapa('20:30', 16), -5, 'Japa completed 20:30 <= 09:00 PM');

// Attendance tests
assertEqual(scoreAttendanceSlot('ON_TIME'), 5, 'Attendance ON_TIME');
assertEqual(scoreAttendanceSlot('LATE'), 3, 'Attendance LATE');
assertEqual(scoreAttendanceSlot('ABSENT'), 0, 'Attendance ABSENT');
assertEqual(scoreAttendanceSlot('SEVA_EXCUSED'), 5, 'Attendance SEVA_EXCUSED');

console.log('\n--- TESTING INTERVAL REPORT ENGINE (1-14 Sep vs 1-15 Sep) ---');
const dummyUser = {
  id: 'test-user',
  name: 'Test Brahmachari',
  email: 'test@brahmachari.com',
  role: 'BRAHMACHARI',
  cardType: 'BRAHMACHARI_S1' as const,
};

const rep14 = generatePeriodReport(dummyUser, '2026-09-01', '2026-09-14', [
  { userId: 'test-user', date: '2026-09-01', pathanMinutes: 60, sravanMinutes: 60, sevaPreaching: 360 },
]);

assertEqual(rep14.period.totalDays, 14, '14 days interval total days');
assertEqual(rep14.sections.pathan.targetMinutes, 840, '14 days (2 weeks) Pathan target = 2 * 420 = 840 min (14h)');

const rep15 = generatePeriodReport(dummyUser, '2026-09-01', '2026-09-15', []);
assertEqual(rep15.period.totalDays, 15, '15 days interval total days');
assertEqual(rep15.sections.pathan.targetMinutes, 900, '15 days Pathan target = (15/7)*420 = 900 min (15h)');

console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');
