export function friendlyError(error: any) {
  const code = error?.code || "";
  if (
    code.includes("api-key") ||
    /API[_ -]?KEY[_ -]?(NOT[_ -]?VALID|INVALID)|api-key-not-valid/i.test(
      error?.message || "",
    )
  )
    return "تعذّر الاتصال لأن إعدادات خدمة سراج غير صالحة. يلزم تحديث مفتاح Firebase من إعدادات المشروع. لم يتم إنشاء الصحبة؛ لا تحتاج إلى بريد أو كلمة مرور.";
  if (code.includes("app-not-authorized"))
    return "خدمة سراج لا تسمح لهذه النسخة بالاتصال. يلزم مراجعة قيود مفتاح المشروع؛ لم يتم إنشاء الصحبة.";
  if (code.includes("network-request-failed"))
    return "تعذّر الاتصال بالإنترنت. تحقق من الاتصال ثم حاول مجددًا.";
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
    return "طريقة الدخول هذه غير مفعّلة في المشروع. المشاركة تحتاج الدخول المجهول فقط؛ البريد مطلوب فقط لربطه اختياريًا.";
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
