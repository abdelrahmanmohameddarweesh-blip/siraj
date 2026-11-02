export type TourTarget =
  | "prayer"
  | "reminders"
  | "shortcuts"
  | "habits"
  | "oasis"
  | "reports"
  | "circle";
export type Box = { x: number; y: number; width: number; height: number };
export const HOME_STEPS: {
  target: TourTarget;
  title: string;
  copy: string;
  action: string;
  screen: string;
}[] = [
  {
    target: "prayer",
    title: "ابدأ من صلاتك",
    copy: "هذه الصلاة القادمة ووقتها. افتح البطاقة لتسجيل صلاتك وما أدّيته من السنن، دون تسجيل تلقائي.",
    action: "افتح متتبع الصلاة",
    screen: "PrayerTracker",
  },
  {
    target: "reminders",
    title: "التذكير، على طريقتك",
    copy: "من هذا الجرس تضبط موقعك، ومواقيت الصلاة، والاستعداد قبل الأذان وسؤال المتابعة بعده.",
    action: "اضبط تذكيراتك",
    screen: "PrayerReminders",
  },
  {
    target: "shortcuts",
    title: "وردك بين يديك",
    copy: "من هنا تفتح القرآن والأذكار. اقرأ أو استمع، واضغط عدّاد الذكر بعد قراءته لتسجيله.",
    action: "استكشف القرآن",
    screen: "QuranReader",
  },
  {
    target: "habits",
    title: "اختر خطوة صغيرة",
    copy: "أضف عادة وخطة تناسب وقتك. ستجد تقدمك هنا، ويمكنك تعديل الهدف والتذكير لاحقًا.",
    action: "أضف أول عادة",
    screen: "HabitSetup",
  },
  {
    target: "oasis",
    title: "هنا تنمو واحتك",
    copy: "هذا الاختصار يأخذك إلى واحتك. ازرع البذور التي كسبتها واعتنِ بنباتاتك؛ موارد الإعلان اختيارية.",
    action: "ادخل الواحة",
    screen: "Oasis",
  },
  {
    target: "reports",
    title: "شاهد أثر يومك",
    copy: "راجع ما سجّلته من صلاة وقرآن وأذكار وعادات. التقارير تساعدك على فهم رحلتك دون مقارنة بالآخرين.",
    action: "افتح تقاريرك",
    screen: "Insights",
  },
  {
    target: "circle",
    title: "رحلتك أجمل بصحبة",
    copy: "أنشئ صحبة أو انضم برمز، واختر ما تشاركه. يمكنك إعادة هذه الجولة من قائمة ملفك الشخصي في أي وقت.",
    action: "استكشف الصحبة",
    screen: "Sohba",
  },
];
export function fitSpotlight(box: Box, width: number, height: number): Box {
  const padding = 7,
    x = Math.max(4, box.x - padding),
    y = Math.max(4, box.y - padding);
  return {
    x,
    y,
    width: Math.max(1, Math.min(box.width + padding * 2, width - x - 4)),
    height: Math.max(
      1,
      Math.min(box.height + padding * 2, height - y - 4, height * 0.4),
    ),
  };
}
export function coachTip(
  box: Box,
  width: number,
  height: number,
  topInset: number,
  bottomInset: number,
  desired = 244,
) {
  const top = topInset + 58,
    bottom = height - bottomInset - 12;
  const above = Math.max(0, box.y - top - 18),
    below = Math.max(0, bottom - box.y - box.height - 18);
  const placement = below >= desired || below >= above ? "below" : "above";
  const space = placement === "below" ? below : above;
  const maxHeight = Math.max(120, Math.min(desired, space));
  const y = Math.max(
    top,
    Math.min(
      bottom - maxHeight,
      placement === "below" ? box.y + box.height + 18 : box.y - 18 - maxHeight,
    ),
  );
  const cardWidth = Math.max(240, Math.min(390, width - 28));
  return {
    x: (width - cardWidth) / 2,
    y,
    width: cardWidth,
    maxHeight,
    placement,
  } as const;
}
export function maskPath(width: number, height: number, box: Box, radius = 18) {
  const { x, y, width: w, height: h } = box,
    r = Math.min(radius, w / 2, h / 2);
  return `M0 0H${width}V${height}H0Z M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}
