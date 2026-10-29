import test from "node:test";
import assert from "node:assert/strict";
import { runDeletion, DeleteStage } from "../src/account/deletionFlow";
test("account deletion removes cloud records before identity and only clears device data after both succeed", async () => {
  const calls: string[] = [];
  await runDeletion({
    cloud: async () => {
      calls.push("cloud");
    },
    identity: async () => {
      calls.push("identity");
    },
    device: async () => {
      calls.push("device");
    },
    checkpoint: async (stage) => {
      calls.push("checkpoint:" + stage);
    },
  });
  assert.deepEqual(calls, [
    "cloud",
    "checkpoint:identity",
    "identity",
    "checkpoint:device",
    "device",
  ]);
});
test("cloud deletion failure does not delete identity, clear local data or report completion", async () => {
  let later = false;
  await assert.rejects(
    runDeletion({
      cloud: async () => {
        throw Error("offline");
      },
      identity: async () => {
        later = true;
      },
      device: async () => {
        later = true;
      },
      checkpoint: async () => {
        later = true;
      },
    }),
    /offline/,
  );
  assert.equal(later, false);
});
test("identity failure preserves local data and a resumable checkpoint", async () => {
  let stage: DeleteStage = "cloud",
    cleared = false;
  await assert.rejects(
    runDeletion({
      cloud: async () => {},
      identity: async () => {
        throw Error("reauth");
      },
      device: async () => {
        cleared = true;
      },
      checkpoint: async (value) => {
        stage = value;
      },
    }),
    /reauth/,
  );
  assert.equal(stage, "identity");
  assert.equal(cleared, false);
});
test("device-only resume does not repeat cloud operations or attempt a new anonymous identity", async () => {
  const calls: string[] = [];
  await runDeletion(
    {
      cloud: async () => {
        calls.push("cloud");
      },
      identity: async () => {
        calls.push("identity");
      },
      device: async () => {
        calls.push("device");
      },
      checkpoint: async (stage) => {
        calls.push(stage);
      },
    },
    "device",
  );
  assert.deepEqual(calls, ["device"]);
});
