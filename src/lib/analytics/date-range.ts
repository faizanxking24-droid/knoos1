/**
 * KNOOS Business Analytics Date & Timezone Engine
 *
 * Canonical Timezone: Asia/Kolkata (IST = UTC+05:30)
 *
 * Principles:
 * 1. Business analytics boundaries MUST be deterministic and never depend on
 *    the host server OS timezone, local machine timezone, or browser timezone.
 * 2. Date ranges are inclusive on start and strictly exclusive on end:
 *    createdAt >= fromInclusive AND createdAt < toExclusive
 * 3. 7 Days = today + previous 6 calendar days (7 calendar days total)
 * 4. 30 Days = today + previous 29 calendar days (30 calendar days total)
 * 5. Custom: 1 Sep to 27 Sep includes 1 Sep 00:00:00 through 27 Sep 23:59:59.999 IST
 *    (toExclusive = 28 Sep 00:00:00 IST).
 */

export const BUSINESS_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30 = 19,800,000 ms

export type DateRange = "today" | "7days" | "30days" | "month" | "custom";

export interface IstComponents {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  day: number;   // 1-indexed (1-31)
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Extracts exact calendar components for a given timestamp in Asia/Kolkata (IST).
 */
export function getIstComponents(date: Date): IstComponents {
  // Adding IST offset to UTC timestamp allows UTC getters to yield exact IST calendar values
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    day: istDate.getUTCDate(),
    hours: istDate.getUTCHours(),
    minutes: istDate.getUTCMinutes(),
    seconds: istDate.getUTCSeconds(),
    milliseconds: istDate.getUTCMilliseconds(),
  };
}

/**
 * Creates a UTC Date corresponding to a specific calendar moment in Asia/Kolkata (IST).
 */
export function createUtcFromIst(
  year: number,
  month: number, // 0-indexed
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
): Date {
  const utcMs = Date.UTC(year, month, day, hours, minutes, seconds, milliseconds) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Formats a Date as 'YYYY-MM-DD' in Asia/Kolkata (IST).
 */
export function formatIstDateString(date: Date): string {
  const { year, month, day } = getIstComponents(date);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Parses a 'YYYY-MM-DD' string and validates calendar correctness.
 */
export function parseIstDateString(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Convert to 0-indexed
  const day = parseInt(match[3], 10);

  if (month < 0 || month > 11 || day < 1 || day > 31) return null;

  // Verify date doesn't roll over (e.g. Feb 30)
  const probe = new Date(Date.UTC(year, month, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month || probe.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
}

export type TrendBucketStrategy = "hourly" | "daily" | "weekly" | "monthly";

export interface AnalyticsDateWindow {
  fromInclusive: Date;
  toExclusive: Date;
  calendarDays: number;
  label: string;
}

export interface AnalyticsDateRange extends AnalyticsDateWindow {
  range: DateRange;
  customFromStr?: string;
  customToStr?: string;
  previousPeriod: AnalyticsDateWindow;
  bucketStrategy: TrendBucketStrategy;
  warning?: string;
}

/**
 * Calculates authoritative date boundaries for dashboard queries and comparison windows.
 */
export function calculateAnalyticsDateRange(
  range: DateRange,
  customFromStr?: string,
  customToStr?: string,
  now: Date = new Date()
): AnalyticsDateRange {
  const todayIst = getIstComponents(now);

  // Midnight of today in IST
  const todayStartUtc = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day, 0, 0, 0, 0);
  // Midnight of tomorrow in IST (exclusive end of today)
  const tomorrowStartUtc = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day + 1, 0, 0, 0, 0);

  switch (range) {
    case "today": {
      const fromInclusive = todayStartUtc;
      const toExclusive = tomorrowStartUtc;
      const calendarDays = 1;

      // Previous period: Yesterday
      const prevFromInclusive = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day - 1, 0, 0, 0, 0);
      const prevToExclusive = todayStartUtc;

      return {
        range: "today",
        fromInclusive,
        toExclusive,
        calendarDays,
        label: `Today (${formatDisplayDate(fromInclusive)})`,
        previousPeriod: {
          fromInclusive: prevFromInclusive,
          toExclusive: prevToExclusive,
          calendarDays: 1,
          label: `Yesterday (${formatDisplayDate(prevFromInclusive)})`,
        },
        bucketStrategy: "hourly",
      };
    }

    case "7days": {
      // 7 calendar days = today + previous 6 calendar days
      const fromInclusive = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day - 6, 0, 0, 0, 0);
      const toExclusive = tomorrowStartUtc;
      const calendarDays = 7;

      // Previous 7 calendar days
      const prevFromInclusive = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day - 13, 0, 0, 0, 0);
      const prevToExclusive = fromInclusive;

      return {
        range: "7days",
        fromInclusive,
        toExclusive,
        calendarDays,
        label: `Last 7 Days (${formatDisplayDate(fromInclusive)} – ${formatDisplayDate(now)})`,
        previousPeriod: {
          fromInclusive: prevFromInclusive,
          toExclusive: prevToExclusive,
          calendarDays: 7,
          label: `Prior 7 Days (${formatDisplayDate(prevFromInclusive)} – ${formatDisplayDate(new Date(prevToExclusive.getTime() - 1000))})`,
        },
        bucketStrategy: "daily",
      };
    }

    case "30days": {
      // 30 calendar days = today + previous 29 calendar days
      const fromInclusive = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day - 29, 0, 0, 0, 0);
      const toExclusive = tomorrowStartUtc;
      const calendarDays = 30;

      // Previous 30 calendar days
      const prevFromInclusive = createUtcFromIst(todayIst.year, todayIst.month, todayIst.day - 59, 0, 0, 0, 0);
      const prevToExclusive = fromInclusive;

      return {
        range: "30days",
        fromInclusive,
        toExclusive,
        calendarDays,
        label: `Last 30 Days (${formatDisplayDate(fromInclusive)} – ${formatDisplayDate(now)})`,
        previousPeriod: {
          fromInclusive: prevFromInclusive,
          toExclusive: prevToExclusive,
          calendarDays: 30,
          label: `Prior 30 Days (${formatDisplayDate(prevFromInclusive)} – ${formatDisplayDate(new Date(prevToExclusive.getTime() - 1000))})`,
        },
        bucketStrategy: "daily",
      };
    }

    case "month": {
      // From 1st of current month up to and including today
      const fromInclusive = createUtcFromIst(todayIst.year, todayIst.month, 1, 0, 0, 0, 0);
      const toExclusive = tomorrowStartUtc;
      const calendarDays = todayIst.day; // e.g. 28 days if today is the 28th

      // Equal length duration preceding the month start for accurate comparative analytics
      const prevFromInclusive = createUtcFromIst(todayIst.year, todayIst.month, 1 - calendarDays, 0, 0, 0, 0);
      const prevToExclusive = fromInclusive;

      const monthName = getIstMonthName(todayIst.month);

      return {
        range: "month",
        fromInclusive,
        toExclusive,
        calendarDays,
        label: `This Month (${monthName} 1 – ${todayIst.day})`,
        previousPeriod: {
          fromInclusive: prevFromInclusive,
          toExclusive: prevToExclusive,
          calendarDays,
          label: `Preceding ${calendarDays} Days (${formatDisplayDate(prevFromInclusive)} – ${formatDisplayDate(new Date(prevToExclusive.getTime() - 1000))})`,
        },
        bucketStrategy: "daily",
      };
    }

    case "custom":
    default: {
      const parsedFrom = parseIstDateString(customFromStr || "");
      const parsedTo = parseIstDateString(customToStr || "");

      let warning: string | undefined;

      if (!parsedFrom || !parsedTo) {
        // Fallback safely to Last 30 Days if custom inputs are malformed
        warning = "Invalid custom date format provided. Defaulted to last 30 days.";
        const fallback = calculateAnalyticsDateRange("30days", undefined, undefined, now);
        return {
          ...fallback,
          range: "custom",
          warning,
        };
      }

      const fromUtc = createUtcFromIst(parsedFrom.year, parsedFrom.month, parsedFrom.day, 0, 0, 0, 0);
      const toNextDayUtc = createUtcFromIst(parsedTo.year, parsedTo.month, parsedTo.day + 1, 0, 0, 0, 0);

      if (fromUtc.getTime() >= toNextDayUtc.getTime()) {
        warning = "Start date must be earlier than or equal to end date. Defaulted to single day.";
        const singleToNextDay = createUtcFromIst(parsedFrom.year, parsedFrom.month, parsedFrom.day + 1, 0, 0, 0, 0);
        return {
          range: "custom",
          fromInclusive: fromUtc,
          toExclusive: singleToNextDay,
          calendarDays: 1,
          customFromStr,
          customToStr: customFromStr,
          label: `Custom (${formatIstDateString(fromUtc)})`,
          previousPeriod: {
            fromInclusive: createUtcFromIst(parsedFrom.year, parsedFrom.month, parsedFrom.day - 1, 0, 0, 0, 0),
            toExclusive: fromUtc,
            calendarDays: 1,
            label: "Previous Day",
          },
          bucketStrategy: "daily",
          warning,
        };
      }

      // Calculate calendar days in window
      const diffMs = toNextDayUtc.getTime() - fromUtc.getTime();
      const calendarDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

      // Previous period of identical calendar duration immediately preceding fromUtc
      const prevFromUtc = new Date(fromUtc.getTime() - calendarDays * 24 * 60 * 60 * 1000);
      const prevToUtc = fromUtc;

      // Dynamic bucket strategy as specified:
      // <= 45 days: daily
      // > 45 and <= 180 days: weekly
      // > 180 days: monthly
      let bucketStrategy: TrendBucketStrategy = "daily";
      if (calendarDays > 180) {
        bucketStrategy = "monthly";
      } else if (calendarDays > 45) {
        bucketStrategy = "weekly";
      }

      return {
        range: "custom",
        fromInclusive: fromUtc,
        toExclusive: toNextDayUtc,
        calendarDays,
        customFromStr,
        customToStr,
        label: `Custom (${formatDisplayDate(fromUtc)} – ${formatDisplayDate(new Date(toNextDayUtc.getTime() - 1000))})`,
        previousPeriod: {
          fromInclusive: prevFromUtc,
          toExclusive: prevToUtc,
          calendarDays,
          label: `Prior ${calendarDays} Days (${formatDisplayDate(prevFromUtc)} – ${formatDisplayDate(new Date(prevToUtc.getTime() - 1000))})`,
        },
        bucketStrategy,
      };
    }
  }
}

/**
 * Returns formatted short date string in IST, e.g. "28 Sep" or "28 Sep 2026".
 */
export function formatDisplayDate(date: Date, includeYear = false): string {
  const { year, month, day } = getIstComponents(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mName = months[month];
  return includeYear ? `${day} ${mName} ${year}` : `${day} ${mName}`;
}

export function getIstMonthName(monthIndex: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex] || "";
}

export interface BucketPoint {
  key: string;       // Sortable identifier / Date key (e.g. '2026-09-28' or '14:00')
  label: string;     // Friendly display label (e.g. '28 Sep' or '2 PM')
  startUtc: Date;
  endUtc: Date;
}

/**
 * Generates continuous, gap-free bucket points for the sales trend graph.
 */
export function generateTrendBuckets(
  fromInclusive: Date,
  toExclusive: Date,
  strategy: TrendBucketStrategy
): BucketPoint[] {
  const buckets: BucketPoint[] = [];

  if (strategy === "hourly") {
    // 24 one-hour buckets covering the day
    const startIst = getIstComponents(fromInclusive);
    for (let h = 0; h < 24; h++) {
      const bStart = createUtcFromIst(startIst.year, startIst.month, startIst.day, h, 0, 0, 0);
      const bEnd = createUtcFromIst(startIst.year, startIst.month, startIst.day, h + 1, 0, 0, 0);
      const hStr = String(h).padStart(2, "0") + ":00";
      const ampm = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
      buckets.push({
        key: hStr,
        label: ampm,
        startUtc: bStart,
        endUtc: bEnd,
      });
    }
    return buckets;
  }

  if (strategy === "daily") {
    let current = new Date(fromInclusive.getTime());
    while (current.getTime() < toExclusive.getTime()) {
      const ist = getIstComponents(current);
      const nextDay = createUtcFromIst(ist.year, ist.month, ist.day + 1, 0, 0, 0, 0);
      const key = formatIstDateString(current);
      const label = formatDisplayDate(current);
      buckets.push({
        key,
        label,
        startUtc: new Date(current.getTime()),
        endUtc: nextDay,
      });
      current = nextDay;
    }
    return buckets;
  }

  if (strategy === "weekly") {
    let current = new Date(fromInclusive.getTime());
    let weekIndex = 1;
    while (current.getTime() < toExclusive.getTime()) {
      const nextWeekTime = Math.min(current.getTime() + 7 * 24 * 60 * 60 * 1000, toExclusive.getTime());
      const nextWeek = new Date(nextWeekTime);
      const key = `W${weekIndex}_${formatIstDateString(current)}`;
      const label = `W${weekIndex} (${formatDisplayDate(current)})`;
      buckets.push({
        key,
        label,
        startUtc: new Date(current.getTime()),
        endUtc: nextWeek,
      });
      current = nextWeek;
      weekIndex++;
    }
    return buckets;
  }

  // Monthly strategy
  let current = new Date(fromInclusive.getTime());
  while (current.getTime() < toExclusive.getTime()) {
    const ist = getIstComponents(current);
    const nextMonth = createUtcFromIst(ist.year, ist.month + 1, 1, 0, 0, 0, 0);
    const effectiveEnd = nextMonth.getTime() > toExclusive.getTime() ? toExclusive : nextMonth;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const key = `${ist.year}-${String(ist.month + 1).padStart(2, "0")}`;
    const label = `${months[ist.month]} ${ist.year}`;
    buckets.push({
      key,
      label,
      startUtc: new Date(current.getTime()),
      endUtc: effectiveEnd,
    });
    current = nextMonth;
  }

  return buckets;
}
