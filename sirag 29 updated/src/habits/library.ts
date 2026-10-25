/**
 * Habit library: each habit comes with ready-made plans (target + how the app reminds you),
 * a recommendation from three quick questions, and room for a fully custom plan.
 * Plans grow gently when "gradual" is on: the daily target rises step by step up to its maximum.
 */
import type { HabitKind, HabitPlan, HabitRamp, HabitReminder, ReminderAnchor } from './habitData';

export type PresetId = 'gentle' | 'steady' | 'strong';
export type PlanPreset = {
  id: PresetId;
  name: string;
  target: number;
  frequency: 'daily' | 'weekly';
  ramp?: HabitRamp;
  reminders: HabitReminder[];
  /** minutes after the first reminder to nudge again if the habit isn't done yet */
  followUpMin?: number;
  summary: string;
};
export type HabitDef = {
  id: string;
  title: string;
  category: string;
  icon: string;
  unit: string;
  kind: HabitKind;
  blurb: string;
  /** adhkar have natural times, so the "when" question is skipped */
  fixedMoment?: boolean;
  presets: [PlanPreset, PlanPreset, PlanPreset];
};

const R = (anchor: ReminderAnchor, offsetMin = 0, clock?: string): HabitReminder => (clock ? { anchor, offsetMin, clock } : { anchor, offsetMin });

export const CATEGORIES = ['الصلاة', 'القرآن', 'الأذكار', 'الدعاء', 'الأخلاق والأسرة', 'الخير', 'العلم'] as const;

export const LIBRARY: HabitDef[] = [
  { id: 'prayer', title: 'الصلوات الخمس', category: 'الصلاة', icon: '🕌', unit: 'صلاة', kind: 'prayers',
    blurb: 'الأذان في وقته، ثم سؤال لطيف بعد الجماعة لتسجيل صلاتك.',
    presets: [
      { id: 'gentle', name: 'الأذان فقط', target: 5, frequency: 'daily', reminders: [], summary: 'تنبيه بالأذان عند دخول كل وقت.' },
      { id: 'steady', name: 'الأذان ثم السؤال', target: 5, frequency: 'daily', reminders: [], followUpMin: 30, summary: 'الأذان، ثم بعد انتهاء الجماعة نسألك: هل صليت؟' },
      { id: 'strong', name: 'استعداد قبل الأذان', target: 5, frequency: 'daily', reminders: [], followUpMin: 30, summary: 'تنبيه قبل الأذان بعشر دقائق للاستعداد، ثم الأذان، ثم السؤال بعد الجماعة.' },
    ] },
  { id: 'sunnah', title: 'السنن الرواتب', category: 'الصلاة', icon: '🌙', unit: 'ركعة', kind: 'count',
    blurb: 'ابدأ بسنة الفجر ثم أضف بقية الرواتب تدريجيًا.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 2, frequency: 'daily', ramp: { start: 2, step: 2, everyDays: 7, max: 6 }, reminders: [R('fajr', -10)], summary: 'ركعتان قبل الفجر، وتزيد ركعتين كل أسبوع حتى ست.' },
      { id: 'steady', name: 'ثبات', target: 6, frequency: 'daily', reminders: [R('fajr', -10), R('dhuhr', 10)], followUpMin: 60, summary: 'سنة الفجر والظهر يوميًا.' },
      { id: 'strong', name: 'همّة', target: 12, frequency: 'daily', reminders: [R('fajr', -10), R('dhuhr', 10), R('maghrib', 10)], followUpMin: 60, summary: 'الرواتب كاملة ثنتا عشرة ركعة.' },
    ] },
  { id: 'witr', title: 'صلاة الوتر', category: 'الصلاة', icon: '✨', unit: 'ركعة', kind: 'count',
    blurb: 'ختام الليل بركعة أو ثلاث قبل النوم.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 1, frequency: 'daily', reminders: [R('isha', 60)], summary: 'ركعة واحدة بعد العشاء بساعة.' },
      { id: 'steady', name: 'ثبات', target: 3, frequency: 'daily', reminders: [R('isha', 60)], followUpMin: 90, summary: 'ثلاث ركعات قبل النوم مع تذكير ثانٍ إن نسيت.' },
      { id: 'strong', name: 'همّة', target: 5, frequency: 'daily', reminders: [R('isha', 90)], followUpMin: 90, summary: 'خمس ركعات من قيام الليل.' },
    ] },
  { id: 'duha', title: 'صلاة الضحى', category: 'الصلاة', icon: '☀️', unit: 'ركعة', kind: 'count',
    blurb: 'ركعتان بعد ارتفاع الشمس.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 2, frequency: 'daily', reminders: [R('sunrise', 30)], summary: 'ركعتان بعد الشروق بنصف ساعة.' },
      { id: 'steady', name: 'ثبات', target: 4, frequency: 'daily', reminders: [R('sunrise', 60)], followUpMin: 120, summary: 'أربع ركعات مع تذكير ثانٍ قبل الظهر.' },
      { id: 'strong', name: 'همّة', target: 8, frequency: 'daily', reminders: [R('sunrise', 60)], followUpMin: 120, summary: 'ثماني ركعات.' },
    ] },
  { id: 'quran', title: 'قراءة القرآن', category: 'القرآن', icon: '📖', unit: 'صفحة', kind: 'quran_read',
    blurb: 'وردك من المصحف داخل التطبيق، وتُحتسب الصفحات تلقائيًا.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 1, frequency: 'daily', ramp: { start: 1, step: 1, everyDays: 7, max: 5 }, reminders: [R('fajr', 20)], summary: 'صفحة بعد الفجر، وتزيد صفحة كل أسبوع حتى خمس.' },
      { id: 'steady', name: 'ثبات', target: 5, frequency: 'daily', reminders: [R('fajr', 20)], followUpMin: 600, summary: 'خمس صفحات يوميًا: ختمة كل أربعة أشهر تقريبًا.' },
      { id: 'strong', name: 'همّة', target: 20, frequency: 'daily', reminders: [R('fajr', 20), R('isha', 20)], summary: 'جزء كل يوم على جلستين: ختمة في الشهر.' },
    ] },
  { id: 'quran_listen', title: 'الاستماع للقرآن', category: 'القرآن', icon: '🎧', unit: 'دقيقة', kind: 'count',
    blurb: 'استمع لقارئك المفضل في الطريق أو قبل النوم.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 5, frequency: 'daily', reminders: [R('isha', 45)], summary: 'خمس دقائق قبل النوم.' },
      { id: 'steady', name: 'ثبات', target: 15, frequency: 'daily', reminders: [R('dhuhr', 15)], summary: 'ربع ساعة يوميًا.' },
      { id: 'strong', name: 'همّة', target: 30, frequency: 'daily', reminders: [R('fajr', 30), R('isha', 45)], summary: 'نصف ساعة على جلستين.' },
    ] },
  { id: 'quran_memorize', title: 'حفظ القرآن', category: 'القرآن', icon: '🧠', unit: 'آية', kind: 'hifz',
    blurb: 'ورد حفظ يومي، ثم اختبار قصير على آيات اليوم ومراجعة لما سبق.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 1, frequency: 'daily', ramp: { start: 1, step: 1, everyDays: 14, max: 3 }, reminders: [R('fajr', 30)], followUpMin: 480, summary: 'آية واحدة يوميًا، وتزيد آية كل أسبوعين حتى ثلاث.' },
      { id: 'steady', name: 'ثبات', target: 3, frequency: 'daily', reminders: [R('fajr', 30)], followUpMin: 480, summary: 'ثلاث آيات يوميًا مع اختبار ومراجعة.' },
      { id: 'strong', name: 'همّة', target: 5, frequency: 'daily', reminders: [R('fajr', 30), R('asr', 20)], summary: 'خمس آيات: حفظ بعد الفجر واختبار بعد العصر.' },
    ] },
  { id: 'quran_review', title: 'مراجعة الحفظ', category: 'القرآن', icon: '🔁', unit: 'آية', kind: 'hifz_review',
    blurb: 'الآيات المحفوظة تعود إليك للمراجعة في الوقت المناسب حتى تثبت.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 3, frequency: 'daily', reminders: [R('asr', 20)], summary: 'مراجعة ثلاث آيات يوميًا.' },
      { id: 'steady', name: 'ثبات', target: 10, frequency: 'daily', reminders: [R('asr', 20)], summary: 'مراجعة عشر آيات يوميًا.' },
      { id: 'strong', name: 'همّة', target: 20, frequency: 'daily', reminders: [R('maghrib', 15)], summary: 'مراجعة عشرين آية يوميًا.' },
    ] },
  { id: 'morning_adhkar', title: 'أذكار الصباح', category: 'الأذكار', icon: '🌅', unit: 'مرة', kind: 'adhkar_morning', fixedMoment: true,
    blurb: 'أذكار الصباح كاملة من حصن المسلم، مع عدّاد لكل ذكر.',
    presets: [
      { id: 'gentle', name: 'تذكير واحد', target: 1, frequency: 'daily', reminders: [R('fajr', 20)], summary: 'تذكير بعد الفجر بثلث ساعة.' },
      { id: 'steady', name: 'تذكير ومتابعة', target: 1, frequency: 'daily', reminders: [R('fajr', 20)], followUpMin: 120, summary: 'تذكير بعد الفجر، وتذكير ثانٍ بعد ساعتين إن لم تكملها.' },
      { id: 'strong', name: 'بعد الصلاة مباشرة', target: 1, frequency: 'daily', reminders: [R('fajr', 10)], followUpMin: 60, summary: 'تذكير بعد صلاة الفجر مباشرة ومتابعة بعد ساعة.' },
    ] },
  { id: 'evening_adhkar', title: 'أذكار المساء', category: 'الأذكار', icon: '🌇', unit: 'مرة', kind: 'adhkar_evening', fixedMoment: true,
    blurb: 'أذكار المساء كاملة من حصن المسلم، مع عدّاد لكل ذكر.',
    presets: [
      { id: 'gentle', name: 'تذكير واحد', target: 1, frequency: 'daily', reminders: [R('asr', 20)], summary: 'تذكير بعد العصر بثلث ساعة.' },
      { id: 'steady', name: 'تذكير ومتابعة', target: 1, frequency: 'daily', reminders: [R('asr', 20)], followUpMin: 90, summary: 'تذكير بعد العصر، وتذكير ثانٍ قبل المغرب إن لم تكملها.' },
      { id: 'strong', name: 'بعد الصلاة مباشرة', target: 1, frequency: 'daily', reminders: [R('asr', 10)], followUpMin: 60, summary: 'تذكير بعد صلاة العصر مباشرة ومتابعة بعد ساعة.' },
    ] },
  { id: 'tasbeeh', title: 'التسبيح', category: 'الأذكار', icon: '📿', unit: 'تسبيحة', kind: 'count', blurb: 'تسبيح بعد الصلوات بعدّاد بسيط.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 33, frequency: 'daily', reminders: [R('maghrib', 10)], summary: 'ثلاث وثلاثون تسبيحة بعد المغرب.' },
      { id: 'steady', name: 'ثبات', target: 100, frequency: 'daily', reminders: [R('fajr', 10), R('maghrib', 10)], summary: 'مئة تسبيحة على جلستين.' },
      { id: 'strong', name: 'همّة', target: 165, frequency: 'daily', reminders: [R('fajr', 10), R('dhuhr', 10), R('asr', 10), R('maghrib', 10), R('isha', 10)], summary: 'بعد كل صلاة من الصلوات الخمس.' },
    ] },
  { id: 'istighfar', title: 'الاستغفار', category: 'الأذكار', icon: '🤍', unit: 'مرة', kind: 'count', blurb: 'استغفار يومي في أوقات تختارها.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 33, frequency: 'daily', reminders: [R('dhuhr', 15)], summary: 'ثلاث وثلاثون مرة بعد الظهر.' },
      { id: 'steady', name: 'ثبات', target: 70, frequency: 'daily', reminders: [R('dhuhr', 15), R('isha', 15)], summary: 'سبعون مرة على جلستين.' },
      { id: 'strong', name: 'همّة', target: 100, frequency: 'daily', reminders: [R('fajr', 15), R('asr', 15)], summary: 'مئة مرة على جلستين.' },
    ] },
  { id: 'salawat', title: 'الصلاة على النبي ﷺ', category: 'الأذكار', icon: '💚', unit: 'مرة', kind: 'count', blurb: 'عدد يومي تختاره، ويزيد يوم الجمعة إن شئت.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 10, frequency: 'daily', reminders: [R('asr', 30)], summary: 'عشر مرات بعد العصر.' },
      { id: 'steady', name: 'ثبات', target: 50, frequency: 'daily', reminders: [R('asr', 30)], summary: 'خمسون مرة يوميًا.' },
      { id: 'strong', name: 'همّة', target: 100, frequency: 'daily', reminders: [R('fajr', 30), R('asr', 30)], summary: 'مئة مرة على جلستين.' },
    ] },
  { id: 'dua', title: 'الدعاء اليومي', category: 'الدعاء', icon: '🤲', unit: 'مرة', kind: 'count', blurb: 'وقت ثابت للدعاء كل يوم.',
    presets: [
      { id: 'gentle', name: 'وقت واحد', target: 1, frequency: 'daily', reminders: [R('maghrib', -20)], summary: 'قبل المغرب بثلث ساعة.' },
      { id: 'steady', name: 'وقتان', target: 2, frequency: 'daily', reminders: [R('fajr', 15), R('maghrib', -20)], summary: 'بعد الفجر وقبل المغرب.' },
      { id: 'strong', name: 'ثلاثة أوقات', target: 3, frequency: 'daily', reminders: [R('fajr', 15), R('maghrib', -20), R('isha', 60)], summary: 'بعد الفجر، قبل المغرب، وقبل النوم.' },
    ] },
  { id: 'parents', title: 'بر الوالدين', category: 'الأخلاق والأسرة', icon: '👪', unit: 'عمل', kind: 'count', blurb: 'اتصال أو زيارة أو خدمة صغيرة.',
    presets: [
      { id: 'gentle', name: 'أسبوعيًا', target: 2, frequency: 'weekly', reminders: [R('clock', 0, '19:00')], summary: 'عملان في الأسبوع، وتذكير مساء الجمعة.' },
      { id: 'steady', name: 'يوميًا', target: 1, frequency: 'daily', reminders: [R('clock', 0, '19:00')], summary: 'عمل بسيط كل يوم.' },
      { id: 'strong', name: 'مرتين يوميًا', target: 2, frequency: 'daily', reminders: [R('clock', 0, '09:00'), R('clock', 0, '19:00')], summary: 'صباحًا ومساءً.' },
    ] },
  { id: 'kinship', title: 'صلة الرحم', category: 'الأخلاق والأسرة', icon: '📞', unit: 'تواصل', kind: 'count', blurb: 'تواصل مع أقاربك بانتظام.',
    presets: [
      { id: 'gentle', name: 'أسبوعيًا', target: 1, frequency: 'weekly', reminders: [R('clock', 0, '17:00')], summary: 'تواصل واحد في الأسبوع.' },
      { id: 'steady', name: 'ثبات', target: 3, frequency: 'weekly', reminders: [R('clock', 0, '17:00')], summary: 'ثلاثة تواصلات في الأسبوع.' },
      { id: 'strong', name: 'يوميًا', target: 1, frequency: 'daily', reminders: [R('clock', 0, '17:00')], summary: 'تواصل كل يوم.' },
    ] },
  { id: 'kindness', title: 'الإحسان للآخرين', category: 'الأخلاق والأسرة', icon: '🌱', unit: 'عمل', kind: 'count', blurb: 'عمل طيب صغير كل يوم.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 3, frequency: 'weekly', reminders: [R('clock', 0, '12:00')], summary: 'ثلاثة أعمال في الأسبوع.' },
      { id: 'steady', name: 'ثبات', target: 1, frequency: 'daily', reminders: [R('clock', 0, '12:00')], summary: 'عمل كل يوم.' },
      { id: 'strong', name: 'همّة', target: 3, frequency: 'daily', reminders: [R('clock', 0, '12:00')], summary: 'ثلاثة أعمال كل يوم.' },
    ] },
  { id: 'charity', title: 'الصدقة', category: 'الخير', icon: '💝', unit: 'عمل', kind: 'count', blurb: 'صدقة منتظمة ولو قليلة.',
    presets: [
      { id: 'gentle', name: 'أسبوعيًا', target: 1, frequency: 'weekly', reminders: [R('clock', 0, '10:00')], summary: 'صدقة واحدة كل أسبوع.' },
      { id: 'steady', name: 'ثبات', target: 3, frequency: 'weekly', reminders: [R('clock', 0, '10:00')], summary: 'ثلاث صدقات أسبوعيًا.' },
      { id: 'strong', name: 'يوميًا', target: 1, frequency: 'daily', reminders: [R('clock', 0, '10:00')], summary: 'صدقة كل يوم.' },
    ] },
  { id: 'knowledge', title: 'طلب العلم الشرعي', category: 'العلم', icon: '📚', unit: 'دقيقة', kind: 'count', blurb: 'وقت ثابت للتعلم.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 10, frequency: 'daily', ramp: { start: 10, step: 5, everyDays: 7, max: 30 }, reminders: [R('isha', 30)], summary: 'عشر دقائق بعد العشاء، وتزيد خمسًا كل أسبوع.' },
      { id: 'steady', name: 'ثبات', target: 20, frequency: 'daily', reminders: [R('isha', 30)], summary: 'عشرون دقيقة يوميًا.' },
      { id: 'strong', name: 'همّة', target: 45, frequency: 'daily', reminders: [R('fajr', 40)], summary: 'خمس وأربعون دقيقة بعد الفجر.' },
    ] },
  { id: 'reflection', title: 'التفكر والتدبر', category: 'العلم', icon: '🌌', unit: 'دقيقة', kind: 'count', blurb: 'لحظات هادئة للتدبر.',
    presets: [
      { id: 'gentle', name: 'بداية لطيفة', target: 3, frequency: 'daily', reminders: [R('maghrib', 15)], summary: 'ثلاث دقائق بعد المغرب.' },
      { id: 'steady', name: 'ثبات', target: 5, frequency: 'daily', reminders: [R('maghrib', 15)], summary: 'خمس دقائق يوميًا.' },
      { id: 'strong', name: 'همّة', target: 15, frequency: 'daily', reminders: [R('fajr', 20)], summary: 'ربع ساعة بعد الفجر.' },
    ] },
];
export const findHabit = (id: string) => LIBRARY.find(h => h.id === id);

export type Level = 'start' | 'some' | 'regular';
export type TimeBudget = 'short' | 'mid' | 'long';
export type Answers = { level: Level; time: TimeBudget; moment?: ReminderAnchor | null };
export const MOMENTS: { id: ReminderAnchor; label: string }[] = [
  { id: 'fajr', label: 'بعد الفجر' }, { id: 'dhuhr', label: 'بعد الظهر' }, { id: 'asr', label: 'بعد العصر' },
  { id: 'maghrib', label: 'بعد المغرب' }, { id: 'isha', label: 'بعد العشاء' },
];
export const anchorLabel = (r: HabitReminder): string => {
  if (r.anchor === 'clock') return `الساعة ${r.clock}`;
  const n: Record<string, string> = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  const name = n[r.anchor];
  if (!r.offsetMin) return `مع ${name}`;
  return r.offsetMin > 0 ? `بعد ${name} بـ${r.offsetMin.toLocaleString('ar-EG')} دقيقة` : `قبل ${name} بـ${(-r.offsetMin).toLocaleString('ar-EG')} دقيقة`;
};

/** Picks the plan that fits the user now: never more than they have time for, never a jump past their current level. */
export function recommend(def: HabitDef, a: Answers): { preset: PlanPreset; reason: string } {
  const level = { start: 0, some: 1, regular: 2 }[a.level];
  const time = { short: 0, mid: 1, long: 2 }[a.time];
  const idx = Math.min(level, time);
  const base = def.presets[idx];
  const reminders = (!def.fixedMoment && a.moment && base.reminders.length)
    ? [{ ...base.reminders[0], anchor: a.moment, offsetMin: Math.max(10, Math.abs(base.reminders[0].offsetMin)) }, ...base.reminders.slice(1)]
    : base.reminders;
  const why = [
    a.level === 'start' ? 'لأنك تبدأ الآن' : a.level === 'some' ? 'لأنك تفعلها أحيانًا' : 'لأنك تفعلها غالبًا',
    a.time === 'short' ? 'ووقتك اليومي قصير' : a.time === 'mid' ? 'ولديك وقت متوسط' : 'ولديك وقت كافٍ',
  ].join(' ');
  const tail = idx < level ? '، اخترنا خطة أخف تناسب وقتك ويمكنك رفعها لاحقًا.' : idx === 0 ? '، نبدأ بخطوة صغيرة ثابتة.' : '، هذه الخطة تناسبك.';
  return { preset: { ...base, reminders }, reason: why + tail };
}

/** Builds the stored plan from a preset (optionally customized). */
export function planFromPreset(def: HabitDef, p: PlanPreset, opts?: { gradual?: boolean; now?: Date }): HabitPlan {
  return {
    id: def.id, title: def.title, category: def.category, unit: def.unit, target: p.ramp ? p.ramp.max : p.target,
    frequency: p.frequency, gradual: opts?.gradual ?? !!p.ramp, createdAt: (opts?.now || new Date()).toISOString(),
    kind: def.kind, presetId: p.id, ramp: p.ramp, reminders: p.reminders, followUpMin: p.followUpMin,
  };
}

/** Today's target: gradual plans start small and rise every few days up to their maximum. */
export function effectiveTarget(plan: Pick<HabitPlan, 'target' | 'gradual' | 'ramp' | 'createdAt'>, day: string): number {
  if (!plan.gradual || !plan.ramp) return plan.target;
  const start = new Date((plan.createdAt || '').slice(0, 10) + 'T00:00:00');
  const cur = new Date(day + 'T00:00:00');
  const days = Math.max(0, Math.round((cur.getTime() - start.getTime()) / 86400000));
  if (!isFinite(days)) return plan.ramp.start;
  return Math.min(plan.ramp.max, plan.ramp.start + plan.ramp.step * Math.floor(days / plan.ramp.everyDays));
}
