import test from "node:test";
import assert from "node:assert/strict";
import { identitySession } from "../src/profile/identitySession";
test("profile and circles share one anonymous sign-in and preserve a restored identity", async () => {
  let user: { uid: string } | null = null,
    signIns = 0;
  const ensure = identitySession(
    async () => {},
    () => user,
    async () => {
      signIns++;
      await Promise.resolve();
      user = { uid: "same-user" };
      return user;
    },
  );
  const results = await Promise.all([ensure(), ensure(), ensure()]);
  assert.equal(signIns, 1);
  assert.equal(new Set(results.map((u) => u.uid)).size, 1);
  await ensure();
  assert.equal(signIns, 1);
  let calls = 0;
  const restored = identitySession(
    async () => {},
    () => ({ uid: "restored" }),
    async () => {
      calls++;
      return { uid: "new" };
    },
  );
  assert.equal((await restored()).uid, "restored");
  assert.equal(calls, 0);
});
test("failed identity creation can be retried without caching a rejected sign-in", async () => {
  let calls = 0;
  const ensure = identitySession(
    async () => {},
    () => null,
    async () => {
      if (++calls === 1) throw Error("offline");
      return { uid: "retry" };
    },
  );
  await assert.rejects(ensure());
  assert.equal((await ensure()).uid, "retry");
  assert.equal(calls, 2);
});
