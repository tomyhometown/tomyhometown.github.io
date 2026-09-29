import assert from "node:assert/strict";
import test from "node:test";

import { normalizeArticlePath, validToken } from "../cloudflare/reactions/worker.mjs";

test("accepts stable article paths", () => {
  assert.equal(normalizeArticlePath("/thoughts/2026-09-20-questionnaire/"), "/thoughts/2026-09-20-questionnaire/");
  assert.equal(normalizeArticlePath("https://tomyhometown.github.io/reading/a-book/"), "/reading/a-book/");
});

test("rejects category, legacy, and unrelated paths", () => {
  assert.equal(normalizeArticlePath("/thoughts/"), null);
  assert.equal(normalizeArticlePath("/post/hello-gridea/"), null);
  assert.equal(normalizeArticlePath("/assets/site.css"), null);
});

test("validates anonymous per-article tokens", () => {
  assert.equal(validToken("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(validToken("short"), false);
  assert.equal(validToken("550e8400-e29b-41d4-a716-44665544000!"), false);
});
