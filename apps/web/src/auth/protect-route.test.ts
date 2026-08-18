import assert from "node:assert/strict";
import { test } from "node:test";
import { protectMatchedRoute } from "./protect-route.ts";

test("does not invoke Clerk protection for a public route", async () => {
  let calls = 0;

  await protectMatchedRoute(false, async () => {
    calls += 1;
  });

  assert.equal(calls, 0);
});

test("awaits and propagates Clerk redirect control flow", async () => {
  const redirect = new Error("NEXT_REDIRECT");

  await assert.rejects(
    protectMatchedRoute(true, async () => {
      await Promise.resolve();
      throw redirect;
    }),
    redirect,
  );
});
