import {
  calculatePrayerTimes,
  calculateRollingWeek,
  getCurrentPrayerWindow,
  isPrayerWindowActive,
  formatPrayerClock,
} from '../prayerTimesService';
import { DEFAULT_CITY } from '../cities';

function runPrayerTests() {
  console.log('Running Prayer Service tests...');

  // 1. Calculate prayer times offline for Cairo
  const testDate = new Date('2026-10-12T12:00:00Z');
  const times = calculatePrayerTimes(DEFAULT_CITY, testDate, 'Egyptian', 'shafii');

  if (!times.fajr || !times.dhuhr || !times.asr || !times.maghrib || !times.isha) {
    throw new Error(`Offline prayer times missing fields: ${JSON.stringify(times)}`);
  }

  // Ensure prayer ordering
  if (
    times.fajr.getTime() >= times.sunrise.getTime() ||
    times.sunrise.getTime() >= times.dhuhr.getTime() ||
    times.dhuhr.getTime() >= times.asr.getTime() ||
    times.asr.getTime() >= times.maghrib.getTime() ||
    times.maghrib.getTime() >= times.isha.getTime()
  ) {
    throw new Error('Prayer times chronological order check failed!');
  }

  // 2. Rolling week calculation
  const rolling = calculateRollingWeek(DEFAULT_CITY, testDate, 7, 'Egyptian', 'shafii');
  if (rolling.length !== 7) {
    throw new Error(`Expected 7 days in rolling week, got ${rolling.length}`);
  }

  // 3. Current window calculation
  const windowInfo = getCurrentPrayerWindow(times, times.dhuhr);
  if (windowInfo.activePrayer !== 'dhuhr') {
    throw new Error(`Expected active prayer at Dhuhr to be 'dhuhr', got: ${windowInfo.activePrayer}`);
  }
  if (windowInfo.nextPrayer !== 'asr') {
    throw new Error(`Expected next prayer after Dhuhr to be 'asr', got: ${windowInfo.nextPrayer}`);
  }

  // 4. isPrayerWindowActive
  const isDhuhrActive = isPrayerWindowActive('dhuhr', times, new Date(times.dhuhr.getTime() + 10 * 60000));
  if (!isDhuhrActive) {
    throw new Error('isPrayerWindowActive failed for Dhuhr + 10min');
  }

  const isFajrActive = isPrayerWindowActive('fajr', times, new Date(times.dhuhr.getTime() + 10 * 60000));
  if (isFajrActive) {
    throw new Error('isPrayerWindowActive returned true for Fajr during Dhuhr!');
  }

  // 5. formatPrayerClock
  const clockSample = new Date('2026-10-12T14:30:00');
  const clockAr = formatPrayerClock(clockSample, 'ar');
  const clockEn = formatPrayerClock(clockSample, 'en');
  if (!clockAr.includes('م') || !clockEn.includes('PM')) {
    throw new Error(`formatPrayerClock failed: ar=${clockAr}, en=${clockEn}`);
  }

  console.log('✅ All Prayer Service unit tests passed successfully!');
}

runPrayerTests();
