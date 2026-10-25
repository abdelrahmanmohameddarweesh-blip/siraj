import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import {
  CalculationMethodName,
  MadhabName,
  PrayerTimesDay,
  PrayerKey,
} from './types';

export function getCalculationParameters(method: CalculationMethodName, madhab: MadhabName) {
  let params;
  switch (method) {
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    default:
      params = CalculationMethod.Egyptian();
  }

  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export function calculatePrayerTimes(
  coords: { latitude: number; longitude: number },
  date: Date,
  method: CalculationMethodName = 'Egyptian',
  madhab: MadhabName = 'shafii'
): PrayerTimesDay {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = getCalculationParameters(method, madhab);
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  // Calculate next day's Fajr to close the Isha window
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return {
    dateStr,
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    nextFajr: tomorrowTimes.fajr,
  };
}

export function calculateRollingWeek(
  coords: { latitude: number; longitude: number },
  startDate: Date = new Date(),
  days = 7,
  method: CalculationMethodName = 'Egyptian',
  madhab: MadhabName = 'shafii'
): PrayerTimesDay[] {
  const result: PrayerTimesDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    result.push(calculatePrayerTimes(coords, d, method, madhab));
  }
  return result;
}

export interface PrayerWindowInfo {
  activePrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
  nextPrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerTime: Date;
  timeRemainingMs: number;
  timeRemainingFormatted: string;
}

export function getCurrentPrayerWindow(
  dayTimes: PrayerTimesDay,
  now = new Date()
): PrayerWindowInfo {
  const nowMs = now.getTime();

  const fajrMs = dayTimes.fajr.getTime();
  const sunriseMs = dayTimes.sunrise.getTime();
  const dhuhrMs = dayTimes.dhuhr.getTime();
  const asrMs = dayTimes.asr.getTime();
  const maghribMs = dayTimes.maghrib.getTime();
  const ishaMs = dayTimes.isha.getTime();
  const nextFajrMs = dayTimes.nextFajr ? dayTimes.nextFajr.getTime() : ishaMs + 8 * 3600 * 1000;

  let activePrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null = null;
  let nextPrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' = 'fajr';
  let nextPrayerTime: Date = dayTimes.fajr;

  if (nowMs < fajrMs) {
    activePrayer = null; // Before Fajr
    nextPrayer = 'fajr';
    nextPrayerTime = dayTimes.fajr;
  } else if (nowMs >= fajrMs && nowMs < sunriseMs) {
    activePrayer = 'fajr';
    nextPrayer = 'dhuhr';
    nextPrayerTime = dayTimes.dhuhr;
  } else if (nowMs >= sunriseMs && nowMs < dhuhrMs) {
    activePrayer = null; // Duha period
    nextPrayer = 'dhuhr';
    nextPrayerTime = dayTimes.dhuhr;
  } else if (nowMs >= dhuhrMs && nowMs < asrMs) {
    activePrayer = 'dhuhr';
    nextPrayer = 'asr';
    nextPrayerTime = dayTimes.asr;
  } else if (nowMs >= asrMs && nowMs < maghribMs) {
    activePrayer = 'asr';
    nextPrayer = 'maghrib';
    nextPrayerTime = dayTimes.maghrib;
  } else if (nowMs >= maghribMs && nowMs < ishaMs) {
    activePrayer = 'maghrib';
    nextPrayer = 'isha';
    nextPrayerTime = dayTimes.isha;
  } else if (nowMs >= ishaMs && nowMs < nextFajrMs) {
    activePrayer = 'isha';
    nextPrayer = 'fajr';
    nextPrayerTime = dayTimes.nextFajr || new Date(ishaMs + 8 * 3600 * 1000);
  } else {
    activePrayer = null;
    nextPrayer = 'fajr';
    nextPrayerTime = dayTimes.nextFajr || dayTimes.fajr;
  }

  const timeRemainingMs = Math.max(0, nextPrayerTime.getTime() - nowMs);
  const totalSec = Math.floor(timeRemainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const timeRemainingFormatted = `${hours > 0 ? `${hours}س ` : ''}${minutes}د`;

  return {
    activePrayer,
    nextPrayer,
    nextPrayerTime,
    timeRemainingMs,
    timeRemainingFormatted,
  };
}

export function isPrayerWindowActive(
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  dayTimes: PrayerTimesDay,
  now = new Date()
): boolean {
  const nowMs = now.getTime();
  switch (prayer) {
    case 'fajr':
      return nowMs >= dayTimes.fajr.getTime() && nowMs < dayTimes.sunrise.getTime();
    case 'dhuhr':
      return nowMs >= dayTimes.dhuhr.getTime() && nowMs < dayTimes.asr.getTime();
    case 'asr':
      return nowMs >= dayTimes.asr.getTime() && nowMs < dayTimes.maghrib.getTime();
    case 'maghrib':
      return nowMs >= dayTimes.maghrib.getTime() && nowMs < dayTimes.isha.getTime();
    case 'isha': {
      const nextFajrMs = dayTimes.nextFajr ? dayTimes.nextFajr.getTime() : dayTimes.isha.getTime() + 8 * 3600 * 1000;
      return nowMs >= dayTimes.isha.getTime() && nowMs < nextFajrMs;
    }
  }
}

export function formatPrayerClock(date: Date, lang: 'ar' | 'en' = 'ar'): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const period = lang === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');
  return `${hours}:${minStr} ${period}`;
}

