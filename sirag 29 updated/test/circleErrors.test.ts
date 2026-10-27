import test from "node:test";
import assert from "node:assert/strict";
import { friendlyError } from "../src/circles/errors";
test("invalid Firebase key is an actionable setup error, never an email request or raw exception", () => {
  for (const error of [
    { code: "auth/api-key-not-valid.-please-pass-a-valid-api-key." },
    { code: "auth/invalid-api-key" },
    { message: "API_KEY_INVALID" },
  ]) {
    const message = friendlyError(error);
    assert.match(message, /إعدادات|مفتاح/);
    assert.match(message, /لم يتم إنشاء/);
    assert.doesNotMatch(message, /Error|auth\//);
  }
});
test("network, disabled provider and invalid invitation errors stay distinct", () => {
  assert.match(
    friendlyError({ code: "auth/network-request-failed" }),
    /الإنترنت/,
  );
  assert.match(
    friendlyError({ code: "auth/operation-not-allowed" }),
    /المجهول فقط/,
  );
  assert.equal(
    friendlyError({ code: "functions/not-found", message: "الدعوة غير صالحة" }),
    "الدعوة غير صالحة",
  );
  assert.match(friendlyError({ code: "auth/app-not-authorized" }), /قيود/);
});
