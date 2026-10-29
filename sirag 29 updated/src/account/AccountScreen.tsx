import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { homePalettes } from "../design/homeTheme";
import { profileAuth } from "../profile/cloudAuth";
import { waitForAuth } from "../profile/cloudIdentity";
import {
  deleteSirajAccount,
  pendingDeletion,
  PendingDelete,
} from "./deleteAccount";
import release from "../../release.config.json";
export default function AccountScreen({ navigation }: any) {
  const { theme } = useTheme(),
    p = homePalettes[theme],
    insets = useSafeAreaInsets();
  const [pending, setPending] = useState<PendingDelete | null>(null),
    [uid, setUid] = useState(""),
    [email, setEmail] = useState<string | null>(null),
    [anonymous, setAnonymous] = useState(true),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      await waitForAuth();
      const marker = await pendingDeletion(),
        user = profileAuth.currentUser;
      if (active) {
        setPending(marker);
        setUid(marker?.uid || user?.uid || "");
        setEmail(marker?.email || user?.email || null);
        setAnonymous(marker?.anonymous ?? user?.isAnonymous ?? true);
      }
    })().catch(() => {
      if (active)
        setError("تعذّر قراءة حالة الحساب. تواصل مع الدعم قبل المتابعة.");
    });
    return () => {
      active = false;
    };
  }, []);
  const text = {
    fontFamily: "Plex",
    fontSize: 14,
    lineHeight: 26,
    color: p.secondary,
    textAlign: "right" as const,
  };
  function link(path: string) {
    void Linking.openURL(release.website + path).catch(() =>
      setError("تعذّر فتح الصفحة. يمكنك مراسلة الدعم مباشرة."),
    );
  }
  async function erase() {
    if (busy || !confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteSirajAccount(password);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setError(
        err.code?.includes("wrong-password") ||
          err.code?.includes("invalid-credential")
          ? "تحقق من كلمة المرور. لم يكتمل حذف الحساب."
          : err.code?.includes("requires-recent-login")
            ? "يلزم تسجيل الدخول مجددًا لتأكيد الحذف. يمكنك طلب المساعدة عبر البريد أدناه."
            : err.message ||
              "تعذّر إكمال الحذف. حاول مجددًا أو تواصل مع الدعم.",
      );
      setPending(await pendingDeletion());
    } finally {
      setBusy(false);
    }
  }
  function confirmDeletion() {
    if (Platform.OS === "web") {
      if (
        globalThis.confirm(
          "سيُحذف الحساب وبيانات هذا الجهاز. هل تريد المتابعة؟",
        )
      )
        void erase();
    } else
      Alert.alert(
        "تأكيد حذف الحساب",
        "ستُحذف بيانات حسابك وبيانات هذا الجهاز. هل تريد المتابعة؟",
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "حذف نهائي",
            style: "destructive",
            onPress: () => void erase(),
          },
        ],
      );
  }
  function button(
    label: string,
    action: () => void,
    danger = false,
    disabled = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={busy || disabled}
        onPress={action}
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: danger ? "#8F3E35" : p.raised,
          opacity: busy || disabled ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            fontFamily: "PlexBold",
            color: danger ? "#FFF8ED" : p.text,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }
  return (
    <View
      style={{ flex: 1, backgroundColor: p.background, paddingTop: insets.top }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 22,
          paddingBottom: insets.bottom + 40,
          gap: 18,
          maxWidth: 680,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {!pending && button("رجوع", () => navigation.goBack())}
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: "PlexBold",
            fontSize: 25,
            color: p.text,
            textAlign: "right",
          }}
        >
          الحساب والخصوصية
        </Text>
        <Text style={text}>
          تُحفظ سجلات العبادات والعادات على جهازك. تُزامَن بيانات ملفك ومشاركات
          الصحبة مع حسابك في سراج. ربط البريد اختياري.
        </Text>
        {!!uid && (
          <View
            style={{
              backgroundColor: p.surface,
              padding: 18,
              borderRadius: 18,
              gap: 8,
            }}
          >
            <Text style={text}>رقم الحساب للمساعدة</Text>
            <Text
              selectable
              accessibilityLabel="رقم الحساب"
              style={[text, { fontSize: 12 }]}
            >
              {uid}
            </Text>
            {email && <Text style={text}>{email}</Text>}
          </View>
        )}
        {button("سياسة الخصوصية", () => link("/privacy"))}
        {button("طلب حذف الحساب من الويب", () => link("/delete-account"))}
        {button(
          "التواصل مع الدعم",
          () =>
            void Linking.openURL(
              `mailto:${release.supportEmail}?subject=${encodeURIComponent("Siraj account help")}&body=${encodeURIComponent("Account ID: " + uid + "\nPlease describe your request:")}`,
            ),
        )}
        <View
          style={{
            backgroundColor: p.surface,
            borderWidth: 1,
            borderColor: p.border,
            borderRadius: 24,
            padding: 20,
            gap: 14,
          }}
        >
          <Text
            style={{
              fontFamily: "PlexBold",
              fontSize: 20,
              color: p.text,
              textAlign: "right",
            }}
          >
            {pending ? "إكمال حذف الحساب" : "حذف حسابي وبياناتي"}
          </Text>
          <Text style={text}>
            سيُحذف ملفك السحابي، وعضويتك وتقدمك المشترك في الصحبات، وحساب تسجيل
            الدخول. تُمسح سجلات هذا الجهاز وإعداداته وتذكيراته. تنتقل إدارة
            صحبتك لرفيق آخر عند الحاجة. لا يمكن التراجع عن الحذف.
          </Text>
          <Text style={text}>
            الحذف يتطلب اتصالًا بالإنترنت. لا تُحذف سجلات الأجهزة الأخرى
            تلقائيًا؛ يمكنك مسح بيانات التطبيق منها. بيانات الإعلانات التي تحتفظ
            بها Google تُدار وفق سياستها.
          </Text>
          {pending && (
            <Text accessibilityRole="alert" style={text}>
              حذف الحساب لم يكتمل بعد. المزامنة موقوفة حتى إكماله. إذا تعذّر
              المتابعة، أرسل رقم حسابك إلى الدعم دون إرسال كلمة المرور.
            </Text>
          )}
          {!anonymous && pending?.stage !== "device" && (
            <>
              <Text style={text}>كلمة مرور الحساب لتأكيد هويتك</Text>
              <TextInput
                accessibilityLabel="كلمة المرور لتأكيد الحذف"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                style={{
                  fontFamily: "Plex",
                  color: p.text,
                  borderWidth: 1,
                  borderColor: p.border,
                  borderRadius: 14,
                  padding: 14,
                }}
              />
            </>
          )}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="أفهم أن حذف الحساب لا يمكن التراجع عنه"
            accessibilityState={{ checked: confirmed }}
            disabled={busy}
            onPress={() => setConfirmed(!confirmed)}
          >
            <Text style={text}>
              {confirmed ? "☑" : "☐"} أفهم أن حذف الحساب لا يمكن التراجع عنه
            </Text>
          </Pressable>
          {!!error && (
            <Text accessibilityRole="alert" style={[text, { color: p.accent }]}>
              {error}
            </Text>
          )}
          {busy && <ActivityIndicator color={p.accent} />}{" "}
          {button(
            busy
              ? "جارٍ إكمال الحذف…"
              : pending
                ? "أكمل حذف الحساب والبيانات"
                : "حذف الحساب والبيانات",
            confirmDeletion,
            true,
            !confirmed || (!uid && !pending),
          )}
        </View>
        <Text style={[text, { fontSize: 12 }]}>
          {release.appName} · {release.supportEmail}
        </Text>
      </ScrollView>
    </View>
  );
}
