export type CalculationMethodName =
  | 'Egyptian'
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'NorthAmerica'
  | 'Karachi'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait';

export type MadhabName = 'shafii' | 'hanafi';

export interface CoarseLocation {
  latitude: number;
  longitude: number;
  cityNameAr: string;
  cityNameEn: string;
  countryNameAr: string;
  countryNameEn: string;
  isManual: boolean;
}

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimesDay {
  dateStr: string; // YYYY-MM-DD
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  nextFajr?: Date;
}

export interface PrayerNotificationConfig {
  notificationsEnabled: boolean;
  fajr: { enabled: boolean; offsetMinutes: number; sound: boolean; athanEnabled?: boolean };
  dhuhr: { enabled: boolean; offsetMinutes: number; sound: boolean; athanEnabled?: boolean };
  asr: { enabled: boolean; offsetMinutes: number; sound: boolean; athanEnabled?: boolean };
  maghrib: { enabled: boolean; offsetMinutes: number; sound: boolean; athanEnabled?: boolean };
  isha: { enabled: boolean; offsetMinutes: number; sound: boolean; athanEnabled?: boolean };
  checkinReminderMinutes: number; // Minutes after prayer time (default 30)
  checkinFollowUpEnabled: boolean; // Max 1 follow-up reminder
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "23:00"
  quietHoursEnd: string;   // e.g. "04:30"
  /** minutes after the adhan for «هل صليت؟», per prayer (defaults: after the congregation) */
  followUpMin?: Partial<Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>>;
  /** heads-up before the adhan, 0 = off */
  preAlertMin?: number;
  preAlertByPrayer?: Partial<Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>>;
}

export type CheckinStatus = 'on_time' | 'late' | 'qada' | 'rest' | 'none';
export type CheckinMode = 'jamaa' | 'alone';
export type CheckinPlace = 'masjid' | 'home';

export interface PrayerCheckinRecord {
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  dateStr: string; // YYYY-MM-DD
  status: CheckinStatus;
  mode?: CheckinMode;
  /** where a congregational prayer was held */
  place?: CheckinPlace;
  checkedInAt: string;
  pointsAwarded: number;
  xpAwarded: number;
}
