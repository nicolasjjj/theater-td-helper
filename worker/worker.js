// 劇場幫幫｜Cloudflare Worker
// /api/v1/*  → 轉送到 Notion 官方 API（瀏覽器不能直接呼叫 Notion，所以需要這個轉接站）
// /api/google/* → Google 登入換取權杖（用戶端密碼只存在 Cloudflare 的 Secret，不會出現在網頁裡）
// 其他路徑   → 網頁檔案（dist/）
// 這裡不儲存任何資料，也不記錄金鑰。
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/google/")) return google(url, request, env);
    if (url.pathname.startsWith("/api/v1/")) {
      const target = "https://api.notion.com" + url.pathname.slice(4) + url.search;
      const headers = new Headers();
      for (const h of ["authorization", "notion-version", "content-type"]) {
        const v = request.headers.get(h); if (v) headers.set(h, v);
      }
      const init = { method: request.method, headers };
      if (!["GET", "HEAD"].includes(request.method)) init.body = await request.text();
      const res = await fetch(target, init);
      return new Response(res.body, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") || "application/json", "cache-control": "no-store" },
      });
    }
    return env.ASSETS.fetch(request);
  },
};

const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
async function google(url, request, env) {
  const id = env.GOOGLE_CLIENT_ID, secret = env.GOOGLE_CLIENT_SECRET;
  if (url.pathname === "/api/google/config") return J({ clientId: id || "", ready: !!(id && secret) });
  if (request.method !== "POST") return J({ error: "method" }, 405);
  if (!id || !secret) return J({ error: "not_configured" }, 503);
  const body = await request.json().catch(() => ({}));
  const form = new URLSearchParams({ client_id: id, client_secret: secret });
  if (url.pathname === "/api/google/token") {
    const ru = String(body.redirect_uri || "");
    if (new URL(ru).origin !== url.origin) return J({ error: "bad_redirect" }, 400);
    form.set("grant_type", "authorization_code"); form.set("code", String(body.code || "")); form.set("redirect_uri", ru);
  } else if (url.pathname === "/api/google/refresh") {
    form.set("grant_type", "refresh_token"); form.set("refresh_token", String(body.refresh_token || ""));
  } else return J({ error: "not_found" }, 404);
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return J({ error: j.error || "token_failed", detail: j.error_description || "" }, r.status === 400 ? 401 : 502);
  let email = "";
  if (j.id_token) { try { email = JSON.parse(atob(j.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).email || ""; } catch (e) {} }
  return J({ access_token: j.access_token, expires_in: j.expires_in, refresh_token: j.refresh_token || "", email, scope: j.scope || "" });
}
