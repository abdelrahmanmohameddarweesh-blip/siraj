import { randomUUID } from "expo-crypto";
import { localDay } from "../habits/habitData";
import { readJSON, updateJSON } from "../storage/jsonStore";
import {
  AdLedger,
  AdPlacement,
  AdSession,
  emptyAdLedger,
  eligibility,
  rewardSession,
} from "./rewardPolicy";
export const AD_REWARDS_KEY = "sirag-rewarded-ads-v1";
export const loadAdRewards = () =>
  readJSON<AdLedger>(AD_REWARDS_KEY, emptyAdLedger());
export async function beginAdSession(placement: AdPlacement) {
  const now = Date.now(),
    session: AdSession = { id: randomUUID(), placement, startedAt: now };
  await updateJSON<AdLedger>(AD_REWARDS_KEY, emptyAdLedger(), (ledger) => {
    const can = eligibility(ledger, placement, localDay(), now);
    if (!can.allowed) throw new Error(can.reason);
    if (ledger.active && now - ledger.active.startedAt < 10 * 60000)
      throw new Error("يوجد إعلان قيد التشغيل. انتظر انتهاءه.");
    return { ...ledger, active: session };
  });
  return session;
}
/** Called only by the native SDK's EARNED_REWARD event, never by the WebView. */
export const earnAdReward = (session: AdSession) =>
  updateJSON<AdLedger>(AD_REWARDS_KEY, emptyAdLedger(), (ledger) =>
    rewardSession(ledger, session, localDay(), Date.now()),
  );
export const endAdSession = (id: string) =>
  updateJSON<AdLedger>(AD_REWARDS_KEY, emptyAdLedger(), (ledger) =>
    ledger.active?.id === id ? { ...ledger, active: null } : ledger,
  );
export const acknowledgeAdRewards = (applied: string[]) =>
  updateJSON<AdLedger>(AD_REWARDS_KEY, emptyAdLedger(), (ledger) => ({
    ...ledger,
    pending: ledger.pending.filter((g) => !applied.includes(g.id)),
  }));
