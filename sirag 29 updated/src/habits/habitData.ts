export type ReminderAnchor='fajr'|'sunrise'|'dhuhr'|'asr'|'maghrib'|'isha'|'clock';
export type HabitReminder={anchor:ReminderAnchor;offsetMin:number;clock?:string};
export type HabitKind='count'|'quran_read'|'hifz'|'hifz_review'|'adhkar_morning'|'adhkar_evening'|'prayers';
export type HabitRamp={start:number;step:number;everyDays:number;max:number};
export type HabitPlan={id:string;title:string;category:string;unit:string;target:number;frequency:'daily'|'weekly';gradual:boolean;createdAt:string;
 /** added in milestone 29; older plans have none of these */
 kind?:HabitKind;presetId?:string;ramp?:HabitRamp;reminders?:HabitReminder[];followUpMin?:number;};
export const HABIT_LIBRARY=[
{id:'quran',title:'قراءة القرآن',category:'القرآن',unit:'صفحة',target:1},
{id:'quran_listen',title:'الاستماع للقرآن',category:'القرآن',unit:'دقيقة',target:10},
{id:'quran_memorize',title:'حفظ القرآن',category:'القرآن',unit:'آية',target:2},
{id:'quran_review',title:'مراجعة الحفظ',category:'القرآن',unit:'دقيقة',target:10},
{id:'prayer',title:'المحافظة على الصلوات الخمس',category:'الصلاة',unit:'صلاة',target:5},
{id:'fajr',title:'المحافظة على الفجر',category:'الصلاة',unit:'صلاة',target:1},
{id:'sunnah',title:'السنن الرواتب',category:'الصلاة',unit:'ركعة',target:2},
{id:'witr',title:'صلاة الوتر',category:'الصلاة',unit:'ركعة',target:1},
{id:'duha',title:'صلاة الضحى',category:'الصلاة',unit:'ركعة',target:2},
{id:'morning_adhkar',title:'أذكار الصباح',category:'الأذكار',unit:'مرة',target:1},
{id:'evening_adhkar',title:'أذكار المساء',category:'الأذكار',unit:'مرة',target:1},
{id:'tasbeeh',title:'التسبيح',category:'الأذكار',unit:'تسبيحة',target:33},
{id:'istighfar',title:'الاستغفار',category:'الأذكار',unit:'مرة',target:33},
{id:'salawat',title:'الصلاة على النبي ﷺ',category:'الأذكار',unit:'مرة',target:10},
{id:'dua',title:'الدعاء اليومي',category:'الدعاء',unit:'مرة',target:1},
{id:'parents',title:'بر الوالدين',category:'الأخلاق والأسرة',unit:'عمل',target:1},
{id:'kinship',title:'صلة الرحم',category:'الأخلاق والأسرة',unit:'تواصل',target:1},
{id:'kindness',title:'الإحسان للآخرين',category:'الأخلاق والأسرة',unit:'عمل',target:1},
{id:'charity',title:'الصدقة',category:'الخير',unit:'عمل',target:1},
{id:'knowledge',title:'طلب العلم الشرعي',category:'العلم',unit:'دقيقة',target:10},
{id:'reflection',title:'التفكر والتدبر',category:'العلم',unit:'دقيقة',target:5},
];
export const PLANS_KEY='sirag-habit-plans-v1';export const LOG_KEY='sirag-habit-log-v1';
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
