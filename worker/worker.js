// 劇場幫幫｜Cloudflare Worker
// /api/v1/*  → 轉送到 Notion 官方 API（瀏覽器不能直接呼叫 Notion，所以需要這個轉接站）
// 其他路徑   → 網頁檔案（dist/）
// 這裡不儲存任何資料，也不記錄金鑰。
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
