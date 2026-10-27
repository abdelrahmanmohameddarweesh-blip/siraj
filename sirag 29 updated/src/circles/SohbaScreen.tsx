import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";
import { homePalettes, HomePalette } from "../design/homeTheme";
import { localDay } from "../habits/habitData";
import { readJSON, updateJSON } from "../storage/jsonStore";
import { circlePushToken } from "./notifications";
import {
  Activity,
  Circle,
  CircleDetail,
  circleDay,
  inviteCode,
  journeyDays,
  parseGoal,
} from "./model";
import * as liveApi from "./service";

type Page =
  | "list"
  | "create"
  | "join"
  | "detail"
  | "account"
  | "preferences"
  | "invite"
  | "report";
type Account = Awaited<ReturnType<typeof liveApi.accountStatus>>;
const PENDING = "sirag-sohba-pending-code";
const SAVED_CODES = "sirag-sohba-invite-codes";
const unit = (activity: Activity) =>
  activity === "reading" ? "صفحة" : "دقيقة استماع";
const activityName = (activity: Activity) =>
  activity === "reading" ? "قراءة القرآن" : "الاستماع للقرآن";
export default function SohbaScreen({
  navigation,
  route,
  api = liveApi,
}: {
  navigation: any;
  route: any;
  api?: typeof liveApi;
}) {
  const { theme } = useTheme(),
    p = homePalettes[theme],
    s = useMemo(() => styles(p), [p]),
    insets = useSafeAreaInsets();
  const [page, setPage] = useState<Page>("list"),
    [circles, setCircles] = useState<Circle[]>([]),
    [detail, setDetail] = useState<CircleDetail | null>(null),
    [selected, setSelected] = useState("");
  const [account, setAccount] = useState<Account | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [name, setName] = useState(""),
    [activity, setActivity] = useState<Activity>("reading"),
    [goal, setGoal] = useState("2"),
    [visible, setVisible] = useState(false),
    [start, setStart] = useState(localDay());
  const [code, setCode] = useState(""),
    [preview, setPreview] = useState<Awaited<
      ReturnType<typeof liveApi.previewCircle>
    > | null>(null),
    [invite, setInvite] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [existing, setExisting] = useState(false),
    [reason, setReason] = useState("");
  const [reminders, setReminders] = useState(false),
    [summary, setSummary] = useState(false),
    [hour, setHour] = useState("20"),
    [minute, setMinute] = useState("00");
  const locked = useRef(false),
    mounted = useRef(true),
    pendingAction = useRef<null | (() => void)>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = useCallback(async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      if (mounted.current) setError(api.friendlyError(e));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);
  const refresh = useCallback(async () => {
    try {
      const a = await api.accountStatus();
      if (!mounted.current) return;
      setAccount(a);
      if (a.linked) {
        const list = await api.listCircles();
        if (mounted.current) setCircles(list);
      }
      setError("");
    } catch (e) {
      if (mounted.current) setError(api.friendlyError(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  const loadDetail = useCallback(async (id: string, sync = false) => {
    let d = await api.loadCircle(id);
    if (sync) {
      await api.syncCircle(d.circle);
      d = await api.loadCircle(id);
    }
    if (mounted.current) setDetail(d);
    return d;
  }, []);
  useFocusEffect(
    useCallback(() => {
      void refresh();
      if (selected)
        void loadDetail(selected, true).catch((e) =>
          setError(api.friendlyError(e)),
        );
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          void refresh();
          if (selected)
            void loadDetail(selected, true).catch((e) =>
              setError(api.friendlyError(e)),
            );
        }
      });
      return () => listener.remove();
    }, [refresh, loadDetail, selected]),
  );
  useEffect(() => {
    if (page !== "detail" || !selected) return;
    let active = true;
    const update = () =>
      void loadDetail(selected).catch((e) => {
        if (active) setError(api.friendlyError(e));
      });
    const unsub = api.watchCircle(selected, update, (e) =>
      setError(api.friendlyError(e)),
    );
    const timer = setInterval(() => {
      if (AppState.currentState === "active" || Platform.OS === "web")
        void loadDetail(selected, true).catch((e) =>
          setError(api.friendlyError(e)),
        );
    }, 60000);
    return () => {
      active = false;
      unsub();
      clearInterval(timer);
    };
  }, [page, selected, loadDetail]);
  const openJoin = useCallback(async (value: string) => {
    const clean = inviteCode(value);
    if (!/^[A-F0-9]{12}$/.test(clean)) return;
    await updateJSON<string | null>(PENDING, null, () => clean);
    if (mounted.current) {
      setCode(clean);
      setPreview(null);
      setPage("join");
    }
  }, []);
  useEffect(() => {
    void readJSON<string | null>(PENDING, null).then((v) => {
      const incoming = route.params?.code || v;
      if (incoming) void openJoin(incoming);
    });
    if (route.params?.circleId) {
      setSelected(route.params.circleId);
      setPage("detail");
      void loadDetail(route.params.circleId, true).catch((e) =>
        setError(api.friendlyError(e)),
      );
    }
  }, [route.params?.code, route.params?.circleId, openJoin, loadDetail]);
  function linked(next: () => void) {
    if (account?.linked) next();
    else {
      pendingAction.current = next;
      setPage("account");
    }
  }
  async function openCircle(id: string) {
    await loadDetail(id, true);
    setSelected(id);
    setPage("detail");
  }
  async function showInvite() {
    if (!detail) return;
    const codes = await readJSON<Record<string, string>>(SAVED_CODES, {});
    setInvite(codes[detail.circle.id] || "");
    setPage("invite");
  }
  async function saveCode(id: string, value: string) {
    await updateJSON<Record<string, string>>(SAVED_CODES, {}, (old) => ({
      ...old,
      [id]: value,
    }));
    setInvite(value);
  }
  async function shareInvite() {
    if (!detail || !invite) return;
    const base = process.env.EXPO_PUBLIC_INVITE_BASE_URL;
    const link = base
      ? `${base.replace(/\/$/, "")}/?code=${invite}`
      : `sirag://sohba?code=${invite}`;
    await Share.share({
      message: `🌙 ${detail.circle.name}\nسبعة أيام مع القرآن، كلٌّ على قدر استطاعته.\n${detail.circle.startDay} — ${detail.circle.endDay}\nانضم إلى صحبتي في سراج.\nرمز الانضمام: ${invite}\n${link}${base ? "" : "\nبعد تثبيت سراج: افتح «صحبة» ثم «انضم برمز». "}`,
    });
  }
  async function celebrate() {
    if (!detail) return;
    const c = detail.circle,
      total = Object.values(detail.mine).filter((d) => d.done).length;
    await Share.share({
      message: `🌿 أتممت رحلة سبعة أيام مع القرآن في سراج.\nشاركت في ${total} أيام من الرحلة.\nرحلتك أجمل مع صحبة.\nابدأ صحبتك من تطبيق سراج.`,
    });
  }
  function goBack() {
    setError("");
    setNotice("");
    if (page === "join")
      void updateJSON<string | null>(PENDING, null, () => null).catch(() => {});
    if (page === "list") {
      if (navigation.canGoBack?.()) navigation.goBack();
      else navigation.replace?.("Home");
    } else if (["preferences", "invite", "report"].includes(page) && detail)
      setPage("detail");
    else {
      setSelected("");
      setDetail(null);
      setPage("list");
    }
  }
  function input(
    label: string,
    value: string,
    onChange: (s: string) => void,
    extra: object = {},
  ) {
    return (
      <View style={s.field}>
        <Text style={s.label}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          placeholderTextColor={p.muted}
          style={s.input}
          {...extra}
        />
      </View>
    );
  }
  function button(
    label: string,
    onPress: () => void,
    secondary = false,
    disabled = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={busy || disabled}
        onPress={onPress}
        style={[
          s.button,
          secondary && s.secondary,
          (busy || disabled) && { opacity: 0.5 },
        ]}
      >
        <Text style={[s.buttonText, secondary && { color: p.text }]}>
          {label}
        </Text>
      </Pressable>
    );
  }
  function toggle(
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ) {
    return (
      <View style={s.toggle}>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: p.track, true: p.positive }}
        />
        <Text style={[s.body, { flex: 1 }]}>{label}</Text>
      </View>
    );
  }
  const d = detail,
    c = d?.circle,
    today = c ? circleDay(c.timeZone) : localDay(),
    ended = !!c && today > c.endDay,
    before = !!c && today < c.startDay;
  const title = {
    list: "صحبة",
    create: "ابدأ صحبة",
    join: "انضم إلى صحبة",
    detail: c?.name || "صحبتي",
    account: "حساب يدوم معك",
    preferences: "خصوصيتي وتذكيراتي",
    invite: "ادعُ رفيقًا",
    report: "الإبلاغ عن إساءة",
  }[page];
  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          disabled={busy}
          onPress={goBack}
          style={s.back}
        >
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.heading}>{title}</Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              void run(async () => {
                await refresh();
                if (selected) await loadDetail(selected, true);
              });
            }}
            tintColor={p.accent}
          />
        }
      >
        {!!error && (
          <View accessibilityRole="alert" style={s.error}>
            <Text style={s.body}>{error}</Text>
            {button(
              "إعادة المحاولة",
              () =>
                void run(async () => {
                  await refresh();
                  if (selected) await loadDetail(selected, true);
                }),
              true,
            )}
          </View>
        )}
        {!!notice && (
          <Text accessibilityRole="alert" style={s.note}>
            {notice}
          </Text>
        )}
        {busy && (
          <ActivityIndicator color={p.accent} accessibilityLabel="جارٍ الحفظ" />
        )}
        {page === "list" && (
          <>
            <ImageBackground
              source={
                theme === "dark"
                  ? require("../../assets/design/home-night.png")
                  : require("../../assets/design/home-dawn.png")
              }
              style={s.hero}
              imageStyle={{ borderRadius: 28 }}
            >
              <LinearGradient
                colors={
                  theme === "dark"
                    ? ["rgba(6,28,29,.25)", "#061C1D"]
                    : ["rgba(248,244,234,.25)", "#F8F4EA"]
                }
                style={s.heroInner}
              >
                <Text style={s.eyebrow}>معًا، خطوة كل يوم</Text>
                <Text style={s.heroTitle}>رحلتك أجمل مع صحبة</Text>
                <Text style={s.body}>
                  سبعة أيام مع القرآن. هدف يناسبك، ورفاق يشجّعونك.
                </Text>
              </LinearGradient>
            </ImageBackground>
            {button("ابدأ صحبة", () =>
              linked(() => {
                setName("");
                setGoal("2");
                setActivity("reading");
                setVisible(false);
                setStart(localDay());
                setPage("create");
              }),
            )}
            {button(
              "انضم برمز",
              () => {
                setPreview(null);
                setPage("join");
              },
              true,
            )}
            <View style={s.card}>
              <Text style={s.cardTitle}>وردك لك، والتشجيع بينكم</Text>
              <Text style={s.body}>
                مقادير قراءتك واستماعك خاصة بك. يرى الرفاق إجمالي عدد المشاركين
                الذين أتمّوا نيتهم، دون ترتيب أو مقارنة. إظهار حالتك باسمك
                اختياري.
              </Text>
            </View>
            <Text style={s.section}>صحباتي · {circles.length}</Text>
            {loading && <ActivityIndicator color={p.accent} />}
            {!loading && !circles.length && (
              <Text style={s.body}>
                ابدأ رحلة صغيرة مع شخص تحبه، أو أدخل رمز دعوته.
              </Text>
            )}
            {circles.map((circle) => (
              <Pressable
                key={circle.id}
                accessibilityRole="button"
                accessibilityLabel={`افتح ${circle.name}`}
                style={s.card}
                onPress={() => void run(() => openCircle(circle.id))}
              >
                <Text style={s.cardTitle}>{circle.name}</Text>
                <Text style={s.body}>
                  {activityName(circle.activity)} · {circle.memberCount}/١٠ رفاق
                </Text>
                <Text style={s.caption}>
                  {circle.startDay} — {circle.endDay}
                </Text>
                <Text style={s.link}>
                  {circleDay(circle.timeZone) > circle.endDay
                    ? "شاهد حصاد الرحلة ←"
                    : "تابع رحلتك ←"}
                </Text>
              </Pressable>
            ))}
            {button(
              account?.linked
                ? `حسابي · ${account.email || ""}`
                : "احفظ صحبتك بحساب قابل للاسترجاع",
              () => {
                pendingAction.current = null;
                setPage("account");
              },
              true,
            )}
          </>
        )}
        {page === "account" && (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              {account?.linked ? "حسابك محفوظ" : "صحبتك تستحق أن تبقى"}
            </Text>
            <Text style={s.body}>
              اربط حسابك بالبريد لتستعيد عضويتك على هاتف آخر. لا يُعرض بريدك أو
              جنسك لرفاقك. تحتاج الخدمة اتصالًا بالإنترنت.
            </Text>
            {account?.linked ? (
              <>
                <Text style={s.note}>{account.email}</Text>
                <Text style={s.caption}>
                  {account.verified
                    ? "البريد موثّق"
                    : "راجع بريدك لتوثيق الحساب."}
                </Text>
                {!account.verified &&
                  button(
                    "إرسال رسالة التوثيق",
                    () =>
                      void run(async () => {
                        await api.verifyEmail();
                        setNotice("تم إرسال رسالة التوثيق.");
                      }),
                    true,
                  )}
                {button("متابعة إلى صحبتي", () => {
                  if (pendingAction.current) {
                    pendingAction.current();
                    pendingAction.current = null;
                  } else setPage("list");
                })}
                {button(
                  "تسجيل الدخول بحساب آخر",
                  () => {
                    setAccount(null);
                    setExisting(true);
                    setEmail("");
                    setPassword("");
                  },
                  true,
                )}
              </>
            ) : (
              <>
                {input("البريد الإلكتروني", email, setEmail, {
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                  autoComplete: "email",
                  textContentType: "emailAddress",
                })}
                {input("كلمة المرور", password, setPassword, {
                  secureTextEntry: true,
                  autoCapitalize: "none",
                  autoComplete: existing ? "current-password" : "new-password",
                })}
                <Text style={s.caption}>
                  {existing
                    ? "تسجيل الدخول يستعيد عضوية الحساب المسجّل. يبقى سجل عبادتك المحلي على هذا الجهاز."
                    : "٨ أحرف على الأقل. الربط يحافظ على هوية حسابك الحالية."}
                </Text>
                {button(
                  existing ? "تسجيل الدخول" : "اربط حسابي بأمان",
                  () =>
                    void run(async () => {
                      const status = existing
                        ? await api.signInAccount(email, password)
                        : await api.linkAccount(email, password);
                      setAccount(status);
                      setPassword("");
                      await refresh();
                      if (pendingAction.current) {
                        const next = pendingAction.current;
                        pendingAction.current = null;
                        setTimeout(next, 0);
                      } else setPage("list");
                    }),
                )}
                {button(
                  existing ? "إنشاء حساب جديد" : "لدي حساب بالفعل",
                  () => setExisting(!existing),
                  true,
                )}
                {existing &&
                  button(
                    "نسيت كلمة المرور",
                    () =>
                      void run(async () => {
                        await api.resetPassword(email);
                        setNotice(
                          "إذا كان البريد مسجلًا، ستصلك تعليمات استعادة كلمة المرور.",
                        );
                      }),
                    true,
                  )}
              </>
            )}
          </View>
        )}
        {page === "create" && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>رحلة صغيرة، أثر يدوم</Text>
              {input("اسم الصحبة", name, setName, {
                maxLength: 50,
                placeholder: "مثلًا: صحبة العائلة",
              })}
              <Text style={s.label}>نوع الرحلة</Text>
              <View style={s.row}>
                {button(
                  "قراءة",
                  () => {
                    setActivity("reading");
                    setGoal("2");
                  },
                  activity !== "reading",
                )}
                {button(
                  "استماع",
                  () => {
                    setActivity("listening");
                    setGoal("10");
                  },
                  activity !== "listening",
                )}
              </View>
              {input(`هدفي اليومي (${unit(activity)})`, goal, setGoal, {
                keyboardType: "number-pad",
                maxLength: 3,
              })}
              <Text style={s.label}>تاريخ البداية · سبعة أيام</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.row}
              >
                {journeyDays(localDay()).map((day) => (
                  <Pressable
                    key={day}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: start === day }}
                    accessibilityLabel={day}
                    onPress={() => setStart(day)}
                    style={[
                      s.chip,
                      start === day && {
                        borderColor: p.accent,
                        backgroundColor: p.soft,
                      },
                    ]}
                  >
                    <Text style={s.body}>
                      {day === localDay() ? "اليوم" : day.slice(5)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={s.caption}>
                لكل رفيق هدفه الشخصي، قراءة أو استماع. حتى عشرة أعضاء. لا تُجمع
                القراءة والاستماع كوحدة واحدة.
              </Text>
              {toggle("أسمح بإظهار إتمام نيتي بجوار اسمي", visible, setVisible)}
              {button(
                "أنشئ الصحبة",
                () =>
                  void run(async () => {
                    const result = await api.createCircle({
                      name,
                      activity,
                      goal: parseGoal(goal, activity),
                      visible,
                      startDay: start,
                    });
                    await saveCode(result.circleId, result.code);
                    await refresh();
                    await openCircle(result.circleId);
                    setPage("invite");
                  }),
              )}
            </View>
          </>
        )}
        {page === "join" && (
          <View style={s.card}>
            <Text style={s.cardTitle}>هناك من ينتظرك في الرحلة</Text>
            {input(
              "رمز الدعوة أو رابطها",
              code,
              (v) => {
                setCode(v);
                setPreview(null);
              },
              { autoCapitalize: "characters", autoCorrect: false },
            )}
            {button(
              "عرض الدعوة",
              () =>
                void run(async () => {
                  const clean = inviteCode(code);
                  if (!/^[A-F0-9]{12}$/.test(clean))
                    throw new Error(
                      "أدخل رمز الدعوة المكوّن من ١٢ حرفًا ورقمًا",
                    );
                  await updateJSON<string | null>(PENDING, null, () => clean);
                  const found = await api.previewCircle(clean);
                  setPreview(found);
                  setActivity(found.activity);
                  setGoal(found.activity === "reading" ? "2" : "10");
                }),
            )}
            {preview && (
              <>
                <View style={s.divider} />
                <Text style={s.cardTitle}>{preview.name}</Text>
                <Text style={s.body}>
                  {activityName(preview.activity)} · {preview.memberCount}/١٠
                  رفاق
                </Text>
                <Text style={s.caption}>
                  {preview.startDay} — {preview.endDay} · {preview.timeZone}
                </Text>
                <Text style={s.label}>اختر وردك الشخصي</Text>
                <View style={s.row}>
                  {button(
                    "قراءة",
                    () => {
                      setActivity("reading");
                      setGoal("2");
                    },
                    activity !== "reading",
                  )}
                  {button(
                    "استماع",
                    () => {
                      setActivity("listening");
                      setGoal("10");
                    },
                    activity !== "listening",
                  )}
                </View>
                {input(`هدفي اليومي (${unit(activity)})`, goal, setGoal, {
                  keyboardType: "number-pad",
                  maxLength: 3,
                })}
                {toggle(
                  "أسمح بإظهار إتمام نيتي بجوار اسمي",
                  visible,
                  setVisible,
                )}
                {button(
                  "انضم إلى الرحلة",
                  () =>
                    linked(
                      () =>
                        void run(async () => {
                          const result = await api.joinCircle(
                            code,
                            parseGoal(goal, activity),
                            visible,
                            activity,
                          );
                          await updateJSON<string | null>(
                            PENDING,
                            null,
                            () => null,
                          );
                          await refresh();
                          await openCircle(result.circleId);
                        }),
                    ),
                  false,
                  preview.memberCount >= 10 ||
                    circleDay(preview.timeZone) > preview.endDay,
                )}
              </>
            )}
          </View>
        )}
        {page === "detail" && d && c && (
          <>
            <View style={s.card}>
              <Text style={s.eyebrow}>صحبة القرآن · لكل رفيق ورده</Text>
              <Text style={s.heroTitle}>
                {before
                  ? "تبدأ قريبًا"
                  : ended
                    ? "حصاد صحبتكم"
                    : "خطوة اليوم تصنع الأثر"}
              </Text>
              <Text style={s.body}>
                {before
                  ? `موعد البداية ${c.startDay}`
                  : ended
                    ? "اكتملت الأيام السبعة. كل خطوة تستحق الشكر."
                    : `أتمّ ${d.days[today] || 0} من ${c.memberCount} رفاق نيتهم اليوم`}
              </Text>
              <View style={s.track}>
                <View
                  style={[
                    s.fill,
                    {
                      width: `${Math.min(100, ((d.days[today] || 0) / Math.max(1, c.memberCount)) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={s.caption}>
                {c.startDay} — {c.endDay} · {c.timeZone}
              </Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>نيتي اليومية</Text>
              <Text style={s.big}>
                {d.member.goal}{" "}
                <Text style={s.body}>{unit(d.member.activity)}</Text>
              </Text>
              <Text style={s.body}>
                اليوم: {d.mine[today]?.pages || 0} صفحة ·{" "}
                {Math.floor((d.mine[today]?.seconds || 0) / 60)} دقيقة استماع
              </Text>
              <Text style={s.note}>
                {d.mine[today]?.done
                  ? "✓ أتممت نيتك اليوم، تقبّل الله"
                  : "كل خطوة صغيرة لها أثرها"}
              </Text>
              {!ended && !before && (
                <>
                  {button(
                    d.member.activity === "reading"
                      ? "افتح المصحف"
                      : "افتح المصحف واختر الاستماع",
                    () => navigation.navigate("QuranReader"),
                  )}
                  {button(
                    "تحديث تقدمي من السجل",
                    () =>
                      void run(async () => {
                        const synced = await api.syncCircle(c);
                        if (!synced)
                          throw new Error(
                            "تأكد أن تاريخ جهازك يوافق تاريخ الصحبة. التحديث متاح أثناء الرحلة فقط.",
                          );
                        await loadDetail(c.id);
                        setNotice(
                          "تم تحديث تقدمك من سجل القراءة والاستماع، دون مضاعفة.",
                        );
                      }),
                    true,
                  )}
                </>
              )}
              <Text style={s.caption}>
                تُحتسب الصفحات التي أكّدت قراءتها ووقت التشغيل الفعلي. فتح
                المصحف وحده لا يسجّل إنجازًا. كمياتك خاصة بك. الهدف ثابت خلال
                الرحلة.
              </Text>
            </View>
            <Text style={s.section}>سبعة أيام من الصحبة</Text>
            <View style={s.calendar}>
              {journeyDays(c.startDay).map((day, i) => (
                <View
                  key={day}
                  style={[s.day, day === today && { borderColor: p.accent }]}
                >
                  <Text style={s.caption}>{i + 1}</Text>
                  <Text
                    style={[
                      s.dayMark,
                      { color: d.mine[day]?.done ? p.positive : p.muted },
                    ]}
                  >
                    {d.mine[day]?.done ? "✓" : day > today ? "·" : "○"}
                  </Text>
                  <Text style={s.caption}>
                    {d.days[day] || 0}/{c.memberCount}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={s.caption}>
              العلامة لنيتك الشخصية، والعدد لإنجاز الصحبة. الأيام الفائتة لا
              تمحو تقدمك.
            </Text>
            <View style={s.card}>
              <Text style={s.cardTitle}>رفاق الرحلة</Text>
              {d.companions.map((m) => (
                <View key={m.uid} style={s.member}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>
                      {m.name}
                      {m.uid === d.member.uid ? " · أنت" : ""}
                      {m.uid === c.ownerUid ? " · منشئ الصحبة" : ""}
                    </Text>
                    <Text style={s.caption}>
                      {m.visible
                        ? m.statuses?.[today] === true
                          ? "أتمّ نيته اليوم"
                          : m.statuses?.[today] === false
                            ? "في رحلته اليوم"
                            : "لم يشارك تحديثًا اليوم"
                        : "تفاصيل مشاركته خاصة"}
                    </Text>
                  </View>
                  {c.ownerUid === d.member.uid && m.uid !== d.member.uid && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`إزالة ${m.name}`}
                      onPress={() =>
                        Alert.alert(
                          "إزالة رفيق",
                          "سيُحذف تقدمه المشترك، وتُبطل الدعوة الحالية لمنع عودته بها. أنشئ رمز دعوة جديدًا لبقية رفاقك.",
                          [
                            { text: "إلغاء", style: "cancel" },
                            {
                              text: "إزالة",
                              style: "destructive",
                              onPress: () =>
                                void run(async () => {
                                  await api.leaveCircle(c.id, m.uid);
                                  await loadDetail(c.id);
                                }),
                            },
                          ],
                        )
                      }
                    >
                      <Text style={s.link}>إزالة</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>كلمة طيبة لرفاقك</Text>
              <View style={s.wrap}>
                {["بارك الله فيكم", "معًا نستمر", "تقبّل الله"].map(
                  (message) => (
                    <Pressable
                      key={message}
                      accessibilityRole="button"
                      disabled={busy}
                      style={s.chip}
                      onPress={() =>
                        void run(async () => {
                          await api.encourage(c.id, message);
                          await loadDetail(c.id);
                        })
                      }
                    >
                      <Text style={s.body}>{message}</Text>
                    </Pressable>
                  ),
                )}
              </View>
              {d.encouragement.slice(0, 6).map((e) => (
                <Text key={e.id} style={s.caption}>
                  {e.name}: {e.message}
                </Text>
              ))}
            </View>
            {ended && (
              <View style={s.card}>
                <Text style={s.cardTitle}>🌿 حصاد رحلتك</Text>
                <Text style={s.big}>
                  {Object.values(d.mine).filter((day) => day.done).length} / ٧
                  أيام
                </Text>
                <Text style={s.body}>
                  {Object.values(d.mine).reduce((n, day) => n + day.pages, 0)}{" "}
                  صفحة مؤكدة ·{" "}
                  {Math.floor(
                    Object.values(d.mine).reduce(
                      (n, day) => n + day.seconds,
                      0,
                    ) / 60,
                  )}{" "}
                  دقيقة استماع
                </Text>
                <Text style={s.caption}>
                  هذه تفاصيلك الخاصة. بطاقة المشاركة تذكر أيام مشاركتك فقط، دون
                  أسماء رفاقك أو سجلاتهم.
                </Text>
                {button("شارك فرحة رحلتك", () => void run(celebrate))}
                {button("ابدأ رحلة جديدة مع رفاقك", () => {
                  setName(c.name);
                  setActivity(c.activity);
                  setGoal(String(d.member.goal));
                  setStart(localDay());
                  setPage("create");
                })}
                <Text style={s.caption}>
                  سيُنشأ رمز جديد. ادعُ رفاقك مجددًا ليختاروا الانضمام.
                </Text>
              </View>
            )}
            {c.ownerUid === d.member.uid &&
              !ended &&
              button("ادعُ رفيقًا", () => void run(showInvite))}
            {button(
              "الخصوصية والتذكيرات",
              () => {
                setVisible(d.member.visible);
                setReminders(d.member.reminders);
                setSummary(d.member.summary);
                setHour(String(d.member.reminderHour));
                setMinute(String(d.member.reminderMinute).padStart(2, "0"));
                setPage("preferences");
              },
              true,
            )}
            {button(
              "الإبلاغ عن إساءة",
              () => {
                setReason("");
                setPage("report");
              },
              true,
            )}
            {button(
              "مغادرة الصحبة",
              () =>
                Alert.alert(
                  "مغادرة الصحبة",
                  "سيُحذف تقدمك المشترك وردودك من الصحبة. يبقى سجل عبادتك الخاص على جهازك. تنتقل إدارة الصحبة تلقائيًا لرفيق آخر إن كنت المنشئ.",
                  [
                    { text: "إلغاء", style: "cancel" },
                    {
                      text: "مغادرة",
                      style: "destructive",
                      onPress: () =>
                        void run(async () => {
                          await api.leaveCircle(c.id);
                          setSelected("");
                          setDetail(null);
                          setPage("list");
                          await refresh();
                        }),
                    },
                  ],
                ),
              true,
            )}
          </>
        )}
        {page === "invite" && d && (
          <View style={s.card}>
            <Text style={s.eyebrow}>دعوة لخطوة أجمل</Text>
            <Text style={s.heroTitle}>{d.circle.name}</Text>
            <Text style={s.body}>
              سبعة أيام مع القرآن، كلٌّ على قدر استطاعته.
            </Text>
            <Text style={s.caption}>
              {d.circle.startDay} — {d.circle.endDay}
            </Text>
            {invite ? (
              <>
                <Text selectable style={s.code}>
                  {invite}
                </Text>
                {button("شارك الدعوة", () => void run(shareInvite))}
                <Text style={s.caption}>
                  شارك الرمز مع من تثق بهم. يستطيع حامله الانضمام حتى يكتمل
                  العدد. لا تنشره علنًا إذا أردت صحبة خاصة.
                </Text>
              </>
            ) : (
              <Text style={s.body}>
                لا يُخزّن رمز الدعوة كنص في قاعدة البيانات. أنشئ رمزًا جديدًا
                للمشاركة من هذا الجهاز.
              </Text>
            )}
            {button(
              invite ? "إبطال الرمز وإنشاء دعوة جديدة" : "إنشاء رمز دعوة جديد",
              () =>
                Alert.alert(
                  "تغيير الدعوة",
                  "ستتوقف الرموز السابقة عن العمل. لا تتأثر عضوية رفاقك الحاليين.",
                  [
                    { text: "إلغاء", style: "cancel" },
                    {
                      text: "تغيير الرمز",
                      onPress: () =>
                        void run(async () => {
                          const result = await api.rotateInvite(d.circle.id);
                          await saveCode(d.circle.id, result.code);
                        }),
                    },
                  ],
                ),
              true,
            )}
          </View>
        )}
        {page === "preferences" && d && (
          <View style={s.card}>
            <Text style={s.cardTitle}>اختر ما يناسبك</Text>
            {toggle("إظهار إتمام نيتي بجوار اسمي", visible, setVisible)}
            <Text style={s.caption}>
              إيقافه يخفي حالتك الحالية والسابقة عن الرفاق. تبقى مساهمتك ضمن
              إجمالي الصحبة. لا تُشارك كمياتك الدقيقة مطلقًا.
            </Text>
            {toggle("تذكير شخصي بالورد", reminders, setReminders)}
            {toggle("ملخّص يومي بعدد من أتمّوا نيتهم", summary, setSummary)}
            <View style={s.row}>
              {input("الساعة (٠–٢٣)", hour, setHour, {
                keyboardType: "number-pad",
                maxLength: 2,
              })}
              {input("الدقيقة", minute, setMinute, {
                keyboardType: "number-pad",
                maxLength: 2,
              })}
            </View>
            <Text style={s.caption}>
              بتوقيت {d.circle.timeZone}. تُرسل الإشعارات خلال ربع ساعة من الوقت
              المحدد، وتحتاج نسخة هاتف مستقلة. عند تفعيل الملخّص والتذكير معًا
              تصلك رسالة واحدة.
            </Text>
            {button(
              "احفظ تفضيلاتي",
              () =>
                void run(async () => {
                  const h = Number(
                      hour.replace(/[٠-٩]/g, (v) =>
                        String(v.charCodeAt(0) - 1632),
                      ),
                    ),
                    m = Number(
                      minute.replace(/[٠-٩]/g, (v) =>
                        String(v.charCodeAt(0) - 1632),
                      ),
                    );
                  if (
                    !hour.trim() ||
                    !minute.trim() ||
                    !Number.isInteger(h) ||
                    h < 0 ||
                    h > 23 ||
                    !Number.isInteger(m) ||
                    m < 0 ||
                    m > 59
                  )
                    throw new Error("أدخل وقتًا صحيحًا");
                  let pushToken = d.member.pushToken || null;
                  if ((reminders || summary) && !pushToken)
                    pushToken = await circlePushToken();
                  await api.preferences(d.circle.id, {
                    visible,
                    reminders,
                    summary,
                    reminderHour: h,
                    reminderMinute: m,
                    pushToken,
                  });
                  await loadDetail(d.circle.id);
                  setPage("detail");
                  setNotice("تم حفظ تفضيلاتك.");
                }),
            )}
          </View>
        )}
        {page === "report" && d && (
          <View style={s.card}>
            <Text style={s.cardTitle}>ساعدنا في الحفاظ على صحبة آمنة</Text>
            {input("سبب الإبلاغ", reason, setReason, {
              multiline: true,
              maxLength: 500,
            })}
            <Text style={s.caption}>
              يصل البلاغ إلى إدارة سراج، ولا يظهر لرفاقك. يمكنك مغادرة الصحبة
              فورًا.
            </Text>
            {button(
              "إرسال البلاغ",
              () =>
                void run(async () => {
                  await api.reportCircle(d.circle.id, reason);
                  setPage("detail");
                  setNotice("تم إرسال البلاغ للمراجعة.");
                }),
            )}
          </View>
        )}
        {page === "detail" && !detail && <ActivityIndicator color={p.accent} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
function styles(p: HomePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 22,
      paddingVertical: 12,
      gap: 12,
    },
    heading: {
      fontFamily: "PlexBold",
      fontSize: 24,
      color: p.text,
      flex: 1,
      textAlign: "right",
    },
    back: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: p.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: { fontSize: 36, color: p.accent, lineHeight: 40 },
    content: {
      paddingHorizontal: 20,
      gap: 16,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    hero: { height: 270, overflow: "hidden", borderRadius: 28 },
    heroInner: { flex: 1, justifyContent: "flex-end", padding: 24, gap: 10 },
    eyebrow: {
      fontFamily: "PlexMedium",
      fontSize: 12,
      color: p.accent,
      textAlign: "right",
    },
    heroTitle: {
      fontFamily: "Ruqaa",
      fontSize: 32,
      lineHeight: 49,
      color: p.text,
      textAlign: "right",
    },
    body: {
      fontFamily: "Plex",
      fontSize: 14,
      lineHeight: 25,
      color: p.secondary,
      textAlign: "right",
    },
    card: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      borderRadius: 24,
      padding: 20,
      gap: 14,
    },
    cardTitle: {
      fontFamily: "PlexBold",
      fontSize: 19,
      color: p.text,
      textAlign: "right",
    },
    section: {
      fontFamily: "PlexBold",
      fontSize: 20,
      color: p.text,
      textAlign: "right",
      marginTop: 8,
    },
    label: {
      fontFamily: "PlexSemi",
      fontSize: 14,
      color: p.text,
      textAlign: "right",
    },
    caption: {
      fontFamily: "Plex",
      fontSize: 11,
      lineHeight: 21,
      color: p.muted,
      textAlign: "right",
    },
    field: { gap: 8, flexGrow: 1, minWidth: 80 },
    input: {
      fontFamily: "Plex",
      fontSize: 16,
      color: p.text,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 14,
      padding: 14,
      textAlign: "right",
      backgroundColor: p.background,
      minHeight: 52,
    },
    button: {
      minHeight: 52,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: p.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontFamily: "PlexBold",
      fontSize: 14,
      color: p.accentText,
      textAlign: "center",
    },
    secondary: {
      backgroundColor: p.raised,
      borderWidth: 1,
      borderColor: p.border,
    },
    row: { flexDirection: "row", gap: 10, alignItems: "center" },
    wrap: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" },
    toggle: { flexDirection: "row", gap: 12, alignItems: "center" },
    chip: {
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.raised,
    },
    note: {
      fontFamily: "PlexSemi",
      color: p.positive,
      textAlign: "right",
      fontSize: 14,
      lineHeight: 25,
    },
    error: {
      borderWidth: 1,
      borderColor: "#C78562",
      borderRadius: 18,
      padding: 16,
      gap: 10,
      backgroundColor: p.surface,
    },
    link: {
      fontFamily: "PlexSemi",
      fontSize: 13,
      color: p.accent,
      textAlign: "right",
    },
    divider: { height: 1, backgroundColor: p.border },
    big: {
      fontFamily: "PlexBold",
      fontSize: 30,
      color: p.accent,
      textAlign: "right",
    },
    track: {
      height: 8,
      backgroundColor: p.track,
      borderRadius: 8,
      overflow: "hidden",
    },
    fill: { height: "100%", backgroundColor: p.positive, borderRadius: 8 },
    calendar: { flexDirection: "row", gap: 5 },
    day: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
    },
    dayMark: { fontSize: 24 },
    member: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: p.border,
      paddingTop: 12,
    },
    code: {
      fontFamily: "PlexBold",
      fontSize: 25,
      letterSpacing: 2,
      color: p.accent,
      textAlign: "center",
      padding: 18,
      backgroundColor: p.raised,
      borderRadius: 18,
    },
  });
}
