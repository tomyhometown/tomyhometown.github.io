const ALLOWED_ORIGIN = "https://tomyhometown.github.io";
const ARTICLE_PATH = /^\/(thoughts|life|works|reading|movies|games|novels)\/[a-z0-9][a-z0-9-]*\/$/;
const TOKEN = /^[0-9a-f-]{20,64}$/i;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(origin) });
}

export function normalizeArticlePath(value) {
  if (typeof value !== "string") return null;
  let path;
  try {
    path = new URL(value, ALLOWED_ORIGIN).pathname;
  } catch {
    return null;
  }
  return ARTICLE_PATH.test(path) ? path : null;
}

export function validToken(value) {
  return typeof value === "string" && TOKEN.test(value);
}

async function voterHash(path, token) {
  const bytes = new TextEncoder().encode(`${path}\0${token}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function countFor(db, path) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM reactions WHERE path = ?").bind(path).first();
  return Number(row?.count || 0);
}

async function handleGet(request, env, origin) {
  const path = normalizeArticlePath(new URL(request.url).searchParams.get("path"));
  if (!path) return json({ error: "invalid_path" }, 400, origin);
  return json({ path, count: await countFor(env.DB, path) }, 200, origin);
}

async function handlePost(request, env, origin) {
  if (origin !== ALLOWED_ORIGIN) return json({ error: "origin_not_allowed" }, 403, origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, origin);
  }

  const path = normalizeArticlePath(body.path);
  if (!path || !validToken(body.token) || !["add", "remove"].includes(body.action)) {
    return json({ error: "invalid_request" }, 400, origin);
  }

  const hash = await voterHash(path, body.token);
  if (body.action === "add") {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO reactions (path, voter_hash) VALUES (?, ?)",
    ).bind(path, hash).run();
  } else {
    await env.DB.prepare(
      "DELETE FROM reactions WHERE path = ? AND voter_hash = ?",
    ).bind(path, hash).run();
  }

  return json({ path, count: await countFor(env.DB, path), reacted: body.action === "add" }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) return json({ error: "origin_not_allowed" }, 403, origin);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method === "GET") return handleGet(request, env, origin);
    if (request.method === "POST") return handlePost(request, env, origin);
    return json({ error: "method_not_allowed" }, 405, origin);
  },
};
