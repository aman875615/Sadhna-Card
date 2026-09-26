/**
 * Sadhana Card Scoring Engine
 * Directly derived from Excel sheets:
 * 1. sadhana Card_Brahamcharis.xls (S1)
 * 2. sadhana Card_bace.xls (S2)
 *
 * Source of Truth: Raw time and activity data.
 * All points and percentages are computed dynamically with full support for
 * Hierarchical Sadhana Rule Overrides.
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

export interface EffectiveDayRules {
  bedTime?: string;
  wakeUpTime?: string;
  daySleepLimit?: number;
  japaTargetTime?: string;
  weeklyPathanHours?: number;
  weeklySravanHours?: number;
  weeklySevaHours?: number;
  activeOverrides?: Record<string, any>;
}

export interface DailyScoredResult {
  date: string;
  isSubmitted: boolean;
  raw: Partial<RawSadhanaEntry>;
  effectiveRules?: EffectiveDayRules;
  scores: {
    bedTime: { raw: string | null; target: string; marks: number; maxMarks: number; isOverridden?: boolean };
    wakeUp: { raw: string | null; target: string; marks: number; maxMarks: number; isOverridden?: boolean };
    daySleep: { rawMinutes: number; targetLimit: number; marks: number; maxMarks: number; isOverridden?: boolean };
    nidraTotal: { marks: number; maxMarks: number; percentage: number };
    japa: {
      rawTime: string | null;
      targetTime: string;
      rounds: number;
      marks: number;
      maxMarks: number;
      percentage: number;
      isOverridden?: boolean;
    };
    attendance: {
      mangalAarti: { status: string; marks: number; maxMarks: number };
      guruPuja?: { status: string; marks: number; maxMarks: number };
      sbClass: { status: string; marks: number; maxMarks: number };
      prasadam: { status: string; marks: number; maxMarks: number };
      totalMarks: number;
      maxMarks: number;
      percentage: number;
    };
    pathan: { actualMinutes: number; targetDailyMinutes: number; bookName?: string; isOverridden?: boolean };
    sravan: { actualMinutes: number; targetDailyMinutes: number; topic?: string; isOverridden?: boolean };
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
      isOverridden?: boolean;
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
  isOverridden?: boolean;
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
  hasCustomOverrides: boolean;
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
 * 1. NIDRA - Bed Time scoring with dynamic target threshold.
 * Default target: 22:00 (10:00 PM)
 */
export function scoreBedTime(timeStr?: string | null, targetBedTime: string = '22:00'): number {
  const min = parseTimeToMinutes(timeStr);
  if (min === null) return 0;

  let normalizedMin = min;
  if (min < 12 * 60) {
    normalizedMin = min + 24 * 60;
  }

  const baseTargetMin = parseTimeToMinutes(targetBedTime) || 22 * 60;
  const normalizedTarget = baseTargetMin < 12 * 60 ? baseTargetMin + 24 * 60 : baseTargetMin;

  if (normalizedMin <= normalizedTarget) return 25;
  if (normalizedMin <= normalizedTarget + 5) return 20;
  if (normalizedMin <= normalizedTarget + 10) return 15;
  if (normalizedMin <= normalizedTarget + 15) return 10;
  if (normalizedMin <= normalizedTarget + 20) return 5;
  if (normalizedMin <= normalizedTarget + 25) return 0;
  return -5;
}

/**
 * 2. NIDRA - Wake Up scoring with dynamic target threshold.
 * Default target: 03:45 AM (Ashram) / 04:30 AM (BACE)
 */
export function scoreWakeUpTime(timeStr?: string | null, targetWakeUpTime: string = '03:45'): number {
  const min = parseTimeToMinutes(timeStr);
  if (min === null) return 0;

  const targetMin = parseTimeToMinutes(targetWakeUpTime) || (3 * 60 + 45);

  if (min <= targetMin) return 25;
  if (min <= targetMin + 5) return 20;
  if (min <= targetMin + 10) return 15;
  if (min <= targetMin + 15) return 10;
  if (min <= targetMin + 20) return 5;
  if (min <= targetMin + 25) return 0;
  return -5;
}

/**
 * 3. NIDRA - Day Sleep scoring with dynamic minute limit.
 * Default target limit: 60 minutes.
 */
export function scoreDaySleep(actualMinutes?: number | null, targetLimitMinutes: number = 60): number {
  const minutes = actualMinutes || 0;
  if (minutes <= targetLimitMinutes) return 25;
  const extraMinutes = minutes - targetLimitMinutes;
  const reduction = Math.floor(extraMinutes / 2);
  return Math.max(-5, 25 - reduction);
}

/**
 * 4. JAPA scoring with dynamic completion target time.
 * Default target: 07:15 AM.
 */
export function scoreJapa(
  timeStr?: string | null,
  roundsCount: number = 16,
  targetTimeStr: string = '07:15'
): number {
  if (roundsCount < 16 && roundsCount > 0) {
    return Math.max(-5, Math.round((roundsCount / 16) * 10) - 5);
  }
  const min = parseTimeToMinutes(timeStr);
  if (min === null) return 0;

  const targetMin = parseTimeToMinutes(targetTimeStr) || (7 * 60 + 15);
  const delta = targetMin - (7 * 60 + 15);

  if (min <= 7 * 60 + 15 + delta) return 25;
  if (min <= 8 * 60 + 30 + delta) return 20;
  if (min <= 11 * 60 + 0 + delta) return 15;
  if (min <= 13 * 60 + 0 + delta) return 15;
  if (min <= 14 * 60 + 30 + delta) return 10;
  if (min <= 17 * 60 + 0 + delta) return 5;
  if (min <= 19 * 60 + 0 + delta) return 0;
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
 * Base Section Target Configurations
 */
export const TARGET_CONFIG = {
  BRAHMACHARI_S1: {
    weeklyPathanMinutes: 7 * 60, // 420 mins = 7 hrs/week
    weeklySravanMinutes: 7 * 60, // 420 mins = 7 hrs/week
    weeklySevaMinutes: 42 * 60, // 2520 mins = 42 hrs/week
    bedTime: '22:00',
    wakeUpTime: '03:45',
    daySleepLimit: 60,
    japaTargetTime: '07:15',
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
    weeklySevaMinutes: 6 * 60, // 360 mins = 6 hrs/week
    bedTime: '22:00',
    wakeUpTime: '04:30',
    daySleepLimit: 60,
    japaTargetTime: '07:30',
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
 * Evaluates a single day's raw Sadhana entry and calculates derived scores
 * taking into account any personal rule overrides active on that date.
 */
export function evaluateDailyEntry(
  entry: Partial<RawSadhanaEntry>,
  cardType: CardType = 'BRAHMACHARI_S1',
  dateStr: string,
  effectiveRules?: EffectiveDayRules
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

  const baseCfg = TARGET_CONFIG[cardType];

  // Resolve effective rules for this specific day
  const effectiveBedTime = effectiveRules?.bedTime || baseCfg.bedTime;
  const effectiveWakeUp = effectiveRules?.wakeUpTime || baseCfg.wakeUpTime;
  const effectiveDaySleepLimit = effectiveRules?.daySleepLimit ?? baseCfg.daySleepLimit;
  const effectiveJapaTarget = effectiveRules?.japaTargetTime || baseCfg.japaTargetTime;

  const weeklyPathanMins = effectiveRules?.weeklyPathanHours
    ? effectiveRules.weeklyPathanHours * 60
    : baseCfg.weeklyPathanMinutes;
  const weeklySravanMins = effectiveRules?.weeklySravanHours
    ? effectiveRules.weeklySravanHours * 60
    : baseCfg.weeklySravanMinutes;
  const weeklySevaMins = effectiveRules?.weeklySevaHours
    ? effectiveRules.weeklySevaHours * 60
    : baseCfg.weeklySevaMinutes;

  const targetDailyPathan = Math.round(weeklyPathanMins / 7);
  const targetDailySravan = Math.round(weeklySravanMins / 7);
  const targetDailySeva = Math.round(weeklySevaMins / 7);

  const activeOvr = effectiveRules?.activeOverrides || {};

  // Nidra scores
  const bedTimeMarks = entry.sleepBedTime ? scoreBedTime(entry.sleepBedTime, effectiveBedTime) : 0;
  const wakeUpMarks = entry.wakeUpTime ? scoreWakeUpTime(entry.wakeUpTime, effectiveWakeUp) : 0;
  const daySleepMarks =
    entry.daySleepMinutes !== undefined && entry.daySleepMinutes !== null
      ? scoreDaySleep(entry.daySleepMinutes, effectiveDaySleepLimit)
      : 0;

  const nidraObtained = bedTimeMarks + wakeUpMarks + daySleepMarks;
  const nidraMax = 75; // 25 + 25 + 25
  const nidraPercentage = isSubmitted
    ? Math.max(0, Math.min(100, Math.round((nidraObtained / nidraMax) * 1000) / 10))
    : 0;

  // Japa score
  const japaMarks = entry.japaCompletionTime
    ? scoreJapa(entry.japaCompletionTime, entry.japaRoundsCount || 16, effectiveJapaTarget)
    : 0;
  const japaPercentage = isSubmitted
    ? Math.max(0, Math.min(100, Math.round((japaMarks / 25) * 1000) / 10))
    : 0;

  // Attendance score
  const maMarks = scoreAttendanceSlot(entry.mangalAarti);
  const sbMarks = scoreAttendanceSlot(entry.sbClass);
  const prMarks = scoreAttendanceSlot(entry.prasadam);
  const gpMarks = cardType === 'BRAHMACHARI_S1' ? scoreAttendanceSlot(entry.guruPuja) : 0;

  const attendanceObtained = maMarks + sbMarks + prMarks + (cardType === 'BRAHMACHARI_S1' ? gpMarks : 0);
  const attendanceMax = baseCfg.dailyMaxMarks.attendance;
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
    effectiveRules,
    scores: {
      bedTime: {
        raw: entry.sleepBedTime || null,
        target: effectiveBedTime,
        marks: bedTimeMarks,
        maxMarks: 25,
        isOverridden: Boolean(activeOvr['BED_TIME']),
      },
      wakeUp: {
        raw: entry.wakeUpTime || null,
        target: effectiveWakeUp,
        marks: wakeUpMarks,
        maxMarks: 25,
        isOverridden: Boolean(activeOvr['WAKE_UP_TIME']),
      },
      daySleep: {
        rawMinutes: entry.daySleepMinutes || 0,
        targetLimit: effectiveDaySleepLimit,
        marks: daySleepMarks,
        maxMarks: 25,
        isOverridden: Boolean(activeOvr['DAY_SLEEP_LIMIT']),
      },
      nidraTotal: { marks: nidraObtained, maxMarks: nidraMax, percentage: nidraPercentage },
      japa: {
        rawTime: entry.japaCompletionTime || null,
        targetTime: effectiveJapaTarget,
        rounds: entry.japaRoundsCount || 16,
        marks: japaMarks,
        maxMarks: 25,
        percentage: japaPercentage,
        isOverridden: Boolean(activeOvr['JAPA_TARGET_TIME']),
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
        isOverridden: Boolean(activeOvr['PATHAN_WEEKLY_HOURS']),
      },
      sravan: {
        actualMinutes: entry.sravanMinutes || 0,
        targetDailyMinutes: targetDailySravan,
        topic: entry.sravanLectureTopic || undefined,
        isOverridden: Boolean(activeOvr['SRAVAN_WEEKLY_HOURS']),
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
        isOverridden: Boolean(activeOvr['SEVA_WEEKLY_HOURS']),
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
export function getGradeBand(
  percentage: number
): 'High Honors' | 'Honors' | 'Distinction' | 'First Class' | 'Pass' | 'Needs Improvement' {
  if (percentage >= 100) return 'High Honors';
  if (percentage >= 95) return 'Honors';
  if (percentage >= 90) return 'Distinction';
  if (percentage >= 85) return 'First Class';
  if (percentage >= 80) return 'Pass';
  return 'Needs Improvement';
}

/**
 * Generates an interval-aware report for any arbitrary date range
 * evaluating each day using the rule that was effective on that specific date.
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
  entries: Partial<RawSadhanaEntry>[],
  rulesByDateMap?: Map<string, EffectiveDayRules>
): PeriodReport {
  const cardType = user.cardType || 'BRAHMACHARI_S1';

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
  let hasAnyCustomOverrides = false;

  // Cumulative totals
  let totalNidraMarks = 0;
  let maxNidraMarks = 0;

  let totalJapaMarks = 0;
  let maxJapaMarks = 0;

  let totalAttendanceMarks = 0;
  let maxAttendanceMarks = 0;

  let totalPathanMinutes = 0;
  let totalTargetPathanMinutes = 0;

  let totalSravanMinutes = 0;
  let totalTargetSravanMinutes = 0;

  let totalSevaMinutes = 0;
  let totalTargetSevaMinutes = 0;

  const negativeTagFreq = new Map<string, number>();
  const positiveTagFreq = new Map<string, number>();
  let bhavanaLogsCount = 0;

  for (let i = 0; i < totalDays; i++) {
    const currDate = new Date(start);
    currDate.setDate(currDate.getDate() + i);
    const dateStr = currDate.toISOString().split('T')[0];

    const rawEntry = entryMap.get(dateStr) || { userId: user.id, date: dateStr };
    const dayRules = rulesByDateMap?.get(dateStr);

    if (dayRules?.activeOverrides && Object.keys(dayRules.activeOverrides).length > 0) {
      hasAnyCustomOverrides = true;
    }

    const evaluated = evaluateDailyEntry(rawEntry, cardType, dateStr, dayRules);
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
    totalTargetPathanMinutes += evaluated.scores.pathan.targetDailyMinutes;

    totalSravanMinutes += evaluated.scores.sravan.actualMinutes;
    totalTargetSravanMinutes += evaluated.scores.sravan.targetDailyMinutes;

    totalSevaMinutes += evaluated.scores.seva.totalMinutes;
    totalTargetSevaMinutes += evaluated.scores.seva.targetDailyMinutes;

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

  // Section Percentages
  const nidraPct =
    maxNidraMarks > 0 ? Math.max(0, Math.min(100, Math.round((totalNidraMarks / maxNidraMarks) * 1000) / 10)) : 0;
  const japaPct =
    maxJapaMarks > 0 ? Math.max(0, Math.min(100, Math.round((totalJapaMarks / maxJapaMarks) * 1000) / 10)) : 0;
  const attendancePct =
    maxAttendanceMarks > 0
      ? Math.max(0, Math.min(100, Math.round((totalAttendanceMarks / maxAttendanceMarks) * 1000) / 10))
      : 0;
  const pathanPct =
    totalTargetPathanMinutes > 0
      ? Math.min(100, Math.round((totalPathanMinutes / totalTargetPathanMinutes) * 1000) / 10)
      : 100;
  const sravanPct =
    totalTargetSravanMinutes > 0
      ? Math.min(100, Math.round((totalSravanMinutes / totalTargetSravanMinutes) * 1000) / 10)
      : 100;
  const sevaPct =
    totalTargetSevaMinutes > 0
      ? Math.min(100, Math.round((totalSevaMinutes / totalTargetSevaMinutes) * 1000) / 10)
      : 100;

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
    hasCustomOverrides: hasAnyCustomOverrides,
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
        targetMinutes: totalTargetPathanMinutes,
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
        targetMinutes: totalTargetSravanMinutes,
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
        targetMinutes: totalTargetSevaMinutes,
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
