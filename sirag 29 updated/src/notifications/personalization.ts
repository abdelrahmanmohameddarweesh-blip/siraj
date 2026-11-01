/** Plain-text display name only. Never used as an analytics property or ad field. */
export function notificationName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(
      /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069<>]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
}
export function personalizeBody(
  body: string,
  name?: unknown,
  enabled = true,
): string {
  const clean = enabled ? notificationName(name) : "";
  return clean ? `${clean}، ${body}` : body;
}
