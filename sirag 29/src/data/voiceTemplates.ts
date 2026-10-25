export type AyahTemplate = {
  ayahId: string;
  baseDurationMs: number;
  baseEnvelope: number[]; // 20-point standard volume profile
  vowelMaddIndices: number[]; // Indices of long vowels where emphasis is expected (0 to 19)
};

export type ReaderModifier = {
  readerId: string;
  speedModifier: number; // Pacing: 0.8 = fast, 1.4 = slow
  transformEnvelope: (val: number) => number;
  rhythmStrictness: number; // Multiplier for timing penalty
  maddEmphasisWeight: number; // How strictly we check long vowel emphasis
  dynamicsProfile: 'soft-steady' | 'dynamic-dramatic' | 'didactic-flat' | 'fast-energetic' | 'soothing-fluid';
};

export type ReferenceProfile = {
  expectedDurationMs: number;
  targetEnvelope: number[];
  style: ReaderModifier;
  vowelMaddIndices: number[];
  recitationStyle: 'murattal' | 'mujawwad';
};

const ayahTemplates: Record<string, AyahTemplate> = {
  a1: {
    // Surah Al-Ikhlas
    ayahId: 'a1',
    baseDurationMs: 7000,
    baseEnvelope: [0.1, 0.4, 0.7, 0.5, 0.2, 0.6, 0.8, 0.6, 0.2, 0.5, 0.7, 0.6, 0.2, 0.6, 0.9, 0.7, 0.3, 0.5, 0.2, 0.1],
    vowelMaddIndices: [6, 14], // "الصَّمَدْ", "أَحَدْ" peak vowel emphasis
  },
  a2: {
    // Surah Al-Fatiha (start)
    ayahId: 'a2',
    baseDurationMs: 8500,
    baseEnvelope: [0.2, 0.5, 0.8, 0.6, 0.3, 0.6, 0.8, 0.5, 0.2, 0.5, 0.7, 0.5, 0.2, 0.6, 0.9, 0.8, 0.4, 0.3, 0.2, 0.1],
    vowelMaddIndices: [2, 6, 14], // "الْحَمْدُ لله", "الرَّحْمَنِ", "الرَّحِيمِ"
  },
  a3: {
    // Ayah al-Kursi (start)
    ayahId: 'a3',
    baseDurationMs: 12000,
    baseEnvelope: [0.15, 0.35, 0.6, 0.7, 0.4, 0.3, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.4, 0.2, 0.6, 0.8, 0.6, 0.4, 0.3, 0.15],
    vowelMaddIndices: [7, 15], // "الْحَيُّ", "الْقَيُّومُ"
  },
  a4: {
    // Surah Al-Kawthar
    ayahId: 'a4',
    baseDurationMs: 5500,
    baseEnvelope: [0.2, 0.5, 0.8, 0.9, 0.5, 0.3, 0.7, 0.8, 0.4, 0.2, 0.6, 0.8, 0.4, 0.1, 0.3, 0.5, 0.3, 0.2, 0.2, 0.1],
    vowelMaddIndices: [2, 7, 11], // "أَعْطَيْنَاكَ", "الْكَوْثَرَ", "وَانْحَرْ"
  },
  a5: {
    // Surah Al-Duha (start)
    ayahId: 'a5',
    baseDurationMs: 7500,
    baseEnvelope: [0.1, 0.3, 0.6, 0.8, 0.4, 0.2, 0.5, 0.7, 0.4, 0.3, 0.6, 0.8, 0.5, 0.2, 0.5, 0.7, 0.4, 0.2, 0.3, 0.1],
    vowelMaddIndices: [3, 11], // "وَالضُّحَى", "إِذَا سَجَى"
  },
  a6: {
    // Surah Al-Nasr
    ayahId: 'a6',
    baseDurationMs: 6500,
    baseEnvelope: [0.2, 0.4, 0.7, 0.8, 0.4, 0.3, 0.6, 0.7, 0.5, 0.2, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.4, 0.2, 0.3, 0.1],
    vowelMaddIndices: [3, 11], // "جَاءَ نَصْرُ", "الْفَتْحُ"
  },
};

const readerModifiers: Record<string, ReaderModifier> = {
  minshawi: {
    readerId: 'minshawi',
    speedModifier: 1.18, // Slow, reverent Tartil pacing
    transformEnvelope: (val) => Math.max(0.15, Math.pow(val, 0.8) * 0.82), // Soft, weeping voice, low range variance
    rhythmStrictness: 1.2,
    maddEmphasisWeight: 0.7, // Steady emotional delivery
    dynamicsProfile: 'soft-steady',
  },
  abdulbasit: {
    readerId: 'abdulbasit',
    speedModifier: 1.45, // Extremely slow, majestic pacing
    transformEnvelope: (val) => Math.min(1.0, Math.pow(val, 2.0) * 1.3), // Massive dynamic ranges (Jawwab)
    rhythmStrictness: 0.7, // Forgiving timing due to long breath holds
    maddEmphasisWeight: 1.5, // High strictness on long vowel extensions (Madd)
    dynamicsProfile: 'dynamic-dramatic',
  },
  husary: {
    readerId: 'husary',
    speedModifier: 1.0, // Standard pacing for educational teaching
    transformEnvelope: (val) => val, // Perfect balanced profile
    rhythmStrictness: 2.0, // Extremely strict timing (no mistakes in teacher style)
    maddEmphasisWeight: 1.0, // Balanced Tajweed rules
    dynamicsProfile: 'didactic-flat',
  },
  sudais: {
    readerId: 'sudais',
    speedModifier: 0.82, // Quick, energetic Grand Mosque pacing
    transformEnvelope: (val) => Math.min(1.0, Math.pow(val, 1.4) * 1.15), // Sharp, hugh-pitched climaxes
    rhythmStrictness: 1.4,
    maddEmphasisWeight: 0.9,
    dynamicsProfile: 'fast-energetic',
  },
  muaiqly: {
    readerId: 'muaiqly',
    speedModifier: 0.95, // Smooth, warm Makkah pacing
    transformEnvelope: (val) => Math.max(0.18, Math.pow(val, 0.95) * 0.88), // Soothing, fluid volume curves
    rhythmStrictness: 1.0,
    maddEmphasisWeight: 0.8,
    dynamicsProfile: 'soothing-fluid',
  },
  dosary: {
    readerId: 'dosary',
    speedModifier: 0.9,
    transformEnvelope: (val) => Math.min(1.0, Math.pow(val, 1.25) * 1.1),
    rhythmStrictness: 1.1,
    maddEmphasisWeight: 1.1,
    dynamicsProfile: 'fast-energetic',
  },
  banna: {
    readerId: 'banna',
    speedModifier: 1.15,
    transformEnvelope: (val) => Math.max(0.12, Math.pow(val, 0.9) * 0.9),
    rhythmStrictness: 1.3,
    maddEmphasisWeight: 0.92,
    dynamicsProfile: 'soft-steady',
  },
  ajamy: {
    readerId: 'ajamy',
    speedModifier: 0.88,
    transformEnvelope: (val) => Math.min(1.0, Math.pow(val, 1.3) * 1.15),
    rhythmStrictness: 1.0,
    maddEmphasisWeight: 0.85,
    dynamicsProfile: 'soothing-fluid',
  },
};

export function generateReferenceProfile(
  ayahId: string,
  readerId: string,
  recitationStyle: 'murattal' | 'mujawwad',
  customText?: string
): ReferenceProfile {
  let base = ayahTemplates[ayahId];

  if (!base) {
    const text = customText || 'قُلْ هُوَ اللَّهُ أَحَدٌ';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const baseDurationMs = Math.max(4000, Math.min(22000, wordCount * 1400));

    const baseEnvelope = Array.from({ length: 20 }, (_, i) => {
      const progress = i / 19;
      const wave = 0.4 + 0.35 * Math.sin(progress * Math.PI * Math.max(1, wordCount / 1.5));
      return Math.max(0.1, Math.min(0.9, wave));
    });

    const vowelMaddIndices: number[] = [];
    const searchChars = ['ا', 'و', 'ي', 'أ', 'إ', 'ى'];
    for (let i = 0; i < Math.min(30, text.length); i++) {
      if (searchChars.includes(text[i])) {
        const idx = Math.floor((i / text.length) * 20);
        if (!vowelMaddIndices.includes(idx)) {
          vowelMaddIndices.push(idx);
        }
      }
    }

    base = {
      ayahId: ayahId || 'dynamic',
      baseDurationMs,
      baseEnvelope,
      vowelMaddIndices,
    };
  }

  const mod = readerModifiers[readerId] || readerModifiers.husary;

  let speedFactor = mod.speedModifier;
  let maddWeight = mod.maddEmphasisWeight;
  let finalEnvelope: number[];

  if (recitationStyle === 'mujawwad') {
    // Mujawwad: Much slower, majestic pacing, prolonged vowels and dramatic dynamic contrast
    speedFactor = mod.speedModifier * 2.2;
    maddWeight = mod.maddEmphasisWeight * 1.5;
    
    // Transform with increased dynamic contrast (deeper silent pauses, sharper vocal peaks)
    finalEnvelope = base.baseEnvelope.map((val, idx) => {
      // Insert strategic pauses (breath holds) between verses
      if (idx === 4 || idx === 8 || idx === 12 || idx === 16) return 0.02;
      
      const transformed = mod.transformEnvelope(val);
      return Math.min(1.0, Math.pow(transformed, 1.6) * 1.25);
    });
  } else {
    // Murattal: Faster, steady, rhythmic pacing with flatter dynamic curves
    speedFactor = mod.speedModifier * 0.9;
    maddWeight = mod.maddEmphasisWeight * 0.9;
    
    finalEnvelope = base.baseEnvelope.map((val) => {
      const transformed = mod.transformEnvelope(val);
      return Math.max(0.12, Math.pow(transformed, 0.8)); // flatter dynamic transitions
    });
  }

  return {
    expectedDurationMs: Math.round(base.baseDurationMs * speedFactor),
    targetEnvelope: finalEnvelope,
    style: {
      ...mod,
      speedModifier: speedFactor,
      maddEmphasisWeight: maddWeight,
    },
    vowelMaddIndices: base.vowelMaddIndices,
    recitationStyle,
  };
}

// Resamples an array to a target length using linear interpolation
function resampleArray(array: number[], targetLength: number): number[] {
  if (array.length === 0) return Array(targetLength).fill(0);
  if (array.length === 1) return Array(targetLength).fill(array[0]);

  const resampled: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    const index = (i * (array.length - 1)) / (targetLength - 1);
    const low = Math.floor(index);
    const high = Math.ceil(index);
    const weight = index - low;
    resampled.push(array[low] * (1 - weight) + array[high] * weight);
  }
  return resampled;
}

// Calculates Pearson Correlation Coefficient
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  if (denX === 0 || denY === 0) return 0;
  return numerator / Math.sqrt(denX * denY);
}

function stripSilenceDynamic(arr: number[]): number[] {
  if (arr.length === 0) return [];
  const minVal = Math.min(...arr);
  const maxVal = Math.max(...arr);
  const range = maxVal - minVal;
  
  if (range < 0.15) return arr;
  
  const threshold = minVal + range * 0.20;
  
  let startIdx = 0;
  while (startIdx < arr.length && arr[startIdx] < threshold) {
    startIdx++;
  }
  
  let endIdx = arr.length - 1;
  while (endIdx > startIdx && arr[endIdx] < threshold) {
    endIdx--;
  }
  
  if (startIdx >= endIdx) return arr;
  return arr.slice(startIdx, endIdx + 1);
}

// Helper to analyze user metering array and compute comparison scores
export function analyzeVocalImitation(
  userMetering: number[], // List of decibels (-160 to 0)
  durationMs: number,
  reference: ReferenceProfile
) {
  // 1. Guard against empty/silent recordings
  if (userMetering.length === 0 || durationMs < 500) {
    return { pronunciation: 0, rhythm: 0, tone: 0, overall: 0 };
  }

  // Convert decibels to a 0.0 - 1.0 amplitude range
  const amplitudes = userMetering.map(db => {
    if (db <= -60) return 0;
    return (db + 60) / 60; // scale -60..0 to 0..1
  });

  const totalAmplitude = amplitudes.reduce((sum, a) => sum + a, 0);
  const averageAmplitude = totalAmplitude / amplitudes.length;
  
  // Guard: If average amplitude is extremely quiet (silence/background hum), return 0
  if (averageAmplitude < 0.08) {
    return { pronunciation: 0, rhythm: 0, tone: 0, overall: 0 };
  }

  // Align signals by stripping initial and trailing silence (latency immunity)
  const activeUser = stripSilenceDynamic(amplitudes);
  const activeTarget = stripSilenceDynamic(reference.targetEnvelope);

  if (activeUser.length === 0 || activeTarget.length === 0) {
    return { pronunciation: 0, rhythm: 0, tone: 0, overall: 0 };
  }

  // Calculate active speaking durations
  const userActiveDuration = (activeUser.length / amplitudes.length) * durationMs;
  const targetActiveDuration = reference.expectedDurationMs;

  // ==========================================
  // EVALUATION PILLAR 1: PACING & RHYTHM (إيقاع الترتيل وتنظيم النفس)
  // ==========================================
  // Compare pacing dynamically across 4 quadrants of the aligned active envelopes
  const segmentSize = Math.floor(activeUser.length / 4);
  const targetSegmentSize = Math.floor(activeTarget.length / 4);
  
  let segmentPacingPenalty = 0;
  for (let i = 0; i < 4; i++) {
    const userSeg = activeUser.slice(i * segmentSize, (i + 1) * segmentSize);
    const targetSeg = activeTarget.slice(i * targetSegmentSize, (i + 1) * targetSegmentSize);
    
    const userSegEnergy = userSeg.reduce((s, val) => s + val, 0) / (userSeg.length || 1);
    const targetSegEnergy = targetSeg.reduce((s, val) => s + val, 0) / (targetSeg.length || 1);
    
    segmentPacingPenalty += Math.abs(userSegEnergy - targetSegEnergy) * 8;
  }

  const durationDiff = Math.abs(userActiveDuration - targetActiveDuration);
  const durationRatio = durationDiff / targetActiveDuration;
  let rhythmScore = Math.max(75, 100 - Math.round(durationRatio * 25 * reference.style.rhythmStrictness + segmentPacingPenalty));
  rhythmScore = Math.min(100, rhythmScore);

  // Resample aligned user and target envelopes to standard 20 elements
  const resampledUser = resampleArray(activeUser, 20);
  const resampledTarget = resampleArray(activeTarget, 20);

  // ==========================================
  // EVALUATION PILLAR 2: TONE & MELODY DIRECTION (طبقة الصوت وتغيرات النغمة)
  // ==========================================
  // Compare pitch changes using envelope slope trends (rise/fall direction)
  let trendMatches = 0;
  for (let i = 0; i < resampledUser.length - 1; i++) {
    const userSlope = resampledUser[i + 1] - resampledUser[i];
    const targetSlope = resampledTarget[i + 1] - resampledTarget[i];
    
    // Check if the voice moved in the same direction (e.g. rising tone, falling tone)
    if ((userSlope > 0 && targetSlope > 0) || (userSlope < 0 && targetSlope < 0)) {
      trendMatches++;
    } else if (Math.abs(userSlope) < 0.05 && Math.abs(targetSlope) < 0.05) {
      trendMatches++; // both stable/silent
    }
  }
  const trendScore = Math.max(70, Math.round((trendMatches / (resampledUser.length - 1)) * 100));

  // Pearson correlation coefficient for dynamic shape similarity
  const correlation = calculatePearsonCorrelation(resampledUser, resampledTarget);
  const correlationScore = Math.max(75, Math.round((correlation + 1) * 50));

  // Tone match is a blend of overall shape correlation and slope trend direction
  const finalToneScore = Math.round((correlationScore * 0.5) + (trendScore * 0.5));

  // ==========================================
  // EVALUATION PILLAR 3: TAJWEED & VOCAL CONTROL (أحكام التجويد والتحكم الصوتي)
  // ==========================================
  // Evaluate Vowel Extensions (Madd) & Nasalization (Ghunnah) + Vocal Stability (no jittery shakes)
  let tajweedPenalty = 0;
  
  // Vowel Madd Check
  if (reference.vowelMaddIndices.length > 0) {
    reference.vowelMaddIndices.forEach(idx => {
      const userVal = resampledUser[idx];
      const targetVal = resampledTarget[idx];

      // User was quiet when Qari expected a long sustained vowel extension (Madd)
      if (targetVal > 0.65 && userVal < 0.45) {
        tajweedPenalty += 15 * reference.style.maddEmphasisWeight;
      }
      // User was loud/emphasized when Qari expected a steady stop/breath (Saktah)
      else if (targetVal < 0.25 && userVal > 0.60) {
        tajweedPenalty += 10 * reference.style.maddEmphasisWeight;
      }
    });
  }

  // Micro-vibrato & Stability (Jitter emulation)
  // Sudden sharp spikes in the user's voice indicates trembling/shaking (poor breath control)
  let voiceTrembleCount = 0;
  for (let i = 1; i < amplitudes.length - 1; i++) {
    const microFluctuation = Math.abs(amplitudes[i] - (amplitudes[i - 1] + amplitudes[i + 1]) / 2);
    if (microFluctuation > 0.35) {
      voiceTrembleCount++;
    }
  }
  const stabilityPenalty = Math.min(25, voiceTrembleCount * 3);
  tajweedPenalty += stabilityPenalty;

  const tajweedScore = Math.max(80, Math.min(100, 100 - Math.round(tajweedPenalty * 0.4)));

  // ==========================================
  // EVALUATION PILLAR 4: PRONUNCIATION PEAKS (مخارج الحروف وسكتات التلاوة)
  // ==========================================
  // Compare how well user matched the Qari's syllable count and peak locations
  const detectPeaks = (arr: number[]) => {
    const peaks: number[] = [];
    for (let i = 1; i < arr.length - 1; i++) {
      if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1] && arr[i] > 0.22) {
        peaks.push(i / arr.length);
      }
    }
    return peaks;
  };

  const userPeaks = detectPeaks(resampledUser);
  const targetPeaks = detectPeaks(resampledTarget);

  let pronunciationScore = 50;
  if (targetPeaks.length === 0) {
    pronunciationScore = userPeaks.length === 0 ? 95 : 40;
  } else if (userPeaks.length === 0) {
    pronunciationScore = 10;
  } else {
    let distanceSum = 0;
    targetPeaks.forEach(tPeak => {
      let minD = 1.0;
      userPeaks.forEach(uPeak => {
        const d = Math.abs(uPeak - tPeak);
        if (d < minD) minD = d;
      });
      distanceSum += minD;
    });
    const avgDistance = distanceSum / targetPeaks.length;
    let rawPronunciation = Math.round(100 - avgDistance * 180);
    
    // Penalty for matching wrong number of syllables/vowels
    const densityDiff = Math.abs(userPeaks.length - targetPeaks.length);
    const densityPenalty = densityDiff * 6;
    pronunciationScore = Math.max(75, Math.min(100, rawPronunciation - densityPenalty));
  }

  // Weight distribution: 
  // 35% Word Pronunciation / Peaks
  // 30% Tone & Melody matches
  // 20% Tajweed & Vocal Stability
  // 15% Pacing & Breath Rhythm
  const overall = Math.round(
    (pronunciationScore * 0.35) + 
    (finalToneScore * 0.30) + 
    (tajweedScore * 0.20) + 
    (rhythmScore * 0.15)
  );

  return {
    pronunciation: pronunciationScore,
    rhythm: rhythmScore,
    tone: finalToneScore,
    tajweed: tajweedScore,
    overall: Math.min(100, Math.max(5, overall)),
  };
}

export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Remove all Tashkeel & Quranic punctuation/marks
    .replace(/[أإآ]/g, 'ا') // Normalize Alefs
    .replace(/ة/g, 'ه') // Normalize Teh Marbuta
    .replace(/ى/g, 'ي') // Normalize Alef Maksura
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function isWordSimilar(w1: string, w2: string): boolean {
  if (w1 === w2) return true;
  // If one is a substring of the other and they are long enough
  if (w1.length > 3 && (w2.includes(w1) || w1.includes(w2))) return true;
  
  const distance = getLevenshteinDistance(w1, w2);
  const maxLength = Math.max(w1.length, w2.length);
  // Allow 1 character difference for short words, and 2 for longer words
  const threshold = maxLength > 5 ? 2 : 1;
  return distance <= threshold;
}

export function calculateTextMatchScore(transcribed: string, target: string): { score: number, matches: string[], missing: string[] } {
  const normTrans = normalizeArabicText(transcribed);
  const normTarget = normalizeArabicText(target);

  const wordsTrans = normTrans.split(/\s+/).filter(Boolean);
  const wordsTarget = normTarget.split(/\s+/).filter(Boolean);

  if (wordsTarget.length === 0) {
    return { score: 0, matches: [], missing: [] };
  }

  const matches: string[] = [];
  const missing: string[] = [];

  wordsTarget.forEach((tWord) => {
    // Fuzzy check against transcribed words to allow minor transcription variations
    const isMatched = wordsTrans.some(w => isWordSimilar(w, tWord));
    if (isMatched) {
      matches.push(tWord);
    } else {
      missing.push(tWord);
    }
  });

  const score = Math.round((matches.length / wordsTarget.length) * 100);
  return { score, matches, missing };
}
