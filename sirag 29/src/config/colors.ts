export const LightColors = {
  primary: '#0B4F44',       // Hero Primary Deep Green       // Vibrant Emerald Green (WCAG AA compliant)
  primaryLight: '#E8F3F0',  // Pastel mint tint  // Soft pastel green background tint
  primaryDeep: '#0B4F44',   // Hero Primary Deep Green   // Primary buttons (White text on #047857 has 5.5:1 ratio, WCAG AA compliant)
  primaryDark: '#07362E',   // Deep forest green   // Gradient end for hero cards
  primaryTint: '#F0F7F4',   // Soft card tint   // Success chip background, selected row
  primaryTintBorder: '#C9E1D8', // Border on primaryTint surfaces
  primaryOnTint: '#0B4F44',   // Text on primaryTint (10.4:1 contrast ratio)
  primaryPale: '#D1FAE5',     // Text on emerald gradient cards
  
  accent: '#F2C66D',        // Hero Gold token        // Gold/amber: streaks, current-node, XP bar (4.5:1 on white)
  accentLight: '#FEF9EC',   // Soft gold tint   // Pastel gold glow background
  accentDeep: '#B38116',    // Deep gold for contrast    // Gold text/values (5.9:1 on white, WCAG AA)
  accentDark: '#78350F',    // Gold gradient end
  accentTint: '#FFFBF2',    // Warning/gold chip background
  accentTintBorder: '#F5DC9A', // Border on accentTint
  accentOnTint: '#825605',  // Text on accentTint (9.5:1 contrast)
  
  background: '#F3F7F5',    // Hero Page background    // App/page chrome behind cards
  surface: '#FFFFFF',       // All cards, nav bars, headers
  border: '#E3ECE8',        // Hero 1px card border        // Default 1px card border
  borderStrong: '#D1D5DB',  // Unchecked checkbox/radio outlines
  
  textPrimary: '#10231F',   // Hero Primary Text   // Titles, values, question text (16:1 contrast on white)
  textSecondary: '#5B706A', // Hero Secondary Text // Descriptions, meta, labels (7.0:1 contrast on white, WCAG AA)
  textTertiary: '#6B7280',  // Disabled, counters, locked labels (4.5:1 on white, WCAG AA)
  textBody: '#1F2937',      // Body copy inside list rows (14:1 contrast)
  
  info: '#1D4ED8',          // Ayah card, info chips (5.6:1 on white)
  infoDeep: '#1E40AF',      // Info chip text (8.5:1 on white)
  infoTint: '#EFF6FF',      // Ayah/info card background
  infoTintBorder: '#BFDBFE', // Border on infoTint
  
  danger: '#DC2626',        // Timer under pressure, errors (4.6:1 on white)
  dangerTint: '#FEF2F2',    // Danger chip background
  dangerTintBorder: '#FECACA', // Border on dangerTint
  
  neutralTint: '#F3F4F6',   // Segmented-control track
  success: '#059669',       // Success emerald
  error: '#DC2626',         // Warning/Error red
  shadow: '#9CA3AF',        // Soft grey shadows

  // Named badges, awards & literal color tokens
  medalGold: '#F59E0B',
  medalSilver: '#9CA3AF',
  medalBronze: '#D97706',
  cardSuccessTint: '#E6F4EA',
  cardErrorTint: '#FCE8E6',
  white: '#FFFFFF',
  black: '#000000',
};

export const DarkColors = {
  primary: '#E9BE68',
  primaryLight: '#152E24',
  primaryDeep: '#DDB55F',
  primaryDark: '#0B4035',
  primaryTint: '#11231D',
  primaryTintBorder: '#1E3A2F',
  primaryOnTint: '#ECF4F0',
  primaryPale: '#A7F3D0',
  
  accent: '#F2C66D',
  accentLight: '#2D220B',
  accentDeep: '#D97706',
  accentDark: '#B45309',
  accentTint: '#2D220B',
  accentTintBorder: '#F59E0B',
  accentOnTint: '#ECF4F0',
  
  background: '#061D1A',
  surface: '#10352E',
  border: '#29574A',
  borderStrong: '#2A5243',
  
  textPrimary: '#ECF4F0',
  textSecondary: '#9CB7AA', // Elevated for dark mode WCAG AA compliance (4.8:1)
  textTertiary: '#7F9E8F',  // Elevated for dark mode WCAG AA compliance (4.5:1)
  textBody: '#D1E0D9',
  
  info: '#3B82F6',
  infoDeep: '#60A5FA',
  infoTint: '#11231D',
  infoTintBorder: '#1E3A2F',
  
  danger: '#EF4444',
  dangerTint: '#2D1515',
  dangerTintBorder: '#EF4444',
  
  neutralTint: '#152E24',
  success: '#10B981',
  error: '#EF4444',
  shadow: '#000000',

  // Named badges, awards & literal color tokens
  medalGold: '#F59E0B',
  medalSilver: '#9CA3AF',
  medalBronze: '#D97706',
  cardSuccessTint: '#173528',
  cardErrorTint: '#381A1A',
  white: '#FFFFFF',
  black: '#000000',
};

export const Colors = LightColors;
