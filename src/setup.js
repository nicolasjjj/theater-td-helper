// 劇場幫幫｜第一次設定與設定畫面
// 兩種存資料的方式：Google（資料存在自己的 Google 雲端，推薦給沒用過 Notion 的人）或 Notion（已經在用 Notion 的人）。
(() => {
  const T = window.__tdh;
  window.TDN = () => (T.cfg.tdName || "").trim() || "我";
  window.ROLE = () => (T.cfg.role || "").trim() || "負責人";
  window.TEAM = () => (T.cfg.team || "").trim() || "舞台組";
  const ios = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  const notionReady = () => !!T.cfg.token && !!T.cfg.db && ["cases", "crew", "troupe", "venue"].every(k => T.cfg.db[k]);
  const googleReady = () => !!T.cfg.gRefresh && !!T.cfg.gData;
  const dataReady = () => (T.cfg.mode === "google" ? googleReady() : T.cfg.mode === "notion" ? notionReady() : false);
  const need = () => !dataReady() || !T.cfg.named;
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  const css = `
  .tdh-ov{position:fixed;inset:0;z-index:9999;background:#f4f1ea;overflow:auto;-webkit-overflow-scrolling:touch;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif;color:#1d1b18}
  .tdh-in{max-width:520px;margin:0 auto;padding:calc(24px + env(safe-area-inset-top)) 18px 60px}
  .tdh-in h1{font-size:26px;margin:0 0 4px}.tdh-in .sub{color:#6e685f;font-size:14px;margin-bottom:20px;line-height:1.6}
  .tdh-st{background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .tdh-st summary::marker{color:#2f5d50}.tdh-st h2{font-size:17px;margin:0 0 8px;display:flex;gap:8px;align-items:center}
  .tdh-st h2 b{display:inline-flex;width:24px;height:24px;border-radius:12px;background:#2f5d50;color:#fff;font-size:13px;align-items:center;justify-content:center}
  .tdh-st ol{margin:6px 0 0;padding-left:20px;font-size:14px;line-height:1.7;color:#3a362f}
  .tdh-st p{font-size:14px;color:#6e685f;margin:0;line-height:1.6}
  .tdh-st a.btn,.tdh-st button{display:inline-block;border:0;border-radius:999px;padding:11px 18px;font-size:15px;font-weight:600;background:#2f5d50;color:#fff;text-decoration:none;margin-top:10px;cursor:pointer}
  .tdh-st button.ghost{background:#ece8df;color:#1d1b18}
  .tdh-st button.big{display:block;width:100%;text-align:center;padding:14px;font-size:17px;border-radius:14px}
  .tdh-st input{width:100%;box-sizing:border-box;border:1.5px solid #d9d4cb;border-radius:12px;padding:12px;font-size:16px;margin-top:8px;background:#fbfaf7}
  .tdh-res{margin-top:10px;font-size:14px;line-height:1.8}.tdh-res .ok,.tdh-st .ok{color:#2f7a4f}.tdh-res .no,.tdh-st .no{color:#b0741f}
  .tdh-err{color:#b3261e;font-size:14px;margin-top:8px}
  .tdh-tip{background:#fff4dc;border:1.5px solid #e9c77a;border-radius:16px;padding:14px 16px;margin-bottom:14px;font-size:14px;line-height:1.7;color:#5a4518}
  .tdh-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.tdh-st .tdh-chips button{margin:0;padding:6px 12px;font-size:14px;font-weight:500}
  .tdh-rec{display:inline-block;font-size:12px;background:#2f5d50;color:#fff;border-radius:6px;padding:1px 7px;margin-left:6px;vertical-align:2px}
  .tdh-gear{flex:0 0 40px;border:0;background:transparent;font-size:17px;color:#6e685f;cursor:pointer;border-radius:9px}
  .tdh-foot{font-size:12px;color:#8a847a;line-height:1.6;margin-top:8px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 卡片：選擇資料放哪裡 ----------
  const chooseCard = () => `<div class="tdh-st" id="tdhChoose"><h2>你的資料要放在哪裡？</h2>
      <button class="big" id="tdhPickG">用 Google 帳號開始<span class="tdh-rec">推薦</span></button>
      <p style="margin-top:8px">資料存在你自己的 Google 雲端硬碟，不用另外學 Notion。登入一次就好。</p>
      <button class="big ghost" id="tdhPickN" style="margin-top:14px">我已經在用 Notion</button>
      <p style="margin-top:8px">用你 Notion 裡的「劇場の案子」等資料庫，需要貼一次 Notion API 權杖。</p></div>`;
  const googleCard = (force) => `<div class="tdh-st" id="tdhG"><h2>${force ? "" : "<b>1</b>"}Google 帳號</h2><div id="tdhGBody"><p>讀取中…</p></div></div>`;
  const notionCard = (c, seen, force) => `<div class="tdh-st" id="tdhN"><h2>${force ? "" : "<b>1</b>"}Notion API 權杖</h2>
        <p>還沒有權杖？看下面的「怎麼取得權杖」。</p>
        <input id="tdhTok" type="password" autocomplete="off" placeholder="ntn_ 開頭的一串字" value="${esc(c.token || "")}">
        <button id="tdhGo">連線並尋找資料庫</button>
        <div class="tdh-res" id="tdhRes"></div><div class="tdh-err" id="tdhErr"></div>
        <details style="margin-top:12px" ${seen || force ? "" : "open"}><summary style="font-weight:700;font-size:15px;cursor:pointer">怎麼取得權杖（約 5 分鐘）</summary>
        <h2 style="margin-top:12px"><b>A</b>建立 Notion 連接</h2><ol>
        <li>按下面按鈕打開 Notion 的「開發人員連接」頁面（手機請用瀏覽器開）</li>
        <li>按「＋ 新連接」：名稱填「劇場幫幫」，驗證方式選「API 權杖」，按「建立連接」</li>
        <li>點進剛建立的連接，找到「API 權杖」→ 複製（開頭是 ntn_）</li></ol>
        <a class="btn" href="https://www.notion.so/profile/integrations" target="_blank" rel="noopener">打開 Notion 開發人員連接</a>
        <h2 style="margin-top:16px"><b>B</b>讓權杖看得到你的頁面</h2><ol>
        <li>在同一個連接設定裡打開「內容存取」，勾選要放劇場資料的頁面</li>
        <li>或：在 Notion 打開那一頁，右上角「⋯」→「連線」→ 選「劇場幫幫」</li>
        <li>還沒有劇場資料庫的話，先在 Notion 建一個空白頁面（例如「劇場管理」）再勾選它，下一步可以自動建立</li></ol></details></div>`;
  const whoCard = (c, force) => `<div class="tdh-st" id="tdhWho"><h2>${force ? "" : "<b>2</b>"}你是誰</h2>
        <p>你的名字（案子沒有另外指定負責人時，就用這個）</p>
        <input id="tdhTd" value="${esc(c.tdName || "")}" placeholder="例如：王小明">
        <p style="margin-top:12px">你的職稱（畫面和時段表上會這樣稱呼你）</p>
        <div class="tdh-chips" data-for="tdhRole">${["TD", "燈光TD", "音響TD", "SM", "製作人", "執行製作"].map(x => `<button type="button" class="ghost">${x}</button>`).join("")}</div>
        <input id="tdhRole" value="${esc(c.role || "")}" placeholder="例如：TD、燈光TD、SM、製作人">
        <p style="margin-top:12px">你帶的組別（例如「舞台組人員名單」）</p>
        <div class="tdh-chips" data-for="tdhTeam">${["舞台組", "燈光組", "音響組", "前台組", "製作組"].map(x => `<button type="button" class="ghost">${x}</button>`).join("")}</div>
        <input id="tdhTeam" value="${esc(c.team || "")}" placeholder="例如：舞台組">
        <button id="tdhSave" class="big">${force ? "儲存" : "開始使用"}</button></div>`;

  function open(force, resume) {
    if (document.querySelector(".tdh-ov")) return;
    const c = T.cfg, ov = document.createElement("div"); ov.className = "tdh-ov";
    const seen = (() => { try { return localStorage.getItem("tdh.seen") === "1"; } catch (e) { return false; } })();
    const mode = c.mode || "";
    let body;
    if (force) {
      body = `${whoCard(c, true)}
        <div class="tdh-st"><h2>資料放在</h2><p>${mode === "google" ? "Google 雲端硬碟「劇場幫幫 / 劇場幫幫資料」" + (T.gstore.url() ? `　<a href="${T.gstore.url()}" target="_blank" rel="noopener">打開 ↗</a>` : "") : "Notion"}</p></div>
        ${googleCard(true)}
        ${mode === "notion" ? notionCard(c, seen, true) : ""}
        <div class="tdh-st"><button class="ghost" id="tdhClose">關閉</button> <button class="ghost" id="tdhSwitch">${mode === "google" ? "改用 Notion" : "改用 Google 雲端"}</button> <button class="ghost" id="tdhOut">登出並清除設定</button></div>`;
    } else if (resume === "google" || (mode === "google" && T.cfg.gRefresh && !T.cfg.gData)) {
      body = `${googleCard(false)}<div id="tdhWhoBox" style="display:none">${whoCard(c, false)}</div>`;
    } else if (mode === "notion" || resume === "notion") {
      body = `${notionCard(c, seen, false)}<div id="tdhWhoBox" style="display:${notionReady() ? "" : "none"}">${whoCard(c, false)}</div><button class="ghost" id="tdhBack" style="border:0;background:none;color:#6e685f;text-decoration:underline;font-size:14px">‹ 改用 Google 帳號</button>`;
    } else if (dataReady()) {
      body = whoCard(c, false);
    } else body = chooseCard();
    ov.innerHTML = `<div class="tdh-in">
      <h1>劇場幫幫</h1><div class="sub">${force ? "設定" : "給劇場人的排班、找人、時段表小幫手"}</div>
      ${ios && !standalone && !force ? `<div class="tdh-tip"><b>📱 iPhone 請先加到主畫面再設定</b><br>Safari 和主畫面的捷徑各自存設定，在這裡設定好，從主畫面打開還要再設定一次。<br>做法：按下方的「分享」→「加入主畫面」→ 從主畫面打開「劇場幫幫」再設定。<br><button type="button" class="ghost" id="tdhTipOk" style="margin-top:8px;padding:6px 12px;font-size:13px;border:0;border-radius:999px;background:#f3e3bd">我只要在 Safari 用，繼續</button></div>` : ""}
      ${body}
      <div class="tdh-foot">設定只存在這個瀏覽器裡；資料直接存在你自己的 Google 雲端或 Notion，不會經過別的地方保存。請用 Safari 或 Chrome 打開，LINE、Notion 裡面的內建瀏覽器不會記住設定。</div>
    </div>`;
    document.body.appendChild(ov);
    const $ = (id) => ov.querySelector("#" + id);
    const showWho = () => { const w = $("tdhWhoBox"); if (w) { w.style.display = ""; w.scrollIntoView({ behavior: "smooth", block: "start" }); } };

    // 選擇
    if ($("tdhPickG")) $("tdhPickG").onclick = async () => {
      if (!(await T.google.ready())) { alert("這個網站還沒開通 Google 登入，請先用 Notion，或請網站管理者設定。"); return; }
      T.setCfg({ mode: "google" }); T.google.login("setup");
    };
    if ($("tdhPickN")) $("tdhPickN").onclick = () => { T.setCfg({ mode: "notion" }); ov.remove(); open(false, "notion"); };
    if ($("tdhBack")) $("tdhBack").onclick = () => { T.setCfg({ mode: "" }); ov.remove(); open(false); };

    // Google 區塊
    if ($("tdhGBody")) (async () => {
      const G = T.google, box = $("tdhGBody");
      if (!(await G.ready())) { box.innerHTML = `<p class="no">這個網站還沒開通 Google 登入。</p>`; return; }
      if (!G.signedIn) { box.innerHTML = `<p>${force ? "登入後可以在你的 Google 雲端建立時段表試算表。" : ""}</p><button id="tdhGIn">登入 Google</button>`; $("tdhGIn").onclick = () => G.login(force ? "settings" : "setup"); return; }
      box.innerHTML = `<p class="ok">✓ 已登入 ${esc(G.email)}</p>${force ? `<button class="ghost" id="tdhGOut">登出 Google</button>` : `<div id="tdhGStep" style="font-size:14px;color:#6e685f;margin-top:6px">準備你的資料…</div><div class="tdh-err" id="tdhGErr"></div>`}`;
      if ($("tdhGOut")) $("tdhGOut").onclick = () => { if (T.cfg.mode === "google" && !confirm("登出後要重新登入才能讀到資料，確定嗎？")) return; G.logout(); location.reload(); };
      if (!force) {
        try {
          await T.gstore.ensure((m) => { const x = $("tdhGStep"); if (x) x.textContent = m; });
          $("tdhGStep").innerHTML = `<span class="ok">✓ 資料放在你的雲端硬碟「劇場幫幫 / 劇場幫幫資料」</span>`;
          showWho();
        } catch (e) {
          $("tdhGErr").innerHTML = "準備資料失敗：" + esc(e.message || e) + `<br><button id="tdhGRetry">再試一次</button>`;
          $("tdhGRetry").onclick = () => { ov.remove(); open(false, "google"); };
        }
      }
    })();

    // Notion 區塊
    let found = null;
    if ($("tdhGo")) $("tdhGo").onclick = async () => {
      const tok = $("tdhTok").value.trim(); $("tdhErr").textContent = ""; $("tdhRes").textContent = "連線中…";
      if (!/^(ntn_|secret_)/.test(tok)) { $("tdhRes").textContent = ""; $("tdhErr").textContent = "權杖看起來不對，應該是 ntn_ 開頭的一串字。"; return; }
      try {
        found = await T.findDatabases(tok);
        const names = T.DB_NAMES;
        $("tdhRes").innerHTML = Object.entries(names).map(([k, n]) => found[k] ? `<div class="ok">✓ ${n}</div>` : `<div class="no">✗ 找不到「${n}」</div>`).join("");
        if (Object.keys(names).every(k => found[k])) { T.setCfg({ token: tok, db: found, mode: "notion" }); if (force) $("tdhRes").innerHTML += `<div class="ok">已更新</div>`; else showWho(); }
        else if (!Object.keys(names).some(k => found[k])) { T.setCfg({ token: tok }); showCreate(tok); }
        else $("tdhErr").textContent = "有資料庫找不到：請確認已經在「內容存取」勾選放資料庫的頁面，或資料庫名稱完全一樣。";
      } catch (e) {
        $("tdhRes").textContent = "";
        $("tdhErr").textContent = e.status === 401 ? "權杖無效，請回 Notion 重新複製一次。" : "連線失敗：" + (e.message || e);
      }
    };
    async function showCreate(tok) {
      const box = $("tdhRes");
      box.innerHTML = `<div style="margin-bottom:6px">還沒有劇場資料庫。要幫你建立嗎？選一個要放資料庫的頁面：</div><div id="tdhPages">讀取頁面中…</div>`;
      try {
        const pages = await T.listPages(tok);
        const el = $("tdhPages");
        if (!pages.length) { el.innerHTML = `<div class="no">找不到可以用的頁面：請先在 Notion 連接的「內容存取」勾選一個頁面。</div>`; return; }
        el.innerHTML = pages.map((p, i) => `<button class="ghost" data-i="${i}" style="display:block;width:100%;text-align:left;margin-top:6px">📄 ${esc(p.title)}</button>`).join("");
        el.querySelectorAll("button").forEach(b => b.onclick = async () => {
          const pg = pages[+b.dataset.i]; el.innerHTML = `<div>在「${esc(pg.title)}」建立中…</div><div id="tdhStepMsg"></div>`;
          try {
            found = await T.createDatabases(tok, pg.id, (m) => { const x = $("tdhStepMsg"); if (x) x.textContent = m; });
            T.setCfg({ token: tok, db: found, mode: "notion" });
            box.innerHTML = Object.values(T.DB_NAMES).map(n => `<div class="ok">✓ 已建立 ${n}</div>`).join("") + `<div style="margin-top:6px;color:#6e685f">也建了一個「（範例）」案子。</div>`;
            showWho();
          } catch (e) { $("tdhErr").textContent = "建立失敗：" + (e.message || e); }
        });
      } catch (e) { $("tdhErr").textContent = "讀取頁面失敗：" + (e.message || e); }
    }

    // 你是誰
    ov.querySelectorAll(".tdh-chips").forEach(box => box.querySelectorAll("button").forEach(b => b.onclick = () => { $(box.dataset.for).value = b.textContent; }));
    if ($("tdhTipOk")) $("tdhTipOk").onclick = () => $("tdhTipOk").parentNode.remove();
    if ($("tdhSave")) $("tdhSave").onclick = () => {
      T.setCfg({ tdName: $("tdhTd").value.trim(), role: $("tdhRole").value.trim(), team: $("tdhTeam").value.trim(), named: true });
      try { localStorage.setItem("tdh.seen", "1"); } catch (e) {}
      location.reload();
    };
    if ($("tdhClose")) $("tdhClose").onclick = () => ov.remove();
    if ($("tdhSwitch")) $("tdhSwitch").onclick = () => {
      if (!confirm(T.cfg.mode === "google" ? "改用 Notion 後，會讀取 Notion 裡的資料（Google 雲端裡的資料不會被刪除）。要繼續嗎？" : "改用 Google 雲端後，會在你的雲端硬碟建立新的資料（Notion 裡的資料不會被刪除、也不會搬過去）。要繼續嗎？")) return;
      if (T.cfg.mode === "google") { T.setCfg({ mode: "notion" }); ov.remove(); open(false, "notion"); }
      else { T.setCfg({ mode: "google" }); if (T.google.signedIn) { ov.remove(); open(false, "google"); } else T.google.login("setup"); }
    };
    if ($("tdhOut")) $("tdhOut").onclick = () => { if (confirm("確定要登出並清除這個瀏覽器裡的設定？（你的資料不會被刪除）")) { localStorage.removeItem("tdh.settings.v1"); localStorage.removeItem("tdh.gat"); location.reload(); } };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const g = document.createElement("button"); g.className = "tdh-gear"; g.textContent = "⚙︎"; g.title = "設定";
    g.onclick = () => open(true);
    const modes = document.querySelector(".modes");
    if (modes) modes.appendChild(g); else { g.style.cssText = "position:fixed;right:10px;top:10px;z-index:50"; document.body.appendChild(g); }
    // 舊版使用者：已經設定好 Notion，就不用再填「你是誰」
    if (T.cfg.mode === "notion" && notionReady() && !T.cfg.named && T.cfg.tdName !== undefined) T.setCfg({ named: true });
    const r = await T.googleReturn;
    if (r && r.ok && r.after === "setup") { open(false, "google"); return; }
    if (need()) open(false);
    if (!r) return;
    const b = document.createElement("div");
    b.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:10000;background:" + (r.error ? "#b3261e" : "#2f5d50") + ";color:#fff;border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.5;box-shadow:0 4px 16px rgba(0,0,0,.2)";
    b.textContent = r.error || (String(r.after).startsWith("sheet") ? "✓ 已登入 Google。回到「結案 → 時段表」，再按一次「建立 Google 試算表」。" : "✓ 已登入 Google。");
    b.onclick = () => b.remove(); document.body.appendChild(b); setTimeout(() => b.remove(), 9000);
  });
})();
