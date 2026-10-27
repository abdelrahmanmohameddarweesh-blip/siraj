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
import { addDays } from "../quran/hifz/hifzEngine";
import { readJSON, updateJSON } from "../storage/jsonStore";
import { circlePushToken } from "./notifications";
import {
  Activity,
  Circle,
  CircleDetail,
  CircleOptions,
  defaultCircleOptions,
  activityOptions,
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
  | "report"
  | "settings";
type Account = Awaited<ReturnType<typeof liveApi.accountStatus>>;
const PENDING = "sirag-sohba-pending-code",
  SAVED_CODES = "sirag-sohba-invite-codes";
const habitLabel = (c: Circle) =>
  c.habitName || activityOptions[c.activity].label;
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
    [habitName, setHabitName] = useState(""),
    [start, setStart] = useState(localDay()),
    [end, setEnd] = useState(addDays(localDay(), 6));
  const [options, setOptions] = useState<CircleOptions>({
      ...defaultCircleOptions,
    }),
    [capacity, setCapacity] = useState("10"),
    [advanced, setAdvanced] = useState(false);
  const [visible, setVisible] = useState(true),
    [nameVisible, setNameVisible] = useState(true),
    [code, setCode] = useState(""),
    [invite, setInvite] = useState(""),
    [amount, setAmount] = useState("0");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [existing, setExisting] = useState(false),
    [reason, setReason] = useState("");
  const [reminders, setReminders] = useState(false),
    [summary, setSummary] = useState(false),
    [hour, setHour] = useState("20"),
    [minute, setMinute] = useState("00");
  const mounted = useRef(true),
    locked = useRef(false),
    autoCode = useRef("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = useCallback(
    async (work: () => Promise<void>) => {
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
    },
    [api],
  );
  const refresh = useCallback(async () => {
    const a = await api.accountStatus();
    const rows = await api.listCircles();
    if (mounted.current) {
      setAccount(a);
      setCircles(rows);
      setLoading(false);
    }
  }, [api]);
  const loadDetail = useCallback(
    async (id: string, sync = false) => {
      let d = await api.loadCircle(id);
      if (sync) {
        await api.syncCircle(d.circle, d.member.activity);
        d = await api.loadCircle(id);
      }
      if (mounted.current) {
        setError("");
        setDetail(d);
      }
      return d;
    },
    [api],
  );
  const ownValue = detail?.mine[circleDay(detail.circle.timeZone)]?.value;
  useEffect(
    () => setAmount(String(ownValue || 0)),
    [detail?.circle.id, ownValue],
  );
  const failure = useCallback(
    (e: any) => {
      if (mounted.current) {
        setError(api.friendlyError(e));
        setLoading(false);
      }
    },
    [api],
  );
  useFocusEffect(
    useCallback(() => {
      void refresh().catch(failure);
      if (selected) void loadDetail(selected, true).catch(failure);
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          void refresh().catch(failure);
          if (selected) void loadDetail(selected, true).catch(failure);
        }
      });
      return () => sub.remove();
    }, [refresh, loadDetail, selected, failure]),
  );
  useEffect(() => {
    if (
      page !== "detail" ||
      !selected ||
      !detail ||
      detail.circle.id !== selected
    )
      return;
    const update = () => void loadDetail(selected).catch(failure);
    const unsub = api.watchCircle(
      selected,
      update,
      failure,
      detail?.circle.showGroupProgress !== false,
    );
    const timer = setInterval(() => {
      if (AppState.currentState === "active" || Platform.OS === "web")
        void loadDetail(selected, true).catch(failure);
    }, 60000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [
    page,
    selected,
    loadDetail,
    failure,
    api,
    detail?.circle.showGroupProgress,
    detail?.circle.id,
  ]);
  async function openCircle(id: string) {
    await loadDetail(id, true);
    setSelected(id);
    setPage("detail");
  }
  async function join(raw: string) {
    const clean = inviteCode(raw);
    if (!/^[A-F0-9]{12}$/.test(clean))
      throw new Error("أدخل رمز الدعوة المكوّن من ١٢ حرفًا ورقمًا");
    setCode(clean);
    await updateJSON<string | null>(PENDING, null, () => clean);
    const result = await api.joinCircle(clean);
    await updateJSON<string | null>(PENDING, null, () => null);
    await refresh();
    await openCircle(result.circleId);
    setNotice(
      "أهلًا بك في الصحبة. انضممت مباشرة دون بريد إلكتروني. يمكنك ضبط خصوصيتك من التفضيلات.",
    );
  }
  useEffect(() => {
    let alive = true;
    void (async () => {
      const pending =
        route.params?.code || (await readJSON<string | null>(PENDING, null));
      if (pending && alive && autoCode.current !== pending) {
        autoCode.current = pending;
        setCode(pending);
        setPage("join");
        void run(() => join(pending));
      } else if (route.params?.circleId && alive) {
        setSelected(route.params.circleId);
        setPage("detail");
        void loadDetail(route.params.circleId, true).catch(failure);
      }
    })().catch(failure);
    return () => {
      alive = false;
    };
  }, [route.params?.code, route.params?.circleId]);
  async function saveCode(id: string, value: string) {
    await updateJSON<Record<string, string>>(SAVED_CODES, {}, (old) => ({
      ...old,
      [id]: value,
    }));
    setInvite(value);
  }
  async function showInvite() {
    if (!detail) return;
    const codes = await readJSON<Record<string, string>>(SAVED_CODES, {});
    setInvite(codes[detail.circle.id] || "");
    setPage("invite");
  }
  function newCircle() {
    setName("");
    setActivity("reading");
    setGoal("2");
    setHabitName("");
    setStart(localDay());
    setEnd(addDays(localDay(), 6));
    setOptions({ ...defaultCircleOptions });
    setCapacity("10");
    setAdvanced(false);
    setPage("create");
  }
  function settingsFor(c: Circle) {
    setName(c.name);
    setOptions({
      ...defaultCircleOptions,
      ...Object.fromEntries(
        Object.keys(defaultCircleOptions).map((k) => [
          k,
          (c as any)[k] ?? (defaultCircleOptions as any)[k],
        ]),
      ),
    });
    setCapacity(String(c.maxMembers || 10));
    setPage("settings");
  }
  function back() {
    setError("");
    setNotice("");
    if (page === "list") {
      if (navigation.canGoBack?.()) navigation.goBack();
      else navigation.replace?.("Home");
    } else if (
      ["invite", "preferences", "settings", "report", "account"].includes(
        page,
      ) &&
      detail
    )
      setPage("detail");
    else {
      if (page === "join")
        void updateJSON<string | null>(PENDING, null, () => null).catch(
          failure,
        );
      setSelected("");
      setDetail(null);
      setPage("list");
    }
  }
  const num = (text: string) =>
    Number(
      text
        .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
        .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)),
    );
  function draftOptions() {
    const maxMembers = num(capacity);
    if (
      !capacity.trim() ||
      !Number.isInteger(maxMembers) ||
      maxMembers < 2 ||
      maxMembers > 30
    )
      throw new Error("اختر عددًا من ٢ إلى ٣٠ عضوًا");
    return { ...options, maxMembers };
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
          disabled={busy}
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: p.track, true: p.positive }}
        />
        <Text style={[s.body, { flex: 1 }]}>{label}</Text>
      </View>
    );
  }
  function privacyOptions() {
    return (
      <>
        {toggle("إظهار أسماء الأعضاء", options.showNames, (v) =>
          setOptions((o) => ({ ...o, showNames: v })),
        )}
        {toggle("إظهار إجمالي تقدم الصحبة", options.showGroupProgress, (v) =>
          setOptions((o) => ({ ...o, showGroupProgress: v })),
        )}
        {toggle("إظهار نسبة تقدم كل عضو", options.showMemberProgress, (v) =>
          setOptions((o) => ({ ...o, showMemberProgress: v })),
        )}
        {toggle(
          "إظهار الأعضاء الذين أتمّوا هدفهم",
          options.showCompletedMembers,
          (v) => setOptions((o) => ({ ...o, showCompletedMembers: v })),
        )}
        {toggle(
          "إظهار الأعضاء الذين لم يتمّوا بعد",
          options.showPendingMembers,
          (v) => setOptions((o) => ({ ...o, showPendingMembers: v })),
        )}
        <Text style={s.caption}>
          الأسماء المخفية تُستبدل بألقاب مثل «رفيق ١»، حتى في التشجيع. نسبة
          التقدم تظهر فقط للفئات المسموح بإظهارها. يستطيع العضو إخفاء اسمه
          وحالته أيضًا. المقادير الدقيقة خاصة بكل عضو.
        </Text>
      </>
    );
  }
  const d = detail,
    c = d?.circle,
    today = c ? circleDay(c.timeZone) : localDay(),
    ended = !!c && today > c.endDay,
    before = !!c && today < c.startDay;
  const duration = c ? journeyDays(c.startDay, c.endDay).length : 7;
  const title = {
    list: "صحبة",
    create: "ابدأ صحبة",
    join: "انضم إلى صحبة",
    detail: c?.name || "صحبتي",
    account: "حفظ الحساب · اختياري",
    preferences: "خصوصيتي وتذكيراتي",
    invite: "ادعُ رفيقًا",
    report: "الإبلاغ عن إساءة",
    settings: "إعدادات الصحبة",
  }[page];
  async function shareInvitation() {
    if (!c || !invite) return;
    const base = process.env.EXPO_PUBLIC_INVITE_BASE_URL;
    const link = base
      ? `${base.replace(/\/$/, "")}/join?code=${invite}`
      : `sirag://sohba?code=${invite}`;
    await Share.share({
      message: `🌿 ${c.name}\nنتعاون على ${habitLabel(c)}\n${c.startDay} — ${c.endDay}\nانضم مباشرة إلى صحبتنا في سراج، دون بريد إلكتروني.\n${link}\nرمز الانضمام: ${invite}\nأو افتح سراج ← صحبة ← انضم برمز.`,
    });
  }
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
          onPress={back}
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
            onRefresh={() =>
              void run(async () => {
                await refresh();
                if (selected) await loadDetail(selected, true);
              })
            }
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
                <Text style={s.eyebrow}>عادات تجمعنا على الخير</Text>
                <Text style={s.heroTitle}>رحلتك أجمل مع صحبة</Text>
                <Text style={s.body}>
                  اختر العادة والمدة والخصوصية. ادعُ رفاقك وابدؤوا مباشرة، دون
                  بريد إلكتروني.
                </Text>
              </LinearGradient>
            </ImageBackground>
            {button("ابدأ صحبة", newCircle)}
            {button(
              "انضم برمز",
              () => {
                setCode("");
                setPage("join");
              },
              true,
            )}
            <Text style={s.section}>صحباتي · {circles.length}</Text>
            {loading && <ActivityIndicator color={p.accent} />}
            {!loading && !circles.length && (
              <Text style={s.body}>
                ابدأ صحبة تناسبك، أو أدخل رمز الدعوة للانضمام مباشرة.
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
                  {habitLabel(circle)} · {circle.memberCount}/
                  {circle.maxMembers || 10} رفاق
                </Text>
                <Text style={s.caption}>
                  {circle.startDay} — {circle.endDay}
                </Text>
                <Text style={s.link}>
                  {circleDay(circle.timeZone) > circle.endDay
                    ? "شاهد حصاد الرحلة ←"
                    : "تابع صحبتك ←"}
                </Text>
              </Pressable>
            ))}
            <View style={s.card}>
              <Text style={s.cardTitle}>البريد اختياري تمامًا</Text>
              <Text style={s.caption}>
                صحباتك تُحفظ بهوية جهازك. ربط البريد يساعدك على استعادتها إذا
                غيّرت الهاتف أو حذفت التطبيق، ولا يلزم لإنشاء صحبة أو الانضمام.
              </Text>
              {button(
                account?.linked
                  ? "حسابي المحفوظ"
                  : "احفظ حسابي لاحقًا · اختياري",
                () => setPage("account"),
                true,
              )}
            </View>
          </>
        )}
        {(page === "create" || page === "settings") && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>
                {page === "create" ? "صحبتك على طريقتك" : "خصوصية تناسب صحبتكم"}
              </Text>
              {input("اسم الصحبة", name, setName, {
                maxLength: 50,
                placeholder: "مثلًا: صحبة العائلة",
              })}
              {input("الحد الأقصى للأعضاء (٢–٣٠)", capacity, setCapacity, {
                keyboardType: "number-pad",
                maxLength: 2,
              })}
              {page === "create" && (
                <>
                  <Text style={s.label}>العادة التي ندعم بعضنا فيها</Text>
                  <View style={s.wrap}>
                    {(Object.keys(activityOptions) as Activity[]).map((a) => (
                      <Pressable
                        key={a}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: activity === a }}
                        accessibilityLabel={activityOptions[a].label}
                        disabled={busy}
                        onPress={() => {
                          setActivity(a);
                          setGoal(String(activityOptions[a].defaultGoal));
                        }}
                        style={[
                          s.chip,
                          activity === a && {
                            borderColor: p.accent,
                            backgroundColor: p.soft,
                          },
                        ]}
                      >
                        <Text style={s.body}>{activityOptions[a].label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {activity === "custom" &&
                    input("اسم العادة", habitName, setHabitName, {
                      maxLength: 50,
                      placeholder: "مثلًا: قراءة كتاب",
                    })}
                  {input(
                    `الهدف اليومي لكل عضو (${activityOptions[activity].unit})`,
                    goal,
                    setGoal,
                    { keyboardType: "number-pad", maxLength: 5 },
                  )}
                  {input(
                    "تاريخ البداية (YYYY-MM-DD)",
                    start,
                    (v) => {
                      setStart(v);
                    },
                    { autoCapitalize: "none", maxLength: 10 },
                  )}
                  {input("تاريخ انتهاء الصحبة (YYYY-MM-DD)", end, setEnd, {
                    autoCapitalize: "none",
                    maxLength: 10,
                  })}
                  <View style={s.wrap}>
                    {[7, 14, 30, 60, 90].map((days) => (
                      <Pressable
                        key={days}
                        accessibilityRole="button"
                        accessibilityLabel={`${days} يومًا`}
                        disabled={busy}
                        onPress={() => {
                          try {
                            journeyDays(start, start);
                            setEnd(addDays(start, days - 1));
                            setError("");
                          } catch (e) {
                            failure(e);
                          }
                        }}
                        style={s.chip}
                      >
                        <Text style={s.body}>{days} يومًا</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={s.caption}>
                    مدة من يوم إلى ٩٠ يومًا، والبداية خلال الأسبوع القادم.
                    يُطبّق الهدف على الأعضاء تلقائيًا عند الانضمام.
                  </Text>
                </>
              )}
              {page === "create" ? (
                <>
                  {button(
                    advanced
                      ? "إخفاء خيارات الخصوصية"
                      : "تخصيص الأسماء والتقدم والمشاركة",
                    () => setAdvanced(!advanced),
                    true,
                  )}
                  {advanced && privacyOptions()}
                </>
              ) : (
                privacyOptions()
              )}
              {page === "settings" && (
                <Text style={s.caption}>
                  العادة والهدف والتواريخ ثابتة لهذه الرحلة. يمكن تعديل الاسم
                  والعدد والخصوصية في أي وقت؛ لا يمكن خفض العدد عن الأعضاء
                  الحاليين.
                </Text>
              )}
              {button(
                page === "create"
                  ? "أنشئ الصحبة مباشرة"
                  : "احفظ إعدادات الصحبة",
                () =>
                  void run(async () => {
                    const settings = draftOptions();
                    if (page === "create") {
                      journeyDays(start, end);
                      const result = await api.createCircle({
                        name,
                        activity,
                        goal: parseGoal(goal, activity),
                        startDay: start,
                        endDay: end,
                        habitName:
                          activity === "custom" ? habitName : undefined,
                        ...settings,
                      });
                      await saveCode(result.circleId, result.code);
                      await refresh();
                      await openCircle(result.circleId);
                      setPage("invite");
                    } else if (c) {
                      await api.updateCircle(c.id, { name, ...settings });
                      await loadDetail(c.id);
                      await refresh();
                      setPage("detail");
                      setNotice(
                        "تم حفظ إعدادات الصحبة وتطبيق الخصوصية على المشاركات السابقة.",
                      );
                    }
                  }),
              )}
            </View>
          </>
        )}
        {page === "join" && (
          <View style={s.card}>
            <Text style={s.heroTitle}>رفاقك بانتظارك</Text>
            <Text style={s.body}>
              أدخل الرمز أو الصق رابط الدعوة. ستنضم مباشرة بهدف الصحبة، دون بريد
              أو كلمة مرور.
            </Text>
            {input("رمز الدعوة أو رابطها", code, setCode, {
              autoCapitalize: "characters",
              autoCorrect: false,
            })}
            {button("انضم مباشرة", () => void run(() => join(code)))}
            <Text style={s.caption}>
              بالانضمام، تُطبّق خيارات الأسماء والتقدم التي اختارها منشئ الصحبة.
              يمكنك إخفاء اسمك وحالتك من تفضيلاتك بعد الانضمام، أو المغادرة في
              أي وقت.
            </Text>
          </View>
        )}
        {page === "detail" && d && c && (
          <>
            <View style={s.card}>
              <Text style={s.eyebrow}>
                {habitLabel(c)} · {c.memberCount}/{c.maxMembers || 10} رفاق
              </Text>
              <Text style={s.heroTitle}>
                {before
                  ? "نبدأ قريبًا"
                  : ended
                    ? "حصاد صحبتكم"
                    : "معًا، خطوة كل يوم"}
              </Text>
              <Text style={s.body}>
                {before
                  ? `موعد البداية ${c.startDay}`
                  : ended
                    ? `اكتملت رحلة ${duration} يومًا. كل خطوة تستحق الشكر.`
                    : c.showGroupProgress === false
                      ? "تقدم الصحبة خاص حسب إعدادات المنشئ."
                      : `أتمّ ${d.days[today] || 0} من ${c.memberCount} رفاق هدفهم اليوم`}
              </Text>
              {c.showGroupProgress !== false && (
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
              )}
              <Text style={s.caption}>
                {c.startDay} — {c.endDay} · {c.timeZone}
              </Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>هدفي اليومي · خاص بي</Text>
              <Text style={s.big}>
                {d.member.goal}{" "}
                <Text style={s.body}>
                  {activityOptions[d.member.activity].unit}
                </Text>
              </Text>
              <Text style={s.body}>
                تقدمي اليوم:{" "}
                {d.member.activity === "listening"
                  ? Math.floor((d.mine[today]?.seconds || 0) / 60)
                  : (d.mine[today]?.value ?? d.mine[today]?.pages ?? 0)}{" "}
                {activityOptions[d.member.activity].unit}
              </Text>
              <Text style={s.note}>
                {d.mine[today]?.done
                  ? "✓ أتممت هدفي اليوم، تقبّل الله"
                  : "كل خطوة صغيرة لها أثرها"}
              </Text>
              {!ended &&
                !before &&
                (d.member.activity === "custom" ? (
                  <>
                    {input("إنجازي اليوم (الإجمالي)", amount, setAmount, {
                      keyboardType: "number-pad",
                      maxLength: 5,
                    })}
                    {button(
                      "احفظ إنجازي اليوم",
                      () =>
                        void run(async () => {
                          const value = num(amount);
                          if (
                            !amount.trim() ||
                            !Number.isInteger(value) ||
                            value < 0 ||
                            value > 10000
                          )
                            throw new Error("أدخل عددًا صحيحًا من ٠ إلى ١٠٠٠٠");
                          await api.manualCheckin(c.id, today, value);
                          await loadDetail(c.id);
                        }),
                    )}
                    <Text style={s.caption}>
                      تسجيل ذاتي لهذه العادة. الحفظ يستبدل إجمالي اليوم، فلا
                      تتكرر النقاط عند التحديث.
                    </Text>
                  </>
                ) : (
                  <>
                    {button("افتح متابع العادة", () =>
                      navigation.navigate(
                        activityOptions[d.member.activity].screen,
                      ),
                    )}
                    {button(
                      "تحديث تقدمي من السجل",
                      () =>
                        void run(async () => {
                          if (!(await api.syncCircle(c, d.member.activity)))
                            throw new Error(
                              "تأكد من تطابق تاريخ جهازك مع تاريخ الصحبة خلال الرحلة.",
                            );
                          await loadDetail(c.id);
                          setNotice("تم تحديث التقدم دون مضاعفة.");
                        }),
                      true,
                    )}
                    <Text style={s.caption}>
                      من سجلات سراج الفعلية: تأكيد القراءة، وقت الاستماع، الصلاة
                      والأذكار أو الحفظ. مجرد فتح الشاشة لا يُحتسب.
                    </Text>
                  </>
                ))}
            </View>
            <Text style={s.section}>رحلة {duration} يومًا</Text>
            <View style={[s.calendar, { flexWrap: "wrap" }]}>
              {journeyDays(c.startDay, c.endDay).map((day, i) => (
                <View
                  key={day}
                  style={[
                    s.day,
                    { flex: 0, width: "12%", minWidth: 34 },
                    day === today && { borderColor: p.accent },
                  ]}
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
                  {c.showGroupProgress !== false && (
                    <Text style={s.caption}>
                      {d.days[day] || 0}/{c.memberCount}
                    </Text>
                  )}
                </View>
              ))}
            </View>
            <Text style={s.caption}>
              العلامة لتقدمك الشخصي. يظهر إجمالي الصحبة فقط إذا سمحت إعداداتها.
            </Text>
            <View style={s.card}>
              <Text style={s.cardTitle}>رفاق الرحلة</Text>
              {d.companions.map((m) => {
                const done = m.statuses?.[today],
                  percent = m.progress?.[today];
                const showPending =
                  c.showPendingMembers !== false &&
                  m.visible &&
                  today >= c.startDay &&
                  !ended;
                return (
                  <View key={m.uid} style={s.member}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>
                        {m.name}
                        {m.uid === d.member.uid ? " · أنت" : ""}
                        {m.uid === c.ownerUid ? " · منشئ الصحبة" : ""}
                      </Text>
                      <Text style={s.caption}>
                        {done === true && c.showCompletedMembers !== false
                          ? "أتمّ هدفه اليوم"
                          : showPending && done === false
                            ? "لم يسجّل إتمام الهدف بعد"
                            : "حالة المشاركة خاصة"}
                      </Text>
                      {c.showMemberProgress === true &&
                        percent !== null &&
                        percent !== undefined && (
                          <Text style={s.note}>{percent}% من الهدف</Text>
                        )}
                    </View>
                    {c.ownerUid === d.member.uid && m.uid !== d.member.uid && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`إزالة ${m.name}`}
                        disabled={busy}
                        onPress={() =>
                          Alert.alert(
                            "إزالة رفيق",
                            "سيُحذف تقدمه المشترك وتُبطل الدعوة الحالية لمنع عودته بها.",
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
                );
              })}
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
                  {Object.values(d.mine).filter((x) => x.done).length} /{" "}
                  {duration} أيام
                </Text>
                {button(
                  "شارك فرحة رحلتك",
                  () =>
                    void run(async () => {
                      await Share.share({
                        message: `🌿 شاركت في ${Object.values(d.mine).filter((x) => x.done).length} أيام من رحلة عادات في سراج.\nرحلتك أجمل مع صحبة.`,
                      });
                    }),
                )}
                {button("ابدأ صحبة جديدة", newCircle, true)}
              </View>
            )}
            {c.ownerUid === d.member.uid && (
              <>
                {!ended && button("ادعُ رفيقًا", () => void run(showInvite))}
                {button("إعدادات الصحبة", () => settingsFor(c), true)}
              </>
            )}
            {button(
              "الخصوصية والتذكيرات",
              () => {
                setVisible(d.member.visible);
                setNameVisible(d.member.nameVisible !== false);
                setReminders(d.member.reminders);
                setSummary(d.member.summary && c.showGroupProgress !== false);
                setHour(String(d.member.reminderHour));
                setMinute(String(d.member.reminderMinute).padStart(2, "0"));
                setPage("preferences");
              },
              true,
            )}
            {!account?.linked && (
              <View style={s.card}>
                <Text style={s.caption}>
                  لا تحتاج بريدًا للمشاركة. احفظ حسابك اختياريًا لاستعادة صحبتك
                  على هاتف آخر.
                </Text>
                {button("ربط البريد · اختياري", () => setPage("account"), true)}
              </View>
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
                  "يُحذف تقدمك المشترك، ويبقى سجل عاداتك الخاص. تنتقل الإدارة لرفيق آخر إذا كنت المنشئ.",
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
        {page === "detail" && !d && <ActivityIndicator color={p.accent} />}
        {page === "invite" && d && (
          <View style={s.card}>
            <Text style={s.eyebrow}>دعوة لعادة تجمعنا</Text>
            <Text style={s.heroTitle}>{d.circle.name}</Text>
            <Text style={s.body}>
              {habitLabel(d.circle)} · {d.circle.startDay} — {d.circle.endDay}
            </Text>
            <Text style={s.caption}>
              رابط مباشر للانضمام عند تثبيت نسخة سراج الداعمة للروابط. أو أدخل
              الرمز في التطبيق، دون بريد إلكتروني.
            </Text>
            {invite ? (
              <>
                <Text selectable style={s.code}>
                  {invite}
                </Text>
                {button("شارك الدعوة", () => void run(shareInvitation))}
              </>
            ) : (
              <Text style={s.body}>
                أنشئ رمزًا جديدًا للمشاركة من هذا الجهاز.
              </Text>
            )}
            {button(
              invite ? "إبطال الرمز وإنشاء دعوة جديدة" : "إنشاء رمز دعوة جديد",
              () =>
                Alert.alert(
                  "تغيير الدعوة",
                  "ستتوقف الدعوات السابقة دون التأثير على الأعضاء الحاليين.",
                  [
                    { text: "إلغاء", style: "cancel" },
                    {
                      text: "تغيير الرمز",
                      onPress: () =>
                        void run(async () => {
                          const r = await api.rotateInvite(d.circle.id);
                          await saveCode(d.circle.id, r.code);
                        }),
                    },
                  ],
                ),
              true,
            )}
            <Text style={s.caption}>
              شارك الرمز مع من تثق بهم. يستطيع حامله الانضمام مباشرة حتى يكتمل
              العدد.
            </Text>
          </View>
        )}
        {page === "preferences" && d && (
          <View style={s.card}>
            <Text style={s.cardTitle}>خصوصيتي أولًا</Text>
            {toggle(
              "السماح بإظهار اسمي إذا سمحت الصحبة",
              nameVisible,
              setNameVisible,
            )}
            {toggle(
              "السماح بمشاركة حالتي إذا سمحت الصحبة",
              visible,
              setVisible,
            )}
            <Text style={s.caption}>
              اختياراتك لا تتجاوز خصوصية الصحبة: إذا أخفى المنشئ الأسماء أو
              التقدم فسيبقيان مخفيين. الإيقاف يخفي حالتك السابقة أيضًا.
            </Text>
            {toggle("تذكير شخصي بالعادة", reminders, setReminders)}
            {d.circle.showGroupProgress !== false &&
              toggle("ملخّص يومي للصحبة", summary, setSummary)}
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
              بتوقيت {d.circle.timeZone}، خلال ربع ساعة بعد الموعد. الإشعارات
              تحتاج نسخة هاتف مستقلة؛ تجربة بقية الميزات متاحة في Expo Go.
            </Text>
            {button(
              "احفظ تفضيلاتي",
              () =>
                void run(async () => {
                  const h = num(hour),
                    m = num(minute);
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
                    nameVisible,
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
        {page === "account" && (
          <View style={s.card}>
            <Text style={s.cardTitle}>حسابك محفوظ معك · اختياري</Text>
            <Text style={s.body}>
              الإنشاء والانضمام لا يحتاجان بريدًا. ربطه يحافظ على هوية جهازك
              ويساعدك على الاسترجاع عند تغيير الهاتف أو إعادة التثبيت.
            </Text>
            {account?.linked ? (
              <>
                <Text style={s.note}>{account.email}</Text>
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
                })}
                {input("كلمة المرور", password, setPassword, {
                  secureTextEntry: true,
                  autoCapitalize: "none",
                })}
                {button(
                  existing ? "تسجيل الدخول" : "اربط بريدي اختياريًا",
                  () =>
                    void run(async () => {
                      const a = existing
                        ? await api.signInAccount(email, password)
                        : await api.linkAccount(email, password);
                      setAccount(a);
                      setPassword("");
                      setSelected("");
                      setDetail(null);
                      await refresh();
                      setPage("list");
                      setNotice("تم حفظ حسابك. يمكنك متابعة صحباتك.");
                    }),
                )}
                {button(
                  existing ? "ربط بريد جديد" : "لدي حساب محفوظ",
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
                          "إذا كان البريد مسجلًا، ستصلك تعليمات الاستعادة.",
                        );
                      }),
                    true,
                  )}
              </>
            )}
            {button("لاحقًا، تابع دون بريد", back, true)}
          </View>
        )}
        {page === "report" && d && (
          <View style={s.card}>
            <Text style={s.cardTitle}>صحبة آمنة للجميع</Text>
            {input("سبب الإبلاغ", reason, setReason, {
              multiline: true,
              maxLength: 500,
            })}
            {button(
              "إرسال البلاغ",
              () =>
                void run(async () => {
                  await api.reportCircle(d.circle.id, reason);
                  setPage("detail");
                  setNotice("تم حفظ البلاغ لمراجعة إدارة سراج.");
                }),
            )}
          </View>
        )}
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
