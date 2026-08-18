// Run with: npm run test --workspace @repo/web (node --test, native TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateInstagramOAuthUrl } from "./env-validation.ts";

const GOOD_URL =
  "https://www.instagram.com/oauth/authorize?client_id=123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback%2Finstagram&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments";

test("accepts a valid Instagram Business Login authorize URL", () => {
  assert.equal(validateInstagramOAuthUrl(GOOD_URL), null);
});

test("accepts an unset optional URL", () => {
  assert.equal(validateInstagramOAuthUrl(undefined), null);
  assert.equal(validateInstagramOAuthUrl(""), null);
});

test("rejects the facebook.com dialog (the 'Invalid app ID' regression)", () => {
  const problem = validateInstagramOAuthUrl(
    "https://www.facebook.com/v21.0/dialog/oauth?client_id=123&redirect_uri=http://localhost:3000/callback/instagram&response_type=code",
  );
  assert.match(problem ?? "", /www\.instagram\.com\/oauth\/authorize/);
});

test("rejects a URL missing client_id", () => {
  const problem = validateInstagramOAuthUrl(
    "https://www.instagram.com/oauth/authorize?response_type=code&scope=instagram_business_basic",
  );
  assert.match(problem ?? "", /client_id/);
});

test("rejects a URL missing scope", () => {
  const problem = validateInstagramOAuthUrl(
    "https://www.instagram.com/oauth/authorize?client_id=123&response_type=code",
  );
  assert.match(problem ?? "", /scope/);
});

test("rejects missing required Instagram scopes", () => {
  const problem = validateInstagramOAuthUrl(
    "https://www.instagram.com/oauth/authorize?client_id=123&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback%2Finstagram&response_type=code&scope=instagram_business_basic",
  );
  assert.match(problem ?? "", /missing required scopes/);
});

test("rejects permissions the product does not use", () => {
  const problem = validateInstagramOAuthUrl(
    `${GOOD_URL},instagram_business_content_publish`,
  );
  assert.match(problem ?? "", /does not use/);
});

test("rejects a non-URL value", () => {
  assert.match(validateInstagramOAuthUrl("not a url") ?? "", /not a valid URL/);
});
