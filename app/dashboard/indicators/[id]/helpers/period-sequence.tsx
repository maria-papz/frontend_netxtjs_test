import {
  add,
  sub,
  format,
  getQuarter,
  differenceInMilliseconds,
  Duration,
} from 'date-fns';


export type Frequency =
  | 'MINUTE'
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'TRIANNUAL'
  | 'SEMIANNUAL'
  | 'ANNUAL'
  | 'CUSTOM';

// Helper function to get the interval based on frequency
export function getInterval(frequency: Frequency): Duration {
  switch (frequency) {
    case 'MINUTE': return { minutes: 1 };
    case 'HOURLY': return { hours: 1 };
    case 'DAILY': return { days: 1 };
    case 'WEEKLY': return { weeks: 1 };
    case 'BIWEEKLY': return { weeks: 2 };
    case 'MONTHLY': return { months: 1 };
    case 'BIMONTHLY': return { months: 2 };
    case 'QUARTERLY': return { months: 3 };
    case 'TRIANNUAL': return { months: 4 };
    case 'SEMIANNUAL': return { months: 6 };
    case 'ANNUAL': return { years: 1 };
    default: throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

// Helper function to format a date according to frequency
export function formatLabel(date: Date, frequency: Frequency): string {
  switch (frequency) {
    case 'MINUTE':
      return format(date, 'yyyy-MM-dd HH:mm');
    case 'HOURLY':
      return format(date, 'yyyy-MM-dd HH:00');
    case 'DAILY':
      return format(date, 'yyyy-MM-dd');
    case 'WEEKLY':
      const weekNum = format(date, 'ww');
      return `${format(date, 'yyyy')}-W${weekNum}`;
    case 'BIWEEKLY':
      const biWeekNum = format(date, 'ww');
      return `${format(date, 'yyyy')}-W${biWeekNum}`;
    case 'MONTHLY':
      return format(date, 'yyyy-MM');
    case 'BIMONTHLY':
      return format(date, 'yyyy-MM');
    case 'QUARTERLY':
      return `${date.getFullYear()}-Q${getQuarter(date)}`;
    case 'TRIANNUAL':
      // Get which third of the year (T1: Jan-Apr, T2: May-Aug, T3: Sep-Dec)
      const month = date.getMonth();
      const third = Math.floor(month / 4) + 1;
      return `${date.getFullYear()}-T${third}`;
    case 'SEMIANNUAL':
      // Get which half of the year (H1: Jan-Jun, H2: Jul-Dec)
      const halfYear = date.getMonth() < 6 ? 1 : 2;
      return `${date.getFullYear()}-H${halfYear}`;
    case 'ANNUAL':
      return date.getFullYear().toString();
    default:
      return date.toISOString();
  }
}

// Generate a sequence of periods
export function generateSchedule(
  startDate: Date,
  frequency: Frequency,
  count: number = 10,
  backward: boolean = false
): { date: Date; label: string }[] {
  const schedule = [startDate];
  const delta = getInterval(frequency);

  if (frequency === 'BIWEEKLY') {
    if (!backward) {
      for (let i = 1; i < count; i++) {
        const next = add(schedule[schedule.length - 1], { weeks: 2 });
        schedule.push(next);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const next = sub(schedule[0], { weeks: 2 });
        schedule.unshift(next);
      }
      schedule.pop();
    }
  } else if (frequency === 'BIMONTHLY') {
    if (!backward) {
      for (let i = 1; i < count; i++) {
        const next = add(schedule[schedule.length - 1], { months: 2 });
        schedule.push(next);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const next = sub(schedule[0], { months: 2 });
        schedule.unshift(next);
      }
      schedule.pop();
    }
  } else if (frequency === 'TRIANNUAL') {
    if (!backward) {
      for (let i = 1; i < count; i++) {
        const next = add(schedule[schedule.length - 1], { months: 4 });
        schedule.push(next);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const next = sub(schedule[0], { months: 4 });
        schedule.unshift(next);
      }
      schedule.pop();
    }
  } else if (frequency === 'SEMIANNUAL') {
    if (!backward) {
      for (let i = 1; i < count; i++) {
        const next = add(schedule[schedule.length - 1], { months: 6 });
        schedule.push(next);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const next = sub(schedule[0], { months: 6 });
        schedule.unshift(next);
      }
      schedule.pop();
    }
  } else {
    if (!backward) {
      for (let i = 1; i < count; i++) {
        const next = add(schedule[schedule.length - 1], delta);
        schedule.push(next);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const next = sub(schedule[0], delta);
        schedule.unshift(next);
      }
      schedule.pop();
    }
  }

  return schedule.map(date => ({ date, label: formatLabel(date, frequency) }));
}

// Validate if a period is valid in a sequence
export function isValidPeriod(
  date: Date,
  startDate: Date,
  frequency: Frequency,
  maxCycles: number = 1000
): boolean {
  const delta = getInterval(frequency);
  let current = startDate;

  for (let i = 0; i < maxCycles; i++) {
    if (Math.abs(differenceInMilliseconds(date, current)) < 1000) return true;
    if (date < current) return false;
    current = add(current, delta);
  }

  return false;
}

// This function only helps guess the format, not determine the actual frequency
export function detectPeriodFormat(period: string): string {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(period)) {
    return 'MINUTE_FORMAT';
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:00$/.test(period)) {
    return 'HOURLY_FORMAT';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return 'DAILY_FORMAT';
  } else if (/^\d{4}-W\d{1,2}$/.test(period)) {
    return 'WEEKLY_FORMAT';
  } else if (/^\d{4}-\d{2}$/.test(period)) {
    return 'MONTHLY_FORMAT';
  } else if (/^\d{4}-Q[1-4]$/.test(period)) {
    return 'QUARTERLY_FORMAT';
  } else if (/^\d{4}-T[1-3]$/.test(period)) {
    return 'TRIANNUAL_FORMAT';
  } else if (/^\d{4}-H[1-2]$/.test(period)) {
    return 'SEMIANNUAL_FORMAT';
  } else if (/^\d{4}$/.test(period)) {
    return 'ANNUAL_FORMAT';
  }

  return 'UNKNOWN_FORMAT';
}

// Parse period string to Date based on frequency with enhanced validation
export function parsePeriod(period: string, frequency: Frequency): Date {
  try {
    switch (frequency) {
      case 'MINUTE':
        const minuteParts = period.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
        if (!minuteParts) throw new Error("Invalid minute format");

        const minuteYear = parseInt(minuteParts[1]);
        const minuteMonth = parseInt(minuteParts[2]);
        const minuteDay = parseInt(minuteParts[3]);
        const hour = parseInt(minuteParts[4]);
        const minute = parseInt(minuteParts[5]);

        if (minuteMonth < 1 || minuteMonth > 12) throw new Error(`Invalid month: ${minuteMonth}`);
        if (minuteDay < 1 || minuteDay > new Date(minuteYear, minuteMonth, 0).getDate()) throw new Error(`Invalid day: ${minuteDay}`);
        if (hour < 0 || hour > 23) throw new Error(`Invalid hour: ${hour}`);
        if (minute < 0 || minute > 59) throw new Error(`Invalid minute: ${minute}`);

        return new Date(minuteYear, minuteMonth - 1, minuteDay, hour, minute);

      case 'HOURLY':
        const hourlyParts = period.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):00$/);
        if (!hourlyParts) throw new Error("Invalid hourly format");

        const hourlyYear = parseInt(hourlyParts[1]);
        const hourlyMonth = parseInt(hourlyParts[2]);
        const hourlyDay = parseInt(hourlyParts[3]);
        const hourlyHour = parseInt(hourlyParts[4]);

        if (hourlyMonth < 1 || hourlyMonth > 12) throw new Error(`Invalid month: ${hourlyMonth}`);
        if (hourlyDay < 1 || hourlyDay > new Date(hourlyYear, hourlyMonth, 0).getDate()) throw new Error(`Invalid day: ${hourlyDay}`);
        if (hourlyHour < 0 || hourlyHour > 23) throw new Error(`Invalid hour: ${hourlyHour}`);

        return new Date(hourlyYear, hourlyMonth - 1, hourlyDay, hourlyHour, 0);

      case 'MONTHLY':
      case 'BIMONTHLY':
        const monthParts = period.split('-');
        const year = parseInt(monthParts[0]);
        const month = parseInt(monthParts[1]);

        if (month < 1 || month > 12) {
          throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`);
        }

        return new Date(year, month - 1, 1);

      case 'QUARTERLY':
        const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/);
        if (!quarterMatch) throw new Error("Invalid quarterly format");

        const quarterYear = parseInt(quarterMatch[1]);
        const quarter = parseInt(quarterMatch[2]);

        if (quarter < 1 || quarter > 4) {
          throw new Error(`Invalid quarter: ${quarter}. Quarter must be between 1 and 4.`);
        }

        return new Date(quarterYear, (quarter - 1) * 3, 1);

      case 'TRIANNUAL':
        const triannualMatch = period.match(/^(\d{4})-T([1-3])$/);
        if (!triannualMatch) throw new Error("Invalid triannual format");

        const triannualYear = parseInt(triannualMatch[1]);
        const third = parseInt(triannualMatch[2]);

        if (third < 1 || third > 3) {
          throw new Error(`Invalid third: ${third}. Third must be between 1 and 3.`);
        }

        // T1: Jan(0), T2: May(4), T3: Sep(8)
        const thirdStartMonth = (third - 1) * 4;
        return new Date(triannualYear, thirdStartMonth, 1);

      case 'SEMIANNUAL':
        const semiannualMatch = period.match(/^(\d{4})-H([1-2])$/);
        if (!semiannualMatch) throw new Error("Invalid semiannual format");

        const semiannualYear = parseInt(semiannualMatch[1]);
        const half = parseInt(semiannualMatch[2]);

        if (half < 1 || half > 2) {
          throw new Error(`Invalid half: ${half}. Half must be either 1 or 2.`);
        }

        // H1: Jan(0), H2: Jul(6)
        const halfStartMonth = (half - 1) * 6;
        return new Date(semiannualYear, halfStartMonth, 1);

      case 'ANNUAL':
        return new Date(parseInt(period), 0, 1);

      case 'WEEKLY':
      case 'BIWEEKLY':
        const weekMatch = period.match(/^(\d{4})-W(\d{1,2})$/);
        if (!weekMatch) throw new Error("Invalid week format");

        const weekYear = parseInt(weekMatch[1]);
        const weekNum = parseInt(weekMatch[2]);

        if (weekNum < 1 || weekNum > 53) {
          throw new Error(`Invalid week number: ${weekNum}. Week must be between 1 and 53.`);
        }

        const firstDayOfYear = new Date(weekYear, 0, 1);
        const dayOfWeek = firstDayOfYear.getDay();
        const daysToThursday = (dayOfWeek <= 4) ? (4 - dayOfWeek) : (11 - dayOfWeek);

        const firstThursday = new Date(weekYear, 0, 1 + daysToThursday);
        const firstDayOfWeek = new Date(firstThursday);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 3);

        const requestedWeek = new Date(firstDayOfWeek);
        requestedWeek.setDate(requestedWeek.getDate() + (weekNum - 1) * 7);

        return requestedWeek;

      case 'DAILY':
        const dateParts = period.split('-');
        const dayYear = parseInt(dateParts[0]);
        const dayMonth = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);

        if (dayMonth < 1 || dayMonth > 12) {
          throw new Error(`Invalid month: ${dayMonth}. Month must be between 1 and 12.`);
        }

        const daysInMonth = new Date(dayYear, dayMonth, 0).getDate();
        if (day < 1 || day > daysInMonth) {
          throw new Error(`Invalid day: ${day}. Day must be between 1 and ${daysInMonth} for month ${dayMonth}.`);
        }

        return new Date(dayYear, dayMonth - 1, day);

      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  } catch (error) {
    console.error(`Error parsing period ${period} with frequency ${frequency}:`, error);
    throw error;
  }
}

// Generate a start period for a given frequency
export function generateStartPeriod(frequency: string): string {
  const today = new Date();

  switch (frequency.toLowerCase()) {
    case 'minute':
      return format(today, 'yyyy-MM-dd HH:mm');
    case 'hourly':
      return format(today, 'yyyy-MM-dd HH:00');
    case 'daily':
      return format(today, 'yyyy-MM-dd');
    case 'weekly':
    case 'biweekly':
      return `${format(today, 'yyyy')}-W${format(today, 'ww')}`;
    case 'monthly':
    case 'bimonthly':
      return format(today, 'yyyy-MM');
    case 'quarterly':
      return `${today.getFullYear()}-Q${getQuarter(today)}`;
    case 'triannual':
      // Get which third of the year (T1: Jan-Apr, T2: May-Aug, T3: Sep-Dec)
      const month = today.getMonth();
      const third = Math.floor(month / 4) + 1;
      return `${today.getFullYear()}-T${third}`;
    case 'semiannual':
      // Get which half of the year (H1: Jan-Jun, H2: Jul-Dec)
      const halfYear = today.getMonth() < 6 ? 1 : 2;
      return `${today.getFullYear()}-H${halfYear}`;
    case 'annual':
      return today.getFullYear().toString();
    default:
      return format(today, 'yyyy-MM');
  }
}

// Generate sequence based on existing periods
export default function generateSequence(
  existingPeriods: string[],
  count: number,
  forward: boolean,
  startPeriod?: string,
  frequencyString?: string
): string[] {
  console.log("generateSequence called with:", {
    existingPeriods,
    count,
    forward,
    startPeriod,
    frequencyString
  });

  // Map API frequency string to enum type
  const frequency = frequencyString ? mapApiFrequencyToEnum(frequencyString) : 'MONTHLY';
  console.log("Using frequency:", frequency);

  // Special handling for weekly frequency with existing periods
  if (frequency === 'WEEKLY' && existingPeriods && existingPeriods.length > 0 && existingPeriods[0] !== '') {
    // Filter out any empty periods
    const validPeriods = existingPeriods.filter(p => p && p.trim() !== '');

    if (validPeriods.length > 0) {
      // Sort periods to ensure we're working with the correct sequence
      validPeriods.sort((a, b) => a.localeCompare(b));

      // Use the appropriate period based on direction
      const referencePeriod = forward ? validPeriods[validPeriods.length - 1] : validPeriods[0];
      console.log("Weekly: using reference period:", referencePeriod, "Direction:", forward ? "forward" : "backward");

      // Weekly periods have format YYYY-Wnn
      const match = referencePeriod.match(/^(\d{4})-W(\d{1,2})$/);
      if (match) {
        const year = parseInt(match[1]);
        const week = parseInt(match[2]);

        // Generate sequence in the appropriate direction
        const result: string[] = [];

        for (let i = 1; i <= count; i++) {
          let nextWeek: number, nextYear: number;

          if (forward) {
            nextWeek = week + i;
            nextYear = year;

            // Handle year rollover
            while (nextWeek > 52) {
              nextWeek -= 52;
              nextYear++;
            }
          } else {
            nextWeek = week - i;
            nextYear = year;

            // Handle year rollover for backward direction
            while (nextWeek < 1) {
              nextWeek += 52;
              nextYear--;
            }
          }

          result.push(`${nextYear}-W${nextWeek.toString().padStart(2, '0')}`);
        }

        // Important fix: If we're generating backward, we need to reverse the result array
        // to ensure the periods are in ascending order for correct insertion
        if (!forward) {
          result.reverse();
          console.log("Reversed backward weekly sequence for chronological order");
        }

        console.log("Generated weekly sequence:", result);
        return result;
      }
    }
  }

  // If there are no existing periods and we have a startPeriod, use that
  if ((existingPeriods.length === 0 || existingPeriods[0] === '') && startPeriod) {
    try {
      console.log("Generating sequence from start period:", startPeriod);

      // Special handling for weekly frequency with start period
      if (frequency === 'WEEKLY') {
        const match = startPeriod.match(/^(\d{4})-W(\d{1,2})$/);
        if (match) {
          const year = parseInt(match[1]);
          const week = parseInt(match[2]);

          // Generate sequence
          const result: string[] = [startPeriod]; // Include the start period

          // Generate subsequent periods
          for (let i = 1; i < count; i++) {
            let nextWeek = week + i;
            let nextYear = year;

            // Handle year rollover
            while (nextWeek > 52) {
              nextWeek -= 52;
              nextYear++;
            }

            result.push(`${nextYear}-W${nextWeek.toString().padStart(2, '0')}`);
          }

          // If backward, we need to reverse the order (but maintain chronological order)
          if (!forward) {
            result.reverse();
          }

          return result;
        }
      }

      // For other frequencies, use the normal approach
      const date = parsePeriod(startPeriod, frequency);
      console.log("Parsed date:", date);
      const schedule = generateSchedule(date, frequency, count, !forward);
      return schedule.map(item => item.label);
    } catch (error) {
      console.error("Error generating sequence from start period:", error);
      return [];
    }
  }

  // For other frequencies or when no special handling applies, use the original logic
  if (existingPeriods.length > 0 && existingPeriods[0] !== '') {
    try {
      // Filter out any empty periods
      const validPeriods = existingPeriods.filter(p => p && p.trim() !== '');
      if (validPeriods.length === 0) {
        if (startPeriod) {
          console.log("No valid periods, using provided start period:", startPeriod);
          const date = parsePeriod(startPeriod, frequency);
          const schedule = generateSchedule(date, frequency, count, !forward);
          return schedule.map(item => item.label);
        }
        console.log("No valid periods and no start period provided");
        return [];
      }

      // Use the most appropriate period based on direction
      const referencePeriod = forward
        ? validPeriods[validPeriods.length - 1] // Last period for forward
        : validPeriods[0]; // First period for backward

      console.log("Using reference period:", referencePeriod);

      // Try to parse the period using the provided frequency
      try {
        console.log("Attempting to parse with frequency:", frequency);
        const date = parsePeriod(referencePeriod, frequency);
        console.log("Successfully parsed date:", date);

        // Generate schedule using the date and frequency
        const schedule = generateSchedule(date, frequency, count + 1, !forward);

        // Filter out the first item as it's the reference period
        return schedule.slice(1).map(item => item.label);
      } catch (error) {
        console.error(`Error parsing with frequency ${frequency}:`, error);

        // For backward compatibility, try a more generic approach
        let date;
        console.log("Trying alternative parsing method");

        if (frequency === 'MINUTE') {
          const parts = referencePeriod.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
          if (parts) {
            date = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]), parseInt(parts[4]), parseInt(parts[5]));
          }
        } else if (frequency === 'HOURLY') {
          const parts = referencePeriod.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):00$/);
          if (parts) {
            date = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]), parseInt(parts[4]), 0);
          }
        } else if (frequency === 'DAILY') {
          const parts = referencePeriod.split('-');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        } else if (frequency === 'WEEKLY' || frequency === 'BIWEEKLY') {
          const parts = referencePeriod.match(/^(\d{4})-W(\d{1,2})$/);
          if (parts) {
            const year = parseInt(parts[1]);
            const week = parseInt(parts[2]);

            // Approximate - not perfect but functional
            date = new Date(year, 0, 1 + (week - 1) * 7);
          }
        } else if (frequency === 'MONTHLY' || frequency === 'BIMONTHLY') {
          const parts = referencePeriod.split('-');
          if (parts.length === 2) {
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
          }
        } else if (frequency === 'QUARTERLY') {
          const quarterMatch = referencePeriod.match(/^(\d{4})-Q([1-4])$/);
          if (quarterMatch) {
            const year = parseInt(quarterMatch[1]);
            const quarter = parseInt(quarterMatch[2]);
            date = new Date(year, (quarter - 1) * 3, 1);
          }
        } else if (frequency === 'TRIANNUAL') {
          const triannualMatch = referencePeriod.match(/^(\d{4})-T([1-3])$/);
          if (triannualMatch) {
            const year = parseInt(triannualMatch[1]);
            const third = parseInt(triannualMatch[2]);
            date = new Date(year, (third - 1) * 4, 1);
          }
        } else if (frequency === 'SEMIANNUAL') {
          const semiannualMatch = referencePeriod.match(/^(\d{4})-H([1-2])$/);
          if (semiannualMatch) {
            const year = parseInt(semiannualMatch[1]);
            const half = parseInt(semiannualMatch[2]);
            date = new Date(year, (half - 1) * 6, 1);
          }
        } else if (frequency === 'ANNUAL') {
          if (/^\d{4}$/.test(referencePeriod)) {
            date = new Date(parseInt(referencePeriod), 0, 1);
          }
        }

        if (!date) {
          console.error("Failed to parse date with alternative method");
          return [];
        }

        console.log("Parsed date with alternative method:", date);
        const schedule = generateSchedule(date, frequency, count + 1, !forward);
        return schedule.slice(1).map(item => item.label);
      }
    } catch (error) {
      console.error("Error generating sequence from existing periods:", error);
      return [];
    }
  }

  // Fallback to default (empty array)
  console.log("No conditions met, returning empty array");
  return [];
}

// Map API frequency string to our enum
export function mapApiFrequencyToEnum(frequencyString: string): Frequency {
  const mapping: Record<string, Frequency> = {
    'minute': 'MINUTE',
    'hourly': 'HOURLY',
    'daily': 'DAILY',
    'weekly': 'WEEKLY',
    'biweekly': 'BIWEEKLY',
    'monthly': 'MONTHLY',
    'bimonthly': 'BIMONTHLY',
    'quarterly': 'QUARTERLY',
    'triannual': 'TRIANNUAL',
    'semiannual': 'SEMIANNUAL',
    'annual': 'ANNUAL'
  };

  return mapping[frequencyString.toLowerCase()] || 'CUSTOM';
}
