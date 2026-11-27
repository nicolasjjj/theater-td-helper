// 劇場幫幫｜Google 登入與 Google 試算表、雲端硬碟
// 用「授權碼」流程：網頁導到 Google 登入 → 回到網頁 → 經過 /api/google 換成權杖。
// 權限只有 drive.file：只能看到這個 app 自己建立的檔案，碰不到使用者其他的雲端資料。
(() => {
  const T = window.__tdh;
  const SCOPE = "openid email https://www.googleapis.com/auth/drive.file";
  const AT = "tdh.gat";   // 存短效權杖（約一小時）
  let conf = null, access = (() => { try { return JSON.parse(localStorage.getItem(AT) || "null"); } catch (e) { return null; } })();
  const redirect = () => location.origin + "/";
  const err = (code, message) => Object.assign(new Error(message), { code });

  async function config() {
    if (!conf) conf = fetch("/api/google/config").then(r => r.json()).catch(() => ({ clientId: "", ready: false }));
    return conf;
  }
  function saveAccess(tok, sec) {
    access = { t: tok, exp: Date.now() + (sec - 120) * 1000 };
    try { localStorage.setItem(AT, JSON.stringify(access)); } catch (e) {}
  }

  const G = {
    get email() { return T.cfg.gEmail || ""; },
    get signedIn() { return !!T.cfg.gRefresh; },
    async ready() { return (await config()).ready; },
    // 導到 Google 登入；回來後頁面會重新載入。after：回來後要自動做的事（例如 "sheet"）
    async login(after) {
      const c = await config();
      if (!c.ready) throw err("not_configured", "Google 登入還沒設定好");
      const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem("tdh.gstate", JSON.stringify({ state, after: after || "", hash: location.hash })); } catch (e) {}
      const q = new URLSearchParams({ client_id: c.clientId, redirect_uri: redirect(), response_type: "code", scope: SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state });
      if (T.cfg.gEmail) q.set("login_hint", T.cfg.gEmail);
      location.href = "https://accounts.google.com/o/oauth2/v2/auth?" + q;
      await new Promise(() => {});
    },
    logout() {
      T.setCfg({ gRefresh: "", gEmail: "", gRoot: "", gSheetDir: "" });
      access = null; try { localStorage.removeItem(AT); } catch (e) {}
    },
    async token() {
      if (access && access.exp > Date.now()) return access.t;
      if (!T.cfg.gRefresh) throw err("google_login", "請先登入 Google");
      const r = await fetch("/api/google/refresh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: T.cfg.gRefresh }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { if (r.status === 401) G.logout(); throw err(r.status === 401 ? "google_login" : "tool_error", r.status === 401 ? "Google 登入過期了，請重新登入" : "Google 暫時沒有回應"); }
      saveAccess(j.access_token, j.expires_in || 3600);
      return access.t;
    },
    // 呼叫 Google API（自動帶權杖、過期重試一次）
    async api(url, opt = {}) {
      for (let i = 0; i < 2; i++) {
        const tok = await G.token();
        const res = await fetch(url, { method: opt.method || "GET", headers: Object.assign({ Authorization: "Bearer " + tok }, opt.body !== undefined ? { "Content-Type": "application/json" } : {}, opt.headers || {}), body: opt.body !== undefined ? (typeof opt.body === "string" ? opt.body : JSON.stringify(opt.body)) : undefined });
        if (res.status === 401 && i === 0) { access = null; continue; }
        if (res.status === 204) return {};
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw err(res.status === 404 ? "not_found" : res.status === 403 ? "forbidden" : "tool_error", (j.error && j.error.message) || ("Google " + res.status));
        return j;
      }
    },
    // 雲端硬碟：找或建立資料夾（drive.file 只看得到這個 app 建的資料夾）
    async folder(name, parent) {
      const q = `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false` + (parent ? ` and '${parent}' in parents` : "");
      const r = await G.api("https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({ q, fields: "files(id,name)", pageSize: "5" }));
      if (r.files && r.files[0]) return r.files[0].id;
      const made = await G.api("https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", body: Object.assign({ name, mimeType: "application/vnd.google-apps.folder" }, parent ? { parents: [parent] } : {}) });
      return made.id;
    },
    async fileOk(id) {
      if (!id) return false;
      try { const m = await G.api(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,trashed`); return !!m.id && !m.trashed; } catch (e) { return false; }
    },
    async rootFolder() {
      if (await G.fileOk(T.cfg.gRoot)) return T.cfg.gRoot;
      const id = await G.folder("劇場幫幫"); T.setCfg({ gRoot: id }); return id;
    },
    async sheetFolder() {
      if (await G.fileOk(T.cfg.gSheetDir)) return T.cfg.gSheetDir;
      const id = await G.folder("時段表", await G.rootFolder()); T.setCfg({ gSheetDir: id }); return id;
    },
  };
  T.google = G;

  // 從 Google 登入頁回來：用授權碼換權杖
  T.googleReturn = (async () => {
    const u = new URL(location.href), code = u.searchParams.get("code"), state = u.searchParams.get("state"), e = u.searchParams.get("error");
    if (!code && !e) return null;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem("tdh.gstate") || "{}"); localStorage.removeItem("tdh.gstate"); } catch (x) {}
    history.replaceState(null, "", "/" + (saved.hash || ""));
    if (e) return { error: e === "access_denied" ? "你取消了 Google 登入。" : "Google 登入失敗：" + e };
    if (!state || state !== saved.state) return { error: "Google 登入失敗，請再試一次。" };
    const r = await fetch("/api/google/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, redirect_uri: redirect() }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: "Google 登入失敗：" + (j.detail || j.error || r.status) };
    saveAccess(j.access_token, j.expires_in || 3600);
    T.setCfg(Object.assign({ gEmail: j.email || T.cfg.gEmail || "" }, j.refresh_token ? { gRefresh: j.refresh_token } : {}));
    return { ok: true, after: saved.after || "" };
  })();
})();
