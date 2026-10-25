import {
  calculateEventPoints,
  isEventIdempotent,
  evaluateHeroLevel,
  calculateStreak,
  calculateMonthlyJamaaStats,
  generateDailyPath,
  evaluateMilestoneTitles,
} from '../engine';
import { HeroEvent, HeroProfile } from '../types';

function runTests() {
  console.log('Running Hero Engine unit tests...');

  // 1. Scoring tests
  const p1 = calculateEventPoints({
    uid: 'u1',
    type: 'prayer_checkin',
    source: 'test',
    value: 1,
    meta: { status: 'on_time', jamaa: true },
  });
  if (p1.siraj !== 15 || p1.xp !== 25) throw new Error(`Prayer on-time jamaa failed: ${JSON.stringify(p1)}`);

  const p2 = calculateEventPoints({
    uid: 'u1',
    type: 'prayer_checkin',
    source: 'test',
    value: 1,
    meta: { status: 'on_time', jamaa: false },
  });
  if (p2.siraj !== 10 || p2.xp !== 15) throw new Error(`Prayer on-time alone failed: ${JSON.stringify(p2)}`);

  const p3 = calculateEventPoints({
    uid: 'u1',
    type: 'prayer_checkin',
    source: 'test',
    value: 1,
    meta: { status: 'late', jamaa: true },
  });
  if (p3.siraj !== 8 || p3.xp !== 12) throw new Error(`Prayer late jamaa failed: ${JSON.stringify(p3)}`);

  const athkarPoints = calculateEventPoints({
    uid: 'u1',
    type: 'athkar_done',
    source: 'test',
    value: 1,
  });
  if (athkarPoints.siraj !== 10 || athkarPoints.xp !== 15) throw new Error(`Athkar points failed: ${JSON.stringify(athkarPoints)}`);

  // 2. Idempotency tests
  const existingEvents: HeroEvent[] = [
    {
      id: 'e1',
      uid: 'u1',
      type: 'prayer_checkin',
      source: 'test',
      value: 1,
      meta: { prayer: 'fajr', dateStr: '2026-10-11' },
      at: '2026-10-11T05:00:00Z',
    },
  ];

  const duplicateFajr = isEventIdempotent(existingEvents, {
    uid: 'u1',
    type: 'prayer_checkin',
    source: 'test',
    value: 1,
    meta: { prayer: 'fajr', dateStr: '2026-10-11' },
    at: '2026-10-11T05:10:00Z',
  });
  if (duplicateFajr !== false) throw new Error('Duplicate prayer was not caught as idempotent');

  const differentPrayer = isEventIdempotent(existingEvents, {
    uid: 'u1',
    type: 'prayer_checkin',
    source: 'test',
    value: 1,
    meta: { prayer: 'dhuhr', dateStr: '2026-10-11' },
    at: '2026-10-11T12:30:00Z',
  });
  if (differentPrayer !== true) throw new Error('Different prayer was falsely flagged as duplicate');

  // 3. Level evaluation
  if (evaluateHeroLevel(0).level !== 1) throw new Error('Level 1 failed');
  if (evaluateHeroLevel(100).level !== 2) throw new Error('Level 2 failed');
  if (evaluateHeroLevel(6500).level !== 10) throw new Error('Level 10 failed');

  // 4. Jamaa stats
  const jamaaStats = calculateMonthlyJamaaStats(
    [
      { id: '1', uid: 'u1', type: 'prayer_checkin', source: '', value: 1, meta: { jamaa: true, dateStr: '2026-10-01' }, at: '2026-10-01T12:00:00Z' },
      { id: '2', uid: 'u1', type: 'prayer_checkin', source: '', value: 1, meta: { jamaa: false, dateStr: '2026-10-01' }, at: '2026-10-01T15:00:00Z' },
    ],
    '2026-10'
  );
  if (jamaaStats.jamaa !== 1 || jamaaStats.total !== 2 || jamaaStats.ratio !== 50) {
    throw new Error(`Jamaa stats failed: ${JSON.stringify(jamaaStats)}`);
  }

  // 5. Title evaluation (including private Jamaa title)
  const mockProfile: HeroProfile = {
    uid: 'u1',
    displayName: 'البطل',
    xp: 1000,
    level: 5,
    levelTitleAr: 'فارس',
    levelTitleEn: 'Champion',
    sirajBalance: 100,
    score: 1000,
    currentStreak: 10,
    longestStreak: 10,
    streakFreezeCount: 1,
    weeklyDaysCompleted: 5,
    jamaaCountThisMonth: 25,
    totalPrayersThisMonth: 30,
    mutashabihatCorrectCount: 35,
    quranCorrectCount: 55,
    triviaCorrectCount: 45,
    unlockedTitles: [],
    unlockedItems: [],
    createdAt: '',
    updatedAt: '',
  };

  const titles = evaluateMilestoneTitles(mockProfile, 25);
  if (!titles.includes('title_jamaa_guardian')) throw new Error('Private jamaa milestone title not unlocked');
  if (!titles.includes('title_hafidh')) throw new Error('Hafidh title not unlocked');
  if (!titles.includes('title_knight')) throw new Error('Knight title not unlocked');
  if (!titles.includes('title_pulpit')) throw new Error('Pulpit title not unlocked');
  if (!titles.includes('title_heavens')) throw new Error('Heavens title not unlocked');

  console.log('✅ All Hero Engine unit tests passed successfully!');
}

runTests();
