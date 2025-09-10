import {  addWeeks, subWeeks,  startOfWeek, getWeek, getYear } from 'date-fns';

/**
 * Parses a weekly period string (YYYY-WNN) to a date representing the start of that week
 * @param periodString The period string in YYYY-WNN format
 * @returns Date representing the start of the week
 */
export function parseWeeklyPeriod(periodString: string): Date {
  try {
    const match = periodString.match(/^(\d{4})-W(\d{1,2})$/);
    if (!match) {
      throw new Error(`Invalid weekly period format: ${periodString}`);
    }

    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);

    if (week < 1 || week > 53) {
      throw new Error(`Invalid week number: ${week}`);
    }

    // Create a date for January 4th of the specified year
    // January 4th is always in week 1 according to ISO 8601
    const jan4 = new Date(year, 0, 4);

    // Get the Monday of the week containing January 4th (start of week 1)
    const firstWeek = startOfWeek(jan4, { weekStartsOn: 1 });

    // Add the specified number of weeks (minus 1 because we're already at week 1)
    const result = addWeeks(firstWeek, week - 1);

    return result;
  } catch (error) {
    console.error('Error parsing weekly period:', error);
    throw error;
  }
}

/**
 * Formats a date as a weekly period string (YYYY-WNN)
 * @param date The date to format
 * @returns Period string in YYYY-WNN format
 */
export function formatWeeklyPeriod(date: Date): string {
  // Get the year and week number according to ISO 8601
  const year = getYear(date);
  const weekNum = getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });

  // Format as YYYY-WNN
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Generates a sequence of weekly period strings
 * @param startPeriod The starting period in YYYY-WNN format
 * @param count Number of periods to generate
 * @param forward Direction of sequence (true = forward, false = backward)
 * @returns Array of period strings
 */
export function generateWeeklySequence(
  startPeriod: string,
  count: number,
  forward: boolean = true
): string[] {
  try {
    // Parse the start period
    const match = startPeriod.match(/^(\d{4})-W(\d{1,2})$/);
    if (!match) {
      throw new Error(`Invalid weekly period format: ${startPeriod}`);
    }

    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);

    // Generate the sequence
    const result: string[] = [startPeriod]; // Include the start period if needed

    // Generate the sequence in the requested direction
    for (let i = 1; i < count; i++) {
      let nextWeek: number, nextYear: number;

      if (forward) {
        // Forward: add weeks
        nextWeek = week + i;
        nextYear = year;

        // Handle year rollover
        while (nextWeek > 52) {
          nextWeek -= 52;
          nextYear++;
        }
      } else {
        // Backward: subtract weeks
        nextWeek = week - i;
        nextYear = year;

        // Handle year rollover
        while (nextWeek < 1) {
          nextWeek += 52;
          nextYear--;
        }
      }

      result.push(`${nextYear}-W${nextWeek.toString().padStart(2, '0')}`);
    }

    // If generating backward, we need to ensure periods are in chronological order (ascending)
    // This way when inserting above, periods will be correctly ordered
    if (!forward) {
      result.reverse();
    }

    // Remove the initial reference period if not needed
    if (result.length > count) {
      result.shift();
    }

    return result;
  } catch (error) {
    console.error('Error generating weekly sequence:', error);
    return [];
  }
}

/**
 * Gets the next weekly period after the given period
 * @param period Current period in YYYY-WNN format
 * @returns Next period in YYYY-WNN format
 */
export function getNextWeeklyPeriod(period: string): string {
  const date = parseWeeklyPeriod(period);
  const nextDate = addWeeks(date, 1);
  return formatWeeklyPeriod(nextDate);
}

/**
 * Gets the previous weekly period before the given period
 * @param period Current period in YYYY-WNN format
 * @returns Previous period in YYYY-WNN format
 */
export function getPreviousWeeklyPeriod(period: string): string {
  const date = parseWeeklyPeriod(period);
  const prevDate = subWeeks(date, 1);
  return formatWeeklyPeriod(prevDate);
}

/**
 * Validates if a string is a properly formatted weekly period
 * @param period Period string to validate
 * @returns true if valid, false otherwise
 */
export function isValidWeeklyPeriod(period: string): boolean {
  if (!period) return false;

  const match = period.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return false;

  const week = parseInt(match[2], 10);
  return week >= 1 && week <= 53;
}

/**
 * Validates if a weekly period is consecutive to another
 * @param previous Previous period in YYYY-WNN format
 * @param current Current period in YYYY-WNN format
 * @returns true if current is consecutive to previous, false otherwise
 */
export function areConsecutiveWeeklyPeriods(previous: string, current: string): boolean {
  try {
    const nextExpected = getNextWeeklyPeriod(previous);
    return nextExpected === current;
  } catch  {
    return false;
  }
}
