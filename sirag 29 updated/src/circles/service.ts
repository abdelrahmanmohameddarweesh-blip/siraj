import {
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
} from "firebase/firestore";
import app from "../firebase/init";
import { profileAuth } from "../profile/cloudAuth";
import { ensureAuthenticatedUser } from "../profile/cloudIdentity";
import { loadProfile, PROFILE_KEY } from "../profile/profileStore";
import { updateJSON } from "../storage/jsonStore";
import { PersonalProfile } from "../profile/profileModel";
import { loadReportSources } from "../reports/reportStore";
import { localDay } from "../habits/habitData";
import {
  Activity,
  CircleDraft,
  CircleOptions,
  progressForHabit,
  Circle,
  CircleDetail,
  Membership,
  Companion,
  PrivateDay,
  canSync,
  canonicalProgress,
  circleDay,
  inviteCode,
} from "./model";
import { sparkCore, root, own, SparkCircle } from "./sparkCore";
import {
  sparkDB as db,
  store,
  cached,
  fetchDetail,
  watchDetail,
  invalidate,
} from "./sparkFirestore";
import {
  configureCircleReminder,
  loadCircleReminder,
  removeCircleReminder,
} from "./notifications";
const core = sparkCore(store);
export const ensureCircleUser = ensureAuthenticatedUser;
export async function accountStatus() {
  const u = await ensureCircleUser();
  return {
    linked: !u.isAnonymous,
    email: u.email,
    uid: u.uid,
    verified: u.emailVerified,
  };
}
export async function linkAccount(email: string, password: string) {
  if (password.length < 8)
    throw new Error("استخدم كلمة مرور من ٨ أحرف على الأقل");
  const user = await ensureCircleUser();
  if (!user.isAnonymous) throw new Error("حسابك مرتبط بالفعل");
  const result = await linkWithCredential(
    user,
    EmailAuthProvider.credential(email.trim(), password),
  );
  await result.user.getIdToken(true);
  try {
    await sendEmailVerification(result.user);
  } catch {
    /* Account linking succeeded; verification can be resent. */
  }
  return accountStatus();
}
export async function signInAccount(email: string, password: string) {
  await ensureCircleUser();
  const result = await signInWithEmailAndPassword(
    profileAuth,
    email.trim(),
    password,
  );
  await result.user.getIdToken(true);
  // Change the local identity marker first, even if cloud profile retrieval fails.
  await updateJSON<PersonalProfile | null>(PROFILE_KEY, null, (p) =>
    p
      ? {
          ...p,
          cloudUid: result.user.uid,
          syncedAt: undefined,
          updatedAt: new Date().toISOString(),
        }
      : p,
  );
  let saved: Record<string, any> | undefined;
  try {
    saved = (await getDoc(doc(db, "privateProfiles", result.user.uid))).data();
  } catch {
    return accountStatus();
  }
  // A deliberate account switch must not keep a different account's sync marker.
  await updateJSON<PersonalProfile | null>(PROFILE_KEY, null, (p) =>
    p
      ? {
          ...p,
          ...(saved?.displayName && ["male", "female"].includes(saved.gender)
            ? { name: saved.displayName, gender: saved.gender }
            : {}),
          cloudUid: result.user.uid,
          syncedAt: undefined,
        }
      : p,
  );
  return accountStatus();
}
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(profileAuth, email.trim());
export async function verifyEmail() {
  const u = await ensureCircleUser();
  await sendEmailVerification(u);
}

export async function listCircles(): Promise<Circle[]> {
  const u = await ensureCircleUser();
  const index = await getDocs(
    collection(db, "sparkAccounts", u.uid, "circles"),
  );
  const circles = await Promise.all(
    index.docs.map(async (row) => {
      const c = await store.get(root(row.id));
      return c && Object.prototype.hasOwnProperty.call(c.members, u.uid)
        ? (c as Circle)
        : null;
    }),
  );
  return circles
    .filter((c): c is Circle => !!c)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export async function createCircle(data: CircleDraft) {
  const u = await ensureCircleUser(),
    p = await loadProfile();
  const result = await core.create(
    u.uid,
    p?.name || "رفيق",
    data,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo",
  );
  invalidate(result.circleId);
  return result;
}
export async function joinCircle(raw: string) {
  const code = inviteCode(raw);
  if (!/^[A-F0-9]{12}$/.test(code)) throw new Error("رمز دعوة غير صالح");
  const u = await ensureCircleUser(),
    p = await loadProfile();
  const result = await core.join(u.uid, p?.name || "رفيق", code);
  invalidate(result.circleId);
  return result;
}
export async function loadCircle(id: string): Promise<CircleDetail> {
  const u = await ensureCircleUser(),
    d = await fetchDetail(id, u.uid);
  let reminder = await loadCircleReminder(u.uid, id);
  if (reminder.reminders && reminder.refreshedDay !== localDay()) {
    try {
      await configureCircleReminder(
        u.uid,
        id,
        d.circle.name,
        reminder,
        (d.circle as SparkCircle).endEpoch,
        (d.circle as SparkCircle).startEpoch,
      );
      reminder = await loadCircleReminder(u.uid, id);
    } catch {
      /* Retry when opening tomorrow or changing reminder settings. */
    }
  }
  return { ...d, member: { ...d.member, ...reminder, summary: false } };
}
export async function syncCircle(c: Circle, activity: Activity = c.activity) {
  if (!canSync(c) || activity === "custom") return false;
  const u = await ensureCircleUser(),
    day = circleDay(c.timeZone),
    source = await loadReportSources([localDay()]),
    data = { day, ...progressForHabit(activity, source, day) };
  const value =
    activity === "reading"
      ? data.pages
      : activity === "listening"
        ? data.seconds
        : data.value;
  if (cached(c.id, u.uid)?.mine[day]?.value === value) return true;
  const changed = await core.checkin(u.uid, c.id, data);
  if (changed) invalidate(c.id);
  return true;
}
export function watchCircle(
  id: string,
  refresh: () => void,
  error: (e: Error) => void,
  _showGroupProgress = true,
) {
  let stop: (() => void) | undefined,
    alive = true;
  void ensureCircleUser()
    .then((u) => {
      if (alive) stop = watchDetail(id, u.uid, refresh, error);
    })
    .catch(error);
  return () => {
    alive = false;
    stop?.();
  };
}
export async function preferences(id: string, data: Partial<Membership>) {
  const u = await ensureCircleUser();
  await core.preferences(u.uid, id, !!data.visible, data.nameVisible !== false);
  invalidate(id);
  const c = await store.get(root(id));
  if (!c) throw new Error("الصحبة غير موجودة");
  try {
    await configureCircleReminder(
      u.uid,
      id,
      c.name,
      {
        reminders: !!data.reminders,
        reminderHour: data.reminderHour ?? 20,
        reminderMinute: data.reminderMinute ?? 0,
      },
      c.endEpoch,
      c.startEpoch,
    );
  } catch (e) {
    throw new Error(
      "تم حفظ الخصوصية، لكن تعذّر ضبط تذكير الهاتف: " + (e as Error).message,
    );
  }
}
export async function updateCircle(
  id: string,
  data: CircleOptions & { name: string },
) {
  const u = await ensureCircleUser();
  await core.update(u.uid, id, data);
  invalidate(id);
}
export async function rotateInvite(id: string) {
  const u = await ensureCircleUser();
  const result = await core.rotate(u.uid, id);
  invalidate(id);
  return result;
}
export async function leaveCircle(id: string, target?: string) {
  const u = await ensureCircleUser();
  await core.leave(u.uid, id, target);
  if (!target || target === u.uid) await core.redactRemoval(u.uid, id);
  invalidate(id);
  if (!target || target === u.uid) await removeCircleReminder(u.uid, id);
}
export async function manualCheckin(id: string, day: string, value: number) {
  const u = await ensureCircleUser();
  await core.checkin(u.uid, id, { day, value });
  invalidate(id);
}
export async function encourage(id: string, message: string) {
  if (!["بارك الله فيكم", "معًا نستمر", "تقبّل الله"].includes(message))
    throw new Error("اختر رسالة تشجيع");
  const u = await ensureCircleUser(),
    c = await store.get(root(id));
  if (!c) throw new Error("الصحبة غير موجودة");
  await store.transaction(async (tx) => {
    const path = root(id) + "/encouragement/" + u.uid,
      old = await tx.get(path);
    if (old && Date.now() - old.createdAt < 60000)
      throw new Error("انتظر دقيقة قبل التشجيع مجددًا");
    tx.set(path, {
      uid: u.uid,
      message,
      day: circleDay(c.timeZone),
      createdAt: Date.now(),
    });
  });
  invalidate(id);
}
export async function reportCircle(id: string, reason: string) {
  if (reason.trim().length < 2 || reason.trim().length > 500)
    throw new Error("اكتب سبب الإبلاغ من حرفين إلى ٥٠٠ حرف");
  const u = await ensureCircleUser();
  await store.transaction(async (tx) => {
    tx.set("sparkReports/" + store.newId(), {
      circleId: id,
      uid: u.uid,
      reason: reason.trim(),
      createdAt: Date.now(),
    });
  });
}
export { friendlyError } from "./errors";
