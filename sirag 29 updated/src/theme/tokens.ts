/**
 * Design Tokens for "بطل مسلم" (Batl Muslim) - Hero Home
 * Source of truth: Claude design canvas, artboard "Hero home" (390x960)
 * All colors, radii, spacing, and typography tokens live here.
 * NO hardcoded hex outside this file.
 */

export const HomeColors = {
  // Page & Surfaces
  pageBg: '#061D1A',
  surface: '#113B32',
  border: '#396855',
  transparent: 'transparent',

  // Text
  text: '#FFF2D8',
  textSecondary: '#B7D0C5',
  textWhite: '#FFFFFF',

  // Primary (Deep Green)
  primary: '#0B4F44',
  primarySoft: '#E2F2EC',
  onPrimaryMuted: '#BFE0D6',
  primaryDivider: 'rgba(255, 255, 255, 0.16)',
  prayerCircleDone: 'rgba(255, 255, 255, 0.16)',
  prayerCircleUpcomingBorder: 'rgba(255, 255, 255, 0.40)',

  // Gold & Accents
  gold: '#F2C66D',
  goldDeep: '#B8801F',
  goldText: '#7A5300',
  goldSoft: '#FFF3D6',

  // Habit
  habitBg: '#FFF8E6',
  habitBorder: '#F1DFAE',
  habitText: '#6B5200',
  habitIconText: '#4A3200',

  // Streaks & Points
  streakBg: '#FFE8DD',
  streakText: '#8A3B12',

  // Progress Tracks
  track: '#2A5649',        // small XP bar track
  trackSoft: '#2A5649',    // big progress track
  checkEmpty: '#789E8F',   // empty checkbox border

  // Tile Palettes (bg / icon)
  tilePalettes: {
    green: {
      bg: '#E2F2EC',
      icon: '#0B4F44',
    },
    gold: {
      bg: '#FBF0D5',
      icon: '#7A5300',
    },
    blue: {
      bg: '#E3EEF8',
      icon: '#1F4F7A',
    },
    purple: {
      bg: '#ECE8F6',
      icon: '#4B3A8C',
    },
    rose: {
      bg: '#F9E6E6',
      icon: '#8A2F2F',
    },
  },

  // Skeleton shimmer
  skeletonBg: '#163E34',
  skeletonHighlight: '#285548',
} as const;

export const HomeRadii = {
  card: 20,
  prayerCard: 24,
  tile: 18,
  chip: 14,
  button: 12,
  habitIcon: 14,
  tag: 8,
  full: 999,
  xpBar: 3,
  progressBar: 4,
} as const;

export const HomeSpacing = {
  screenHorizontal: 16,
  screenTop: 24,
  sectionGap: 14,
  bottomNavHeight: 76,
  minTouchTarget: 44,
} as const;

export const HomeTypography = {
  fontFamily: {
    regular: 'IBMPlexSansArabic-Regular',   // 400
    medium: 'IBMPlexSansArabic-Medium',     // 500
    semiBold: 'IBMPlexSansArabic-SemiBold', // 600
    bold: 'IBMPlexSansArabic-Bold',         // 700
  },
  fontSize: {
    tiny: 11,
    small: 12,
    task: 14,
    sectionTitle: 15,
    greeting: 16,
    avatarText: 18,
    countdown: 30,
    prayerName: 32,
  },
  lineHeight: {
    tiny: 15,
    small: 17,
    task: 20,
    sectionTitle: 22,
    greeting: 24,
    countdown: 36,
    prayerName: 38.4, // 32 * 1.2
  },
} as const;
