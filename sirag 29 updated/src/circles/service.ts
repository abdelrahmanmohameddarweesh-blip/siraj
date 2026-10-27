import {
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import app, { emulatorHost } from "../firebase/init";
import { profileAuth } from "../profile/cloudAuth";
import { ensureAuthenticatedUser } from "../profile/cloudIdentity";
import { loadProfile, PROFILE_KEY } from "../profile/profileStore";
import { updateJSON } from "../storage/jsonStore";
import { PersonalProfile } from "../profile/profileModel";
import { loadReportSources } from "../reports/reportStore";
import { localDay } from "../habits/habitData";
import {
  Activity,
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
const db = getFirestore(app),
  functions = getFunctions(app, "europe-west1");
if (emulatorHost) connectFunctionsEmulator(functions, emulatorHost, 5001);
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
async function call<T>(name: string, data: object): Promise<T> {
  await ensureCircleUser();
  const result = await httpsCallable<object, T>(functions, name)(data);
  return result.data;
}
export async function listCircles(): Promise<Circle[]> {
  const u = await ensureCircleUser();
  const list = await getDocs(collection(db, "sohbaAccounts", u.uid, "circles"));
  const rows = await Promise.all(
    list.docs.map(async (s) => {
      const c = await getDoc(doc(db, "sohbaCircles", s.id));
      return c.exists() ? ({ ...c.data(), id: c.id } as Circle) : null;
    }),
  );
  return rows
    .filter((c): c is Circle => !!c)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export const previewCircle = (code: string) =>
  call<Omit<Circle, "id" | "ownerUid" | "createdAt"> & { circleId: string }>(
    "sohbaPreview",
    { code: inviteCode(code) },
  );
export async function createCircle(data: {
  name: string;
  activity: Activity;
  goal: number;
  visible: boolean;
  startDay: string;
}) {
  const p = await loadProfile();
  if (!p) throw new Error("أكمل ملفك الشخصي أولًا");
  return call<{ circleId: string; code: string }>("sohbaCreate", {
    ...data,
    displayName: p.name,
    timeZone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo",
  });
}
export async function joinCircle(
  code: string,
  goal: number,
  visible: boolean,
  activity: Activity,
) {
  const p = await loadProfile();
  if (!p) throw new Error("أكمل ملفك الشخصي أولًا");
  return call<{ circleId: string }>("sohbaJoin", {
    code: inviteCode(code),
    goal,
    visible,
    activity,
    displayName: p.name,
  });
}
export async function loadCircle(id: string): Promise<CircleDetail> {
  const u = await ensureCircleUser(),
    base = doc(db, "sohbaCircles", id);
  const [c, m, companions, days, mine, enc] = await Promise.all([
    getDoc(base),
    getDoc(doc(base, "members", u.uid)),
    getDocs(collection(base, "companions")),
    getDocs(collection(base, "days")),
    getDocs(collection(base, "members", u.uid, "days")),
    getDocs(
      query(
        collection(base, "encouragement"),
        orderBy("createdAt", "desc"),
        limit(20),
      ),
    ),
  ]);
  if (!c.exists() || !m.exists()) throw new Error("لم تعد عضوًا في هذه الصحبة");
  return {
    circle: { ...c.data(), id: c.id } as Circle,
    member: m.data() as Membership,
    companions: companions.docs.map((s) => s.data() as Companion),
    days: Object.fromEntries(days.docs.map((s) => [s.id, s.data().completed])),
    mine: Object.fromEntries(
      mine.docs.map((s) => [s.id, s.data() as PrivateDay]),
    ),
    encouragement: enc.docs.map(
      (s) =>
        ({ ...s.data(), id: s.id }) as CircleDetail["encouragement"][number],
    ),
  };
}
export async function syncCircle(circle: Circle) {
  if (!canSync(circle)) return false;
  const day = circleDay(circle.timeZone),
    source = await loadReportSources([localDay()]);
  await call("sohbaCheckin", {
    circleId: circle.id,
    day,
    ...canonicalProgress(source.readDays, source.listening[day], day),
  });
  return true;
}
export function watchCircle(
  id: string,
  refresh: () => void,
  onError: (e: Error) => void,
) {
  const base = doc(db, "sohbaCircles", id);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const changed = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(refresh, 120);
  };
  const subscriptions = [
    onSnapshot(base, changed, onError),
    ...["companions", "days", "encouragement"].map((name) =>
      onSnapshot(collection(base, name), changed, onError),
    ),
  ];
  return () => {
    if (timer) clearTimeout(timer);
    subscriptions.forEach((unsub) => unsub());
  };
}
export const encourage = (circleId: string, message: string) =>
  call("sohbaEncourage", { circleId, message });
export const preferences = (circleId: string, data: Partial<Membership>) =>
  call("sohbaPreferences", { circleId, ...data });
export const rotateInvite = (circleId: string) =>
  call<{ code: string }>("sohbaRotateInvite", { circleId });
export const leaveCircle = (circleId: string, memberUid?: string) =>
  call("sohbaLeave", { circleId, ...(memberUid ? { memberUid } : {}) });
export const reportCircle = (circleId: string, reason: string) =>
  call("sohbaReport", { circleId, reason });
export function friendlyError(error: any) {
  const code = error?.code || "";
  if (code.includes("not-found") && /الدعوة|الصحبة/.test(error?.message || ""))
    return error.message;
  if (
    code.includes("unavailable") ||
    code.includes("not-found") ||
    code.includes("internal")
  )
    return "تعذّر الاتصال بخدمة الصحبة. تحقق من الإنترنت وتفعيل خدمة صحبة في Firebase.";
  if (code.includes("permission-denied"))
    return "هذه الصحبة خاصة بأعضائها. تحقق من حسابك وإعدادات Firebase.";
  if (code.includes("operation-not-allowed"))
    return "يلزم تفعيل تسجيل الدخول بالبريد والمجهول في Firebase.";
  if (
    code.includes("email-already-in-use") ||
    code.includes("credential-already-in-use")
  )
    return "هذا البريد مسجل بالفعل. اختر «لدي حساب» لتسجيل الدخول.";
  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  )
    return "تحقق من البريد الإلكتروني وكلمة المرور.";
  if (code.includes("invalid-email")) return "اكتب بريدًا إلكترونيًا صالحًا.";
  if (code.includes("too-many-requests"))
    return "محاولات كثيرة. حاول مرة أخرى لاحقًا.";
  return (
    error?.message?.replace(/^Firebase:\s*/, "") ||
    "تعذّر إتمام العملية. حاول مجددًا."
  );
}
