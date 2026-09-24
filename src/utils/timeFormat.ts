import { Alarm } from '../types/alarm';

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatTime24to12(time24: string): { time: string; period: 'AM' | 'PM'; hour12: number; minute: number } {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;

  const minutePadded = m.toString().padStart(2, '0');
  return {
    time: `${hour12}:${minutePadded}`,
    period,
    hour12,
    minute: m,
  };
}

export function formatDisplayTime(time24: string, use24h: boolean): string {
  if (use24h) return time24;
  const { time, period } = formatTime24to12(time24);
  return `${time} ${period}`;
}

export function getDaysLabel(days: number[]): string {
  if (!days || days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && [0, 6].every((d) => days.includes(d))) return 'Weekends';

  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES_SHORT[d])
    .join(', ');
}

/**
 * Calculates milliseconds until the next occurrence of this alarm
 */
export function getMsUntilAlarm(alarm: Alarm, fromDate = new Date()): number {
  if (alarm.snoozedUntil && alarm.snoozedUntil > fromDate.getTime()) {
    return alarm.snoozedUntil - fromDate.getTime();
  }

  const [targetH, targetM] = alarm.time.split(':').map(Number);
  const currentDay = fromDate.getDay();
  const currentH = fromDate.getHours();
  const currentM = fromDate.getMinutes();
  const currentS = fromDate.getSeconds();
  const currentMs = fromDate.getMilliseconds();

  const currentTimeInMinutes = currentH * 60 + currentM;
  const targetTimeInMinutes = targetH * 60 + targetM;

  // If repeat days are specified
  if (alarm.days && alarm.days.length > 0) {
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      if (alarm.days.includes(checkDay)) {
        if (dayOffset === 0) {
          if (targetTimeInMinutes > currentTimeInMinutes) {
            const minutesDiff = targetTimeInMinutes - currentTimeInMinutes;
            return minutesDiff * 60 * 1000 - currentS * 1000 - currentMs;
          }
        } else {
          const totalDaysDiff = dayOffset;
          const targetTimestamp = new Date(fromDate);
          targetTimestamp.setDate(targetTimestamp.getDate() + totalDaysDiff);
          targetTimestamp.setHours(targetH, targetM, 0, 0);
          return targetTimestamp.getTime() - fromDate.getTime();
        }
      }
    }
  } else {
    // One-time alarm: if time passed today, next is tomorrow
    let daysAhead = 0;
    if (targetTimeInMinutes <= currentTimeInMinutes) {
      daysAhead = 1;
    }
    const targetTimestamp = new Date(fromDate);
    targetTimestamp.setDate(targetTimestamp.getDate() + daysAhead);
    targetTimestamp.setHours(targetH, targetM, 0, 0);
    return targetTimestamp.getTime() - fromDate.getTime();
  }

  return Infinity;
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0 || !isFinite(ms)) return 'ringing soon';

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}
