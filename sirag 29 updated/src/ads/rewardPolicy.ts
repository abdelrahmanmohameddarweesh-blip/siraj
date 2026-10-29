import type { Grant } from "../oasis/oasisRewards";
export const AD_OFFERS = {
  seed: {
    title: "بذرة لنبتة مجانية",
    description: "شاهد إعلانًا لتحصل على بذرة إضافية وتختار نبتتك.",
    reward: "بذرة إضافية واحدة",
    seeds: 1,
    drops: 0,
  },
  water: {
    title: "ماء إضافي لنبتتك",
    description: "شاهد إعلانًا لتحصل على قطرتي ماء وتواصل العناية بنبتتك.",
    reward: "قطرتا ماء",
    seeds: 0,
    drops: 2,
  },
  gift: {
    title: "هدية الواحة اليومية",
    description: "هدية اختيارية تساعد واحتك على النمو دون تغيير سجل عاداتك.",
    reward: "بذرة وقطرة ماء",
    seeds: 1,
    drops: 1,
  },
} as const;
export type AdPlacement = keyof typeof AD_OFFERS;
export type AdSession = {
  id: string;
  placement: AdPlacement;
  startedAt: number;
};
export type AdLedger = {
  v: 1;
  receipts: Record<
    string,
    { day: string; placement: AdPlacement; earnedAt: number }
  >;
  pending: Grant[];
  lastEarnedAt: number;
  active: AdSession | null;
};
export const emptyAdLedger = (): AdLedger => ({
  v: 1,
  receipts: {},
  pending: [],
  lastEarnedAt: 0,
  active: null,
});
export function isPlacement(value: unknown): value is AdPlacement {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(AD_OFFERS, value)
  );
}
export function eligibility(
  ledger: AdLedger,
  placement: AdPlacement,
  day: string,
  now: number,
): { allowed: boolean; reason: string; remaining: number } {
  const today = Object.values(ledger.receipts).filter((r) => r.day === day),
    remaining = Math.max(0, 3 - today.length);
  if (!remaining)
    return {
      allowed: false,
      reason:
        "وصلت إلى ثلاث مكافآت إعلانية اليوم. مكافآت العادات متاحة دائمًا.",
      remaining,
    };
  if (today.some((r) => r.placement === placement))
    return {
      allowed: false,
      reason: "حصلت على هذه الهدية اليوم. عد غدًا أو واصل عاداتك.",
      remaining,
    };
  const seconds = Math.ceil(
    Math.max(0, ledger.lastEarnedAt + 120000 - now) / 1000,
  );
  if (ledger.lastEarnedAt && seconds > 0)
    return {
      allowed: false,
      reason: `يمكنك طلب إعلان آخر بعد ${seconds} ثانية.`,
      remaining,
    };
  return { allowed: true, reason: "", remaining };
}
export function rewardSession(
  ledger: AdLedger,
  session: AdSession,
  day: string,
  now: number,
): AdLedger {
  if (ledger.receipts[session.id]) return ledger;
  if (
    ledger.active?.id !== session.id ||
    ledger.active.placement !== session.placement
  )
    throw new Error("جلسة الإعلان غير صالحة");
  const can = eligibility(ledger, session.placement, day, now);
  if (!can.allowed) throw new Error(can.reason);
  const offer = AD_OFFERS[session.placement],
    grant: Grant = {
      id: "ad:" + session.id,
      day,
      habitId: "",
      seeds: offer.seeds,
      drops: offer.drops,
      lanterns: 0,
      firstOfDay: false,
      allDone: false,
    };
  const keep = Object.entries(ledger.receipts).filter(
    ([, r]) => now - r.earnedAt < 90 * 86400000,
  );
  return {
    ...ledger,
    receipts: {
      ...Object.fromEntries(keep),
      [session.id]: { day, placement: session.placement, earnedAt: now },
    },
    pending: [...ledger.pending, grant],
    lastEarnedAt: now,
  };
}
