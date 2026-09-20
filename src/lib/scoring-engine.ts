/**
 * Sadhana Card Scoring Engine
 * Directly derived from Excel sheets:
 * 1. sadhana Card_Brahamcharis.xls (S1)
 * 2. sadhana Card_bace.xls (S2)
 *
 * Source of Truth: Raw time and activity data.
 * All points and percentages are computed on the fly.
 */

export type CardType = 'BRAHMACHARI_S1' | 'STUDENT_S2';

export interface RawSadhanaEntry {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sleepBedTime?: string | null; // HH:mm (24-hr)
  wakeUpTime?: string | null; // HH:mm (24-hr)
  daySleepMinutes?: number | null;
  japaCompletionTime?: string | null; // HH:mm (24-hr)
  japaRoundsCount?: number | null;
  mangalAarti?: string | null; // ON_TIME, LATE, ABSENT, SEVA_EXCUSED
  guruPuja?: string | null; // ON_TIME, LATE, ABSENT, SEVA_EXCUSED
  sbClass?: string | null; // ON_TIME, LATE, ABSENT, SEVA_EXCUSED
  prasadam?: string | null; // ON_TIME, LATE, ABSENT, SEVA_EXCUSED
  pathanMinutes?: number | null;
  pathanBookName?: string | null;
  sravanMinutes?: number | null;
  sravanLectureTopic?: string | null;
  officeOutTime?: string | null;
  officeInTime?: string | null;
  sevaPreaching?: number | null;
  sevaManagement?: number | null;
  sevaLecturePrep?: number | null;
  sevaMenial?: number | null;
  sevaHarinamBook?: number | null;
  sevaAdhocTravel?: number | null;
  sevaMisc?: number | null;
  sevaNotes?: string | null;
  bhavanaNegativeTags?: string | null; // JSON string e.g. '["E", "M"]'
  bhavanaPositiveTags?: string | null; // JSON string e.g. '["NTU", "D"]'
  personalNotes?: string | null;
}

export interface DailyScoredResult {
  date: string;
  isSubmitted: boolean;
  raw: Partial<RawSadhanaEntry>;
  scores: {
    bedTime: { raw: string | null; marks: number; maxMarks: number };
    wakeUp: { raw: string | null; marks: number; maxMarks: number };
    daySleep: { rawMinutes: number; marks: number; maxMarks: number };
    nidraTotal: { marks: number; maxMarks: number; percentage: number };
    japa: { rawTime: string | null; rounds: number; marks: number; maxMarks: number; percentage: number };
    attendance: {
      mangalAarti: { status: string; marks: number; maxMarks: number };
      guruPuja?: { status: string; marks: number; maxMarks: number };
      sbClass: { status: string; marks: number; maxMarks: number };
      prasadam: { status: string; marks: number; maxMarks: number };
      totalMarks: number;
      maxMarks: number;
      percentage: number;
    };
    pathan: { actualMinutes: number; targetDailyMinutes: number; bookName?: string };
    sravan: { actualMinutes: number; targetDailyMinutes: number; topic?: string };
    seva: {
      totalMinutes: number;
      targetDailyMinutes: number;
      breakdown: {
        preaching: number;
        management: number;
        lecturePrep: number;
        menial: number;
        harinamBook: number;
        adhocTravel: number;
        misc: number;
      };
      notes?: string;
    };
    sevaBhavana: {
      negativeTags: string[];
      positiveTags: string[];
      notes?: string;
    };
    dailyOverallPercentage: number;
  };
}

export interface SectionReport {
  section: string;
  title: string;
  daysExpected: number;
  daysSubmitted: number;
  daysMissing: number;
  obtainedMarks?: number;
  maximumMarks?: number;
  actualMinutes?: number;
  targetMinutes?: number;
  percentage: number;
  statusGrade?: string;
}

export interface PeriodReport {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    cardType: CardType;
    counsellorName?: string;
    preacherName?: string;
  };
  period: {
    from: string;
    to: string;
    totalDays: number;
    submittedDays: number;
    missingDays: number;
    targetMode: 'PROPORTIONAL_TO_DAYS' | 'CALENDAR_WEEK';
  };
  sections: {
    nidra: SectionReport;
    japa: SectionReport;
    attendance: SectionReport;
    pathan: SectionReport;
    sravan: SectionReport;
    seva: SectionReport;
    sevaBhavana: {
      daysWithLogs: number;
      topNegativeTags: { tag: string; count: number }[];
      topPositiveTags: { tag: string; count: number }[];
    };
  };
  overall: {
    overallPercentage: number;
    gradeBand: 'High Honors' | 'Honors' | 'Distinction' | 'First Class' | 'Pass' | 'Needs Improvement';
    totalObtainedMarks: number;
    totalMaxMarks: number;
  };
  dailyBreakdown: DailyScoredResult[];
}

/**
 * Converts "HH:mm" into total minutes from midnight (0 to 1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * 1. NIDRA - To Bed scoring
 * Thresholds (24h format):
 * <= 22:00 (10:00 PM) -> 25
 * <= 22:05 (10:05 PM) -> 20
 * <= 22:10 (10:10 PM) -> 15
 * <= 22:15 (10:15 PM) -> 10
 * <= 22:20 (10:20 PM) -> 5
 * <= 22:25 (10:25 PM) -> 0
 * <= 22:30 (10:30 PM) -> -5
 * > 22:30 -> -5
 */
export function scoreBedTime(timeStr?: string | null): number {
  const min = parseTimeToMinutes(timeStr);
  if (min === null) return 0;

  // If devotee slept earlier in the evening, e.g. 21:00 (9 PM) -> 25 marks
  // If devotee slept before 12:00 noon next day (meaning late night 23:00 or 01:00 AM)
  let normalizedMin = min;
  if (min < 12 * 60) {
    // E.g. 00:30 AM is 24*60 + 30 = 1470 minutes
    normalizedMin = min + 24 * 60;
  }

  const t10pm = 22 * 60; // 1320
  if (normalizedMin <= t10pm) return 25;
  if (normalizedMin <= t10pm + 5) return 20;
  if (normalizedMin <= t10pm + 10) return 15;
  if (normalizedMin <= t10pm + 15) return 10;
  if (normalizedMin <= t10pm + 20) return 5;
  if (normalizedMin <= t10pm + 25) return 0;
  return -5;
}

/**
 * 2. NIDRA - Wake Up scoring
 * Thresholds:
 * <= 03:45 AM -> 25
 * <= 03:50 AM -> 20
 * <= 03:55 AM -> 15
 * <= 04:00 AM -> 10
 * <= 04:05 AM -> 5
 * <= 04:10 AM -> 0
 * <= 04:15 AM -> -5
 * > 04:15 AM -> -5
 */
export function scoreWakeUpTime(timeStr?: string | null): number {
  const min = parseTimeToMinutes(timeStr);
  if (min === null) return 0;

  const t345 = 3 * 60 + 45; // 225
  if (min <= t345) return 25;
  if (min <= 3 * 60 + 50) return 20;
  if (min <= 3 * 60 + 55) return 15;
  if (min <= 4 * 60 + 0) return 10;
  if (min <= 4 * 60 + 5) return 5;
  if (min <= 4 * 60 + 10) return 0;
  return -5;
}

/**
 * 3. NIDRA - Day Sleep scoring
 * Rule: 60 min or less = 25 marks.
 * For every minute beyond 60 min reduce 1 mark / 2 min from 25.
 */
export function scoreDaySleep(actualMinutes?: number | null): number {
  const minutes = actualMinutes || 0;
  if (minutes <= 60) return 25;
  const extraMinutes = minutes - 60;
  const reduction = Math.floor(extraMinutes / 2);
  return Math.max(-5, 25 - reduction);
}

/**
 * 4. JAPA scoring
 * Rules:
 * Before 7:15 AM -> 25
 * Before Breakfast (~8:30 AM / 08:30) -> 20
 * Before 11:00 AM -> 15
 * Before 1:00 PM (13:00) -> 15
 * Before 2:30 PM (14:30) -> 10
 * Before 5:00 PM (17:00) -> 5
 * Before 7:00 PM (19:00) -> 0
 * Before 9:00 PM (21:00) -> -5
 * > 21:00 or incomplete -> -5
 */
export function scoreJapa(timeStr?: string | null, roundsCount: number = 16): number {
  if (roundsCount < 16 && roundsCount > 0) {
    // Proportional or minimum penalty
    return Math.max(-5, Math.round((roundsCount / 16) * 10) - 5);
  }
  const min = parseTimeToMinutes(timeStr);
  if (min === null) return 0;

  if (min <= 7 * 60 + 15) return 25;
  if (min <= 8 * 60 + 30) return 20;
  if (min <= 11 * 60 + 0) return 15;
  if (min <= 13 * 60 + 0) return 15;
  if (min <= 14 * 60 + 30) return 10;
  if (min <= 17 * 60 + 0) return 5;
  if (min <= 19 * 60 + 0) return 0;
  return -5;
}

/**
 * 5. Attendance Slot scoring
 * ON_TIME = 5, LATE = 3, ABSENT = 0, SEVA_EXCUSED = 5
 */
export function scoreAttendanceSlot(status?: string | null): number {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'ON_TIME' || s === 'PRESENT' || s === 'SEVA_EXCUSED') return 5;
  if (s === 'LATE') return 3;
  return 0;
}

/**
 * Section Target Configurations
 */
export const TARGET_CONFIG = {
  BRAHMACHARI_S1: {
    weeklyPathanMinutes: 7 * 60, // 420 mins = 7 hrs/week
    weeklySravanMinutes: 7 * 60, // 420 mins = 7 hrs/week
    weeklySevaMinutes: 42 * 60, // 2520 mins = 42 hrs/week
    dailyMaxMarks: {
      bedTime: 25,
      wakeUp: 25,
      daySleep: 25,
      japa: 25,
      attendance: 20, // 4 slots * 5
    },
    slots: ['mangalAarti', 'guruPuja', 'sbClass', 'prasadam'] as const,
  },
  STUDENT_S2: {
    weeklyPathanMinutes: 3.5 * 60, // 210 mins = 3.5 hrs/week
    weeklySravanMinutes: 3.5 * 60, // 210 mins = 3.5 hrs/week
    weeklySevaMinutes: 6 * 60, // 360 mins = 6 hrs/week (3h preaching + 3h bace)
    dailyMaxMarks: {
      bedTime: 25,
      wakeUp: 25,
      daySleep: 25,
      japa: 25,
      attendance: 15, // 3 slots * 5
    },
    slots: ['mangalAarti', 'sbClass', 'prasadam'] as const,
  },
};

/**
 * Evaluates a single day's raw Sadhana entry and calculates derived scores.
 */
export function evaluateDailyEntry(
  entry: Partial<RawSadhanaEntry>,
  cardType: CardType = 'BRAHMACHARI_S1',
  dateStr: string
): DailyScoredResult {
  const isSubmitted = Boolean(
    entry.sleepBedTime ||
      entry.wakeUpTime ||
      entry.daySleepMinutes !== undefined ||
      entry.japaCompletionTime ||
      entry.mangalAarti ||
      entry.pathanMinutes ||
      entry.sravanMinutes ||
      entry.sevaPreaching
  );

  const cfg = TARGET_CONFIG[cardType];
  const targetDailyPathan = Math.round(cfg.weeklyPathanMinutes / 7);
  const targetDailySravan = Math.round(cfg.weeklySravanMinutes / 7);
  const targetDailySeva = Math.round(cfg.weeklySevaMinutes / 7);

  // Nidra scores
  const bedTimeMarks = entry.sleepBedTime ? scoreBedTime(entry.sleepBedTime) : 0;
  const wakeUpMarks = entry.wakeUpTime ? scoreWakeUpTime(entry.wakeUpTime) : 0;
  const daySleepMarks = entry.daySleepMinutes !== undefined && entry.daySleepMinutes !== null
    ? scoreDaySleep(entry.daySleepMinutes)
    : 0;

  const nidraObtained = bedTimeMarks + wakeUpMarks + daySleepMarks;
  const nidraMax = 75; // 25 + 25 + 25
  const nidraPercentage = isSubmitted ? Math.max(0, Math.min(100, Math.round((nidraObtained / nidraMax) * 1000) / 10)) : 0;

  // Japa score
  const japaMarks = entry.japaCompletionTime
    ? scoreJapa(entry.japaCompletionTime, entry.japaRoundsCount || 16)
    : 0;
  const japaPercentage = isSubmitted ? Math.max(0, Math.min(100, Math.round((japaMarks / 25) * 1000) / 10)) : 0;

  // Attendance score
  const maMarks = scoreAttendanceSlot(entry.mangalAarti);
  const sbMarks = scoreAttendanceSlot(entry.sbClass);
  const prMarks = scoreAttendanceSlot(entry.prasadam);
  const gpMarks = cardType === 'BRAHMACHARI_S1' ? scoreAttendanceSlot(entry.guruPuja) : 0;

  const attendanceObtained = maMarks + sbMarks + prMarks + (cardType === 'BRAHMACHARI_S1' ? gpMarks : 0);
  const attendanceMax = cfg.dailyMaxMarks.attendance;
  const attendancePercentage = isSubmitted
    ? Math.max(0, Math.min(100, Math.round((attendanceObtained / attendanceMax) * 1000) / 10))
    : 0;

  // Seva Breakdown sum
  const totalSevaMinutes =
    (entry.sevaPreaching || 0) +
    (entry.sevaManagement || 0) +
    (entry.sevaLecturePrep || 0) +
    (entry.sevaMenial || 0) +
    (entry.sevaHarinamBook || 0) +
    (entry.sevaAdhocTravel || 0) +
    (entry.sevaMisc || 0);

  // Parsing Bhavana tags
  let negTags: string[] = [];
  let posTags: string[] = [];
  try {
    if (entry.bhavanaNegativeTags) negTags = JSON.parse(entry.bhavanaNegativeTags);
  } catch {}
  try {
    if (entry.bhavanaPositiveTags) posTags = JSON.parse(entry.bhavanaPositiveTags);
  } catch {}

  // Daily Overall % based on available scored categories
  // Categories: Nidra (75), Japa (25), Attendance (15 or 20), Pathan ratio, Sravan ratio, Seva ratio
  const pathanPct = targetDailyPathan > 0 ? Math.min(100, ((entry.pathanMinutes || 0) / targetDailyPathan) * 100) : 100;
  const sravanPct = targetDailySravan > 0 ? Math.min(100, ((entry.sravanMinutes || 0) / targetDailySravan) * 100) : 100;
  const sevaPct = targetDailySeva > 0 ? Math.min(100, (totalSevaMinutes / targetDailySeva) * 100) : 100;

  const dailyOverallPercentage = isSubmitted
    ? Math.round(
        (nidraPercentage * 0.25 +
          japaPercentage * 0.25 +
          attendancePercentage * 0.2 +
          pathanPct * 0.1 +
          sravanPct * 0.1 +
          sevaPct * 0.1) *
          10
      ) / 10
    : 0;

  return {
    date: dateStr,
    isSubmitted,
    raw: entry,
    scores: {
      bedTime: { raw: entry.sleepBedTime || null, marks: bedTimeMarks, maxMarks: 25 },
      wakeUp: { raw: entry.wakeUpTime || null, marks: wakeUpMarks, maxMarks: 25 },
      daySleep: { rawMinutes: entry.daySleepMinutes || 0, marks: daySleepMarks, maxMarks: 25 },
      nidraTotal: { marks: nidraObtained, maxMarks: nidraMax, percentage: nidraPercentage },
      japa: {
        rawTime: entry.japaCompletionTime || null,
        rounds: entry.japaRoundsCount || 16,
        marks: japaMarks,
        maxMarks: 25,
        percentage: japaPercentage,
      },
      attendance: {
        mangalAarti: { status: entry.mangalAarti || 'ABSENT', marks: maMarks, maxMarks: 5 },
        ...(cardType === 'BRAHMACHARI_S1'
          ? { guruPuja: { status: entry.guruPuja || 'ABSENT', marks: gpMarks, maxMarks: 5 } }
          : {}),
        sbClass: { status: entry.sbClass || 'ABSENT', marks: sbMarks, maxMarks: 5 },
        prasadam: { status: entry.prasadam || 'ABSENT', marks: prMarks, maxMarks: 5 },
        totalMarks: attendanceObtained,
        maxMarks: attendanceMax,
        percentage: attendancePercentage,
      },
      pathan: {
        actualMinutes: entry.pathanMinutes || 0,
        targetDailyMinutes: targetDailyPathan,
        bookName: entry.pathanBookName || undefined,
      },
      sravan: {
        actualMinutes: entry.sravanMinutes || 0,
        targetDailyMinutes: targetDailySravan,
        topic: entry.sravanLectureTopic || undefined,
      },
      seva: {
        totalMinutes: totalSevaMinutes,
        targetDailyMinutes: targetDailySeva,
        breakdown: {
          preaching: entry.sevaPreaching || 0,
          management: entry.sevaManagement || 0,
          lecturePrep: entry.sevaLecturePrep || 0,
          menial: entry.sevaMenial || 0,
          harinamBook: entry.sevaHarinamBook || 0,
          adhocTravel: entry.sevaAdhocTravel || 0,
          misc: entry.sevaMisc || 0,
        },
        notes: entry.sevaNotes || undefined,
      },
      sevaBhavana: {
        negativeTags: Array.isArray(negTags) ? negTags : [],
        positiveTags: Array.isArray(posTags) ? posTags : [],
        notes: entry.personalNotes || undefined,
      },
      dailyOverallPercentage,
    },
  };
}

/**
 * Calculates grade band according to Excel rules
 */
export function getGradeBand(percentage: number): 'High Honors' | 'Honors' | 'Distinction' | 'First Class' | 'Pass' | 'Needs Improvement' {
  if (percentage >= 100) return 'High Honors';
  if (percentage >= 95) return 'Honors';
  if (percentage >= 90) return 'Distinction';
  if (percentage >= 85) return 'First Class';
  if (percentage >= 80) return 'Pass';
  return 'Needs Improvement';
}

/**
 * Generates an interval-aware report for any arbitrary date range (e.g. from 2026-09-01 to 2026-09-15).
 */
export function generatePeriodReport(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    cardType: CardType;
    counsellorName?: string;
    preacherName?: string;
  },
  fromDate: string, // YYYY-MM-DD
  toDate: string, // YYYY-MM-DD
  entries: Partial<RawSadhanaEntry>[]
): PeriodReport {
  const cardType = user.cardType || 'BRAHMACHARI_S1';
  const cfg = TARGET_CONFIG[cardType];

  // Build entry map by date
  const entryMap = new Map<string, Partial<RawSadhanaEntry>>();
  for (const e of entries) {
    if (e.date) entryMap.set(e.date, e);
  }

  // Generate continuous list of dates between from and to (inclusive)
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.max(1, daysDiff);

  const dailyBreakdown: DailyScoredResult[] = [];
  let submittedDaysCount = 0;

  // Cumulative totals
  let totalNidraMarks = 0;
  let maxNidraMarks = 0;

  let totalJapaMarks = 0;
  let maxJapaMarks = 0;

  let totalAttendanceMarks = 0;
  let maxAttendanceMarks = 0;

  let totalPathanMinutes = 0;
  let totalSravanMinutes = 0;
  let totalSevaMinutes = 0;

  const negativeTagFreq = new Map<string, number>();
  const positiveTagFreq = new Map<string, number>();
  let bhavanaLogsCount = 0;

  for (let i = 0; i < totalDays; i++) {
    const currDate = new Date(start);
    currDate.setDate(currDate.getDate() + i);
    const dateStr = currDate.toISOString().split('T')[0];

    const rawEntry = entryMap.get(dateStr) || { userId: user.id, date: dateStr };
    const evaluated = evaluateDailyEntry(rawEntry, cardType, dateStr);
    dailyBreakdown.push(evaluated);

    if (evaluated.isSubmitted) {
      submittedDaysCount++;
    }

    // Accumulate marks
    totalNidraMarks += evaluated.scores.nidraTotal.marks;
    maxNidraMarks += evaluated.scores.nidraTotal.maxMarks;

    totalJapaMarks += evaluated.scores.japa.marks;
    maxJapaMarks += evaluated.scores.japa.maxMarks;

    totalAttendanceMarks += evaluated.scores.attendance.totalMarks;
    maxAttendanceMarks += evaluated.scores.attendance.maxMarks;

    totalPathanMinutes += evaluated.scores.pathan.actualMinutes;
    totalSravanMinutes += evaluated.scores.sravan.actualMinutes;
    totalSevaMinutes += evaluated.scores.seva.totalMinutes;

    if (evaluated.scores.sevaBhavana.negativeTags.length > 0 || evaluated.scores.sevaBhavana.positiveTags.length > 0) {
      bhavanaLogsCount++;
      evaluated.scores.sevaBhavana.negativeTags.forEach((t) =>
        negativeTagFreq.set(t, (negativeTagFreq.get(t) || 0) + 1)
      );
      evaluated.scores.sevaBhavana.positiveTags.forEach((t) =>
        positiveTagFreq.set(t, (positiveTagFreq.get(t) || 0) + 1)
      );
    }
  }

  const missingDays = totalDays - submittedDaysCount;

  // Interval-aware weekly target scaling: (totalDays / 7) * weekly target
  const targetPathanMinutes = Math.round((totalDays / 7) * cfg.weeklyPathanMinutes);
  const targetSravanMinutes = Math.round((totalDays / 7) * cfg.weeklySravanMinutes);
  const targetSevaMinutes = Math.round((totalDays / 7) * cfg.weeklySevaMinutes);

  // Section Percentages
  const nidraPct = maxNidraMarks > 0 ? Math.max(0, Math.min(100, Math.round((totalNidraMarks / maxNidraMarks) * 1000) / 10)) : 0;
  const japaPct = maxJapaMarks > 0 ? Math.max(0, Math.min(100, Math.round((totalJapaMarks / maxJapaMarks) * 1000) / 10)) : 0;
  const attendancePct =
    maxAttendanceMarks > 0 ? Math.max(0, Math.min(100, Math.round((totalAttendanceMarks / maxAttendanceMarks) * 1000) / 10)) : 0;
  const pathanPct =
    targetPathanMinutes > 0 ? Math.min(100, Math.round((totalPathanMinutes / targetPathanMinutes) * 1000) / 10) : 100;
  const sravanPct =
    targetSravanMinutes > 0 ? Math.min(100, Math.round((totalSravanMinutes / targetSravanMinutes) * 1000) / 10) : 100;
  const sevaPct =
    targetSevaMinutes > 0 ? Math.min(100, Math.round((totalSevaMinutes / targetSevaMinutes) * 1000) / 10) : 100;

  // Overall Weighted Score:
  // Nidra: 25%, Japa: 25%, Attendance: 20%, Pathan: 10%, Sravan: 10%, Seva: 10%
  const overallPercentage = Math.round(
    (nidraPct * 0.25 +
      japaPct * 0.25 +
      attendancePct * 0.2 +
      pathanPct * 0.1 +
      sravanPct * 0.1 +
      sevaPct * 0.1) *
      10
  ) / 10;

  const topNeg = Array.from(negativeTagFreq.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const topPos = Array.from(positiveTagFreq.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return {
    user,
    period: {
      from: fromDate,
      to: toDate,
      totalDays,
      submittedDays: submittedDaysCount,
      missingDays,
      targetMode: 'PROPORTIONAL_TO_DAYS',
    },
    sections: {
      nidra: {
        section: 'NIDRA',
        title: 'Nidra (Bed Time, Wake Up, Day Sleep)',
        daysExpected: totalDays,
        daysSubmitted: submittedDaysCount,
        daysMissing: missingDays,
        obtainedMarks: totalNidraMarks,
        maximumMarks: maxNidraMarks,
        percentage: nidraPct,
        statusGrade: getGradeBand(nidraPct),
      },
      japa: {
        section: 'JAPA',
        title: 'Holy Name Japa Meditation',
        daysExpected: totalDays,
        daysSubmitted: submittedDaysCount,
        daysMissing: missingDays,
        obtainedMarks: totalJapaMarks,
        maximumMarks: maxJapaMarks,
        percentage: japaPct,
        statusGrade: getGradeBand(japaPct),
      },
      attendance: {
        section: 'ATTENDANCE',
        title: 'Temple Program Attendance',
        daysExpected: totalDays,
        daysSubmitted: submittedDaysCount,
        daysMissing: missingDays,
        obtainedMarks: totalAttendanceMarks,
        maximumMarks: maxAttendanceMarks,
        percentage: attendancePct,
        statusGrade: getGradeBand(attendancePct),
      },
      pathan: {
        section: 'PATHAN',
        title: 'Scriptural Reading (Pathan)',
        daysExpected: totalDays,
        daysSubmitted: submittedDaysCount,
        daysMissing: missingDays,
        actualMinutes: totalPathanMinutes,
        targetMinutes: targetPathanMinutes,
        percentage: pathanPct,
        statusGrade: getGradeBand(pathanPct),
      },
      sravan: {
        section: 'SRAVAN',
        title: 'Spiritual Hearing (Sravan)',
        daysExpected: totalDays,
        daysSubmitted: submittedDaysCount,
        daysMissing: missingDays,
        actualMinutes: totalSravanMinutes,
        targetMinutes: targetSravanMinutes,
        percentage: sravanPct,
        statusGrade: getGradeBand(sravanPct),
      },
      seva: {
        section: 'SEVA',
        title: 'Devotional Service (Seva)',
        daysExpected: totalDays,
        daysSubmitted: submittedDaysCount,
        daysMissing: missingDays,
        actualMinutes: totalSevaMinutes,
        targetMinutes: targetSevaMinutes,
        percentage: sevaPct,
        statusGrade: getGradeBand(sevaPct),
      },
      sevaBhavana: {
        daysWithLogs: bhavanaLogsCount,
        topNegativeTags: topNeg,
        topPositiveTags: topPos,
      },
    },
    overall: {
      overallPercentage,
      gradeBand: getGradeBand(overallPercentage),
      totalObtainedMarks: totalNidraMarks + totalJapaMarks + totalAttendanceMarks,
      totalMaxMarks: maxNidraMarks + maxJapaMarks + maxAttendanceMarks,
    },
    dailyBreakdown,
  };
}
