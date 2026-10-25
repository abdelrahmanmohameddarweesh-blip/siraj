export type Gender = 'male' | 'female';
export type PersonalProfile = { name: string; gender: Gender; createdAt: string; updatedAt: string; cloudUid?: string; syncedAt?: string };
export function profileError(name: string, gender: string): string | null {
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 50 || /[\u0000-\u001f<>]/.test(clean)) return 'اكتب اسمًا من حرفين إلى ٥٠ حرفًا.';
  if (gender !== 'male' && gender !== 'female') return 'اختر الجنس لإكمال ملفك.';
  return null;
}
