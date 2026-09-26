import { prisma } from './prisma';
import { parseTimeToMinutes } from './scoring-engine';

export type SadhanaRuleKey =
  | 'BED_TIME'
  | 'WAKE_UP_TIME'
  | 'DAY_SLEEP_LIMIT'
  | 'JAPA_TARGET_TIME'
  | 'PATHAN_WEEKLY_HOURS'
  | 'SRAVAN_WEEKLY_HOURS'
  | 'SEVA_WEEKLY_HOURS';

export interface RuleDefinition {
  key: SadhanaRuleKey;
  label: string;
  category: 'Nidra' | 'Japa' | 'Pathan' | 'Sravan' | 'Seva';
  unit: 'time' | 'minutes' | 'hours_per_week';
  brahmachariDefault: string;
  studentDefault: string;
  allowedFor: ('ADMIN' | 'COUNSELLOR' | 'BRAHMACHARI')[];
  maxDeviationMinutes?: number;
  maxDeviationHours?: number;
  maxDurationDays: number;
  requiresReason: boolean;
  description: string;
}

export const DEFAULT_RULE_DEFINITIONS: Record<SadhanaRuleKey, RuleDefinition> = {
  BED_TIME: {
    key: 'BED_TIME',
    label: 'Bed Time (Night Sleep)',
    category: 'Nidra',
    unit: 'time',
    brahmachariDefault: '22:00',
    studentDefault: '22:00',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationMinutes: 30, // allowed range: 21:30 to 22:30
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Target time to be in bed for Vaishnava rest. Default is 10:00 PM (22:00).',
  },
  WAKE_UP_TIME: {
    key: 'WAKE_UP_TIME',
    label: 'Wake Up Time (Brahma Muhurta)',
    category: 'Nidra',
    unit: 'time',
    brahmachariDefault: '03:45',
    studentDefault: '04:30',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationMinutes: 45, // allowed range: +/- 45 mins
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Target rising time before Mangal Aarti. Default is 03:45 AM (Ashram) / 04:30 AM (BACE).',
  },
  DAY_SLEEP_LIMIT: {
    key: 'DAY_SLEEP_LIMIT',
    label: 'Day Rest / Sleep Limit (Minutes)',
    category: 'Nidra',
    unit: 'minutes',
    brahmachariDefault: '60',
    studentDefault: '60',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationMinutes: 30, // range: 30 to 90 mins
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Maximum permitted daytime rest in minutes without score reduction.',
  },
  JAPA_TARGET_TIME: {
    key: 'JAPA_TARGET_TIME',
    label: 'Japa 16 Rounds Target Completion Time',
    category: 'Japa',
    unit: 'time',
    brahmachariDefault: '07:15',
    studentDefault: '07:30',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationMinutes: 45,
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Target time to finish 16 rounds of Hare Krishna Mahamantra japa.',
  },
  PATHAN_WEEKLY_HOURS: {
    key: 'PATHAN_WEEKLY_HOURS',
    label: 'Scriptural Reading Target (Hours/Week)',
    category: 'Pathan',
    unit: 'hours_per_week',
    brahmachariDefault: '7.0',
    studentDefault: '3.5',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationHours: 2.5,
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Weekly reading hours for Srila Prabhupada books (Bhagavad-gita, Srimad-Bhagavatam, CC).',
  },
  SRAVAN_WEEKLY_HOURS: {
    key: 'SRAVAN_WEEKLY_HOURS',
    label: 'Spiritual Hearing Target (Hours/Week)',
    category: 'Sravan',
    unit: 'hours_per_week',
    brahmachariDefault: '7.0',
    studentDefault: '3.5',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationHours: 2.5,
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Weekly hearing hours for recorded lectures and spiritual classes.',
  },
  SEVA_WEEKLY_HOURS: {
    key: 'SEVA_WEEKLY_HOURS',
    label: 'Devotional Service Target (Hours/Week)',
    category: 'Seva',
    unit: 'hours_per_week',
    brahmachariDefault: '42.0',
    studentDefault: '6.0',
    allowedFor: ['ADMIN', 'COUNSELLOR', 'BRAHMACHARI'],
    maxDeviationHours: 8.0,
    maxDurationDays: 60,
    requiresReason: true,
    description: 'Weekly devotional service/preaching target hours.',
  },
};

export interface EffectiveRulesMap {
  bedTime: string; // e.g. "22:00"
  wakeUpTime: string; // e.g. "04:30"
  daySleepLimit: number; // e.g. 60
  japaTargetTime: string; // e.g. "07:15"
  weeklyPathanHours: number; // e.g. 3.5
  weeklySravanHours: number; // e.g. 3.5
  weeklySevaHours: number; // e.g. 6.0
  activeOverrides: {
    [key in SadhanaRuleKey]?: {
      overrideId: string;
      originalValue: string;
      overrideValue: string;
      reason: string;
      effectiveFrom: string;
      effectiveUntil?: string | null;
      createdByName: string;
      createdByRole: string;
    };
  };
}

/**
 * Validates backend permissions for creating/modifying rule overrides.
 */
export async function verifyOverridePermission(
  sessionUser: { id: string; role: string },
  targetUserId: string
): Promise<{ allowed: boolean; targetUser?: any; error?: string; status?: number }> {
  if (sessionUser.role === 'STUDENT') {
    return {
      allowed: false,
      error: 'Students are not authorized to create or modify Sadhana rule overrides.',
      status: 403,
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      counsellor: { select: { id: true, name: true, email: true } },
      preacher: { select: { id: true, name: true, email: true } },
    },
  });

  if (!targetUser) {
    return { allowed: false, error: 'Target user not found.', status: 404 };
  }

  if (sessionUser.role === 'ADMIN') {
    return { allowed: true, targetUser };
  }

  if (sessionUser.role === 'COUNSELLOR') {
    // Counsellor can only customize Brahmacharis directly assigned to them
    if (targetUser.role !== 'BRAHMACHARI' || targetUser.counsellorId !== sessionUser.id) {
      return {
        allowed: false,
        error: 'Forbidden: Counsellors can only customize rules for Brahmacharis under their direct care.',
        status: 403,
      };
    }
    return { allowed: true, targetUser };
  }

  if (sessionUser.role === 'BRAHMACHARI') {
    // Brahmachari can only customize Students directly assigned to them
    if (targetUser.role !== 'STUDENT' || targetUser.preacherId !== sessionUser.id) {
      return {
        allowed: false,
        error: 'Forbidden: Brahmacharis / Preachers can only customize rules for their own assigned Students.',
        status: 403,
      };
    }
    return { allowed: true, targetUser };
  }

  return { allowed: false, error: 'Unauthorized role.', status: 403 };
}

/**
 * Retrieves Admin-configured override rules configuration.
 */
export async function getAdminRuleConfigs(): Promise<Record<SadhanaRuleKey, RuleDefinition>> {
  try {
    const configRecord = await prisma.ruleConfig.findUnique({
      where: { key: 'OVERRIDE_RULES_SETTINGS' },
    });

    if (configRecord && configRecord.value) {
      const parsed = JSON.parse(configRecord.value);
      return { ...DEFAULT_RULE_DEFINITIONS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading rule configs:', e);
  }
  return DEFAULT_RULE_DEFINITIONS;
}

/**
 * Calculates allowed boundary range [min, max] for a given rule and target role.
 */
export function calculateAllowedRange(
  ruleDef: RuleDefinition,
  targetRole: string
): { min: string; max: string; defaultVal: string } {
  const defaultVal =
    targetRole === 'BRAHMACHARI' ? ruleDef.brahmachariDefault : ruleDef.studentDefault;

  if (ruleDef.unit === 'time') {
    const defaultMins = parseTimeToMinutes(defaultVal) || 0;
    const maxDev = ruleDef.maxDeviationMinutes || 30;
    const minMins = Math.max(0, defaultMins - maxDev);
    const maxMins = Math.min(23 * 60 + 59, defaultMins + maxDev);

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return {
      min: formatTime(minMins),
      max: formatTime(maxMins),
      defaultVal,
    };
  } else if (ruleDef.unit === 'minutes') {
    const defaultNum = parseInt(defaultVal, 10) || 60;
    const maxDev = ruleDef.maxDeviationMinutes || 30;
    return {
      min: Math.max(0, defaultNum - maxDev).toString(),
      max: (defaultNum + maxDev).toString(),
      defaultVal,
    };
  } else {
    // hours_per_week
    const defaultNum = parseFloat(defaultVal) || 3.5;
    const maxDev = ruleDef.maxDeviationHours || 2.0;
    return {
      min: Math.max(0.5, defaultNum - maxDev).toFixed(1),
      max: (defaultNum + maxDev).toFixed(1),
      defaultVal,
    };
  }
}

/**
 * Validates a proposed override value against allowed deviations and rules.
 */
export function validateRuleOverrideInput(
  ruleDef: RuleDefinition,
  targetRole: string,
  overrideValue: string,
  effectiveFrom: string,
  effectiveUntil?: string | null,
  reason?: string
): { isValid: boolean; error?: string } {
  if (!reason || reason.trim().length < 4) {
    return { isValid: false, error: 'A valid reason for the Sadhana rule override is mandatory (min 4 chars).' };
  }

  if (!effectiveFrom || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    return { isValid: false, error: 'Effective start date must be in valid YYYY-MM-DD format.' };
  }

  if (effectiveUntil) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveUntil)) {
      return { isValid: false, error: 'Effective end date must be in valid YYYY-MM-DD format.' };
    }
    if (effectiveUntil < effectiveFrom) {
      return { isValid: false, error: 'Effective end date cannot be earlier than start date.' };
    }

    // Check max duration days
    const start = new Date(effectiveFrom);
    const end = new Date(effectiveUntil);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days > ruleDef.maxDurationDays) {
      return {
        isValid: false,
        error: `Override duration of ${days} days exceeds maximum permitted duration of ${ruleDef.maxDurationDays} days.`,
      };
    }
  }

  const { min, max, defaultVal } = calculateAllowedRange(ruleDef, targetRole);

  if (ruleDef.unit === 'time') {
    const valMins = parseTimeToMinutes(overrideValue);
    if (valMins === null) {
      return { isValid: false, error: 'Invalid time format. Please provide time in HH:mm 24-hr format (e.g. 22:15).' };
    }
    const minMins = parseTimeToMinutes(min)!;
    const maxMins = parseTimeToMinutes(max)!;

    if (valMins < minMins || valMins > maxMins) {
      return {
        isValid: false,
        error: `Override time "${overrideValue}" is outside allowed deviation range [${min} to ${max}] (Default: ${defaultVal}).`,
      };
    }
  } else if (ruleDef.unit === 'minutes') {
    const valNum = parseInt(overrideValue, 10);
    if (isNaN(valNum) || valNum <= 0) {
      return { isValid: false, error: 'Override value must be a positive integer in minutes.' };
    }
    const minNum = parseInt(min, 10);
    const maxNum = parseInt(max, 10);
    if (valNum < minNum || valNum > maxNum) {
      return {
        isValid: false,
        error: `Override minutes "${overrideValue}" is outside allowed deviation range [${min} - ${max} mins] (Default: ${defaultVal}).`,
      };
    }
  } else {
    const valNum = parseFloat(overrideValue);
    if (isNaN(valNum) || valNum <= 0) {
      return { isValid: false, error: 'Override value must be a positive number in hours per week.' };
    }
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    if (valNum < minNum || valNum > maxNum) {
      return {
        isValid: false,
        error: `Override hours "${overrideValue}" is outside allowed deviation range [${min} - ${max} hrs/week] (Default: ${defaultVal}).`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Resolves effective rules for a specific date for a user, checking active overrides.
 */
export async function getEffectiveSadhanaRulesForDate(
  userId: string,
  targetRole: string,
  dateStr: string
): Promise<EffectiveRulesMap> {
  const isBrahmachari = targetRole === 'BRAHMACHARI' || targetRole === 'BRAHMACHARI_S1';
  const roleType = isBrahmachari ? 'BRAHMACHARI' : 'STUDENT';

  // Base role defaults
  const effective: EffectiveRulesMap = {
    bedTime: isBrahmachari ? DEFAULT_RULE_DEFINITIONS.BED_TIME.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.BED_TIME.studentDefault,
    wakeUpTime: isBrahmachari ? DEFAULT_RULE_DEFINITIONS.WAKE_UP_TIME.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.WAKE_UP_TIME.studentDefault,
    daySleepLimit: parseInt(
      isBrahmachari ? DEFAULT_RULE_DEFINITIONS.DAY_SLEEP_LIMIT.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.DAY_SLEEP_LIMIT.studentDefault,
      10
    ),
    japaTargetTime: isBrahmachari ? DEFAULT_RULE_DEFINITIONS.JAPA_TARGET_TIME.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.JAPA_TARGET_TIME.studentDefault,
    weeklyPathanHours: parseFloat(
      isBrahmachari ? DEFAULT_RULE_DEFINITIONS.PATHAN_WEEKLY_HOURS.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.PATHAN_WEEKLY_HOURS.studentDefault
    ),
    weeklySravanHours: parseFloat(
      isBrahmachari ? DEFAULT_RULE_DEFINITIONS.SRAVAN_WEEKLY_HOURS.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.SRAVAN_WEEKLY_HOURS.studentDefault
    ),
    weeklySevaHours: parseFloat(
      isBrahmachari ? DEFAULT_RULE_DEFINITIONS.SEVA_WEEKLY_HOURS.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.SEVA_WEEKLY_HOURS.studentDefault
    ),
    activeOverrides: {},
  };

  // Fetch active overrides valid for dateStr
  const overrides = await prisma.sadhanaRuleOverride.findMany({
    where: {
      targetUserId: userId,
      status: 'ACTIVE',
      effectiveFrom: { lte: dateStr },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: dateStr } },
      ],
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  for (const o of overrides) {
    const key = o.ruleKey as SadhanaRuleKey;
    if (effective.activeOverrides[key]) continue; // Take most recent active override

    effective.activeOverrides[key] = {
      overrideId: o.id,
      originalValue: o.originalValue,
      overrideValue: o.overrideValue,
      reason: o.reason,
      effectiveFrom: o.effectiveFrom,
      effectiveUntil: o.effectiveUntil,
      createdByName: o.createdBy?.name || 'Authority',
      createdByRole: o.createdByRole,
    };

    // Apply override
    if (key === 'BED_TIME') effective.bedTime = o.overrideValue;
    if (key === 'WAKE_UP_TIME') effective.wakeUpTime = o.overrideValue;
    if (key === 'DAY_SLEEP_LIMIT') effective.daySleepLimit = parseInt(o.overrideValue, 10) || effective.daySleepLimit;
    if (key === 'JAPA_TARGET_TIME') effective.japaTargetTime = o.overrideValue;
    if (key === 'PATHAN_WEEKLY_HOURS') effective.weeklyPathanHours = parseFloat(o.overrideValue) || effective.weeklyPathanHours;
    if (key === 'SRAVAN_WEEKLY_HOURS') effective.weeklySravanHours = parseFloat(o.overrideValue) || effective.weeklySravanHours;
    if (key === 'SEVA_WEEKLY_HOURS') effective.weeklySevaHours = parseFloat(o.overrideValue) || effective.weeklySevaHours;
  }

  return effective;
}

/**
 * Pre-fetches all overrides active in [fromDate, toDate] interval and constructs
 * a daily map for blazing fast period scoring without per-day DB queries.
 */
export async function getEffectiveSadhanaRulesForRange(
  userId: string,
  targetRole: string,
  fromDate: string,
  toDate: string
): Promise<Map<string, EffectiveRulesMap>> {
  const isBrahmachari = targetRole === 'BRAHMACHARI' || targetRole === 'BRAHMACHARI_S1';

  // Fetch all active overrides that overlap with [fromDate, toDate]
  const overrides = await prisma.sadhanaRuleOverride.findMany({
    where: {
      targetUserId: userId,
      status: 'ACTIVE',
      effectiveFrom: { lte: toDate },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: fromDate } },
      ],
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const resultMap = new Map<string, EffectiveRulesMap>();

  const start = new Date(fromDate);
  const end = new Date(toDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  for (let i = 0; i < totalDays; i++) {
    const currDate = new Date(start);
    currDate.setDate(currDate.getDate() + i);
    const dateStr = currDate.toISOString().split('T')[0];

    // Initialize with role defaults
    const dayEffective: EffectiveRulesMap = {
      bedTime: isBrahmachari ? DEFAULT_RULE_DEFINITIONS.BED_TIME.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.BED_TIME.studentDefault,
      wakeUpTime: isBrahmachari ? DEFAULT_RULE_DEFINITIONS.WAKE_UP_TIME.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.WAKE_UP_TIME.studentDefault,
      daySleepLimit: parseInt(
        isBrahmachari ? DEFAULT_RULE_DEFINITIONS.DAY_SLEEP_LIMIT.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.DAY_SLEEP_LIMIT.studentDefault,
        10
      ),
      japaTargetTime: isBrahmachari ? DEFAULT_RULE_DEFINITIONS.JAPA_TARGET_TIME.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.JAPA_TARGET_TIME.studentDefault,
      weeklyPathanHours: parseFloat(
        isBrahmachari ? DEFAULT_RULE_DEFINITIONS.PATHAN_WEEKLY_HOURS.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.PATHAN_WEEKLY_HOURS.studentDefault
      ),
      weeklySravanHours: parseFloat(
        isBrahmachari ? DEFAULT_RULE_DEFINITIONS.SRAVAN_WEEKLY_HOURS.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.SRAVAN_WEEKLY_HOURS.studentDefault
      ),
      weeklySevaHours: parseFloat(
        isBrahmachari ? DEFAULT_RULE_DEFINITIONS.SEVA_WEEKLY_HOURS.brahmachariDefault : DEFAULT_RULE_DEFINITIONS.SEVA_WEEKLY_HOURS.studentDefault
      ),
      activeOverrides: {},
    };

    // Filter overrides active on this specific dateStr
    for (const o of overrides) {
      if (o.effectiveFrom <= dateStr && (!o.effectiveUntil || o.effectiveUntil >= dateStr)) {
        const key = o.ruleKey as SadhanaRuleKey;
        if (!dayEffective.activeOverrides[key]) {
          dayEffective.activeOverrides[key] = {
            overrideId: o.id,
            originalValue: o.originalValue,
            overrideValue: o.overrideValue,
            reason: o.reason,
            effectiveFrom: o.effectiveFrom,
            effectiveUntil: o.effectiveUntil,
            createdByName: o.createdBy?.name || 'Authority',
            createdByRole: o.createdByRole,
          };

          if (key === 'BED_TIME') dayEffective.bedTime = o.overrideValue;
          if (key === 'WAKE_UP_TIME') dayEffective.wakeUpTime = o.overrideValue;
          if (key === 'DAY_SLEEP_LIMIT') dayEffective.daySleepLimit = parseInt(o.overrideValue, 10) || dayEffective.daySleepLimit;
          if (key === 'JAPA_TARGET_TIME') dayEffective.japaTargetTime = o.overrideValue;
          if (key === 'PATHAN_WEEKLY_HOURS') dayEffective.weeklyPathanHours = parseFloat(o.overrideValue) || dayEffective.weeklyPathanHours;
          if (key === 'SRAVAN_WEEKLY_HOURS') dayEffective.weeklySravanHours = parseFloat(o.overrideValue) || dayEffective.weeklySravanHours;
          if (key === 'SEVA_WEEKLY_HOURS') dayEffective.weeklySevaHours = parseFloat(o.overrideValue) || dayEffective.weeklySevaHours;
        }
      }
    }

    resultMap.set(dateStr, dayEffective);
  }

  return resultMap;
}
