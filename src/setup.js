// 劇場TD小幫手｜第一次設定（Notion 金鑰、找資料庫、預設 TD）
(() => {
  const T = window.__tdh;
  window.TDN = () => (T.cfg.tdName || "").trim() || "TD";
  const need = () => !T.cfg.token || !T.cfg.db || !["cases", "crew", "troupe", "venue"].every(k => T.cfg.db[k]);

  const css = `
  .tdh-ov{position:fixed;inset:0;z-index:9999;background:#f4f1ea;overflow:auto;-webkit-overflow-scrolling:touch;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif;color:#1d1b18}
  .tdh-in{max-width:520px;margin:0 auto;padding:28px 18px 60px}
  .tdh-in h1{font-size:24px;margin:0 0 4px}.tdh-in .sub{color:#6e685f;font-size:14px;margin-bottom:20px}
  .tdh-st{background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .tdh-st summary::marker{color:#2f5d50}.tdh-st h2{font-size:16px;margin:0 0 8px;display:flex;gap:8px;align-items:center}
  .tdh-st h2 b{display:inline-flex;width:24px;height:24px;border-radius:12px;background:#2f5d50;color:#fff;font-size:13px;align-items:center;justify-content:center}
  .tdh-st ol{margin:6px 0 0;padding-left:20px;font-size:14px;line-height:1.7;color:#3a362f}
  .tdh-st a.btn,.tdh-st button{display:inline-block;border:0;border-radius:999px;padding:10px 16px;font-size:15px;font-weight:600;background:#2f5d50;color:#fff;text-decoration:none;margin-top:10px}
  .tdh-st button.ghost{background:#ece8df;color:#1d1b18}
  .tdh-st input{width:100%;box-sizing:border-box;border:1.5px solid #d9d4cb;border-radius:12px;padding:12px;font-size:16px;margin-top:8px;background:#fbfaf7}
  .tdh-res{margin-top:10px;font-size:14px;line-height:1.8}.tdh-res .ok{color:#2f7a4f}.tdh-res .no{color:#b0741f}
  .tdh-err{color:#b3261e;font-size:14px;margin-top:8px}
  .tdh-gear{flex:0 0 40px;border:0;background:transparent;font-size:17px;color:#6e685f;cursor:pointer;border-radius:9px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function open(force) {
    if (document.querySelector(".tdh-ov")) return;
    const c = T.cfg, ov = document.createElement("div"); ov.className = "tdh-ov";
    const seen = (() => { try { return localStorage.getItem("tdh.seen") === "1"; } catch (e) { return false; } })();
    ov.innerHTML = `<div class="tdh-in">
      <h1>劇場TD小幫手</h1><div class="sub">${force ? "設定" : "連接你的 Notion，就可以開始使用"}</div>
      <div class="tdh-st"><h2><b>1</b>貼上 Notion API 權杖</h2>
        <div style="font-size:14px;color:#6e685f">還沒有權杖？看下面的「怎麼取得權杖」。</div>
        <input id="tdhTok" type="password" autocomplete="off" placeholder="ntn_ 開頭的一串字" value="${c.token ? c.token.replace(/"/g, "") : ""}">
        <button id="tdhGo">連線並尋找資料庫</button>
        <div class="tdh-res" id="tdhRes"></div><div class="tdh-err" id="tdhErr"></div></div>
      <div class="tdh-st" id="tdhStep4" style="display:none"><h2><b>2</b>你的名字</h2>
        <div style="font-size:14px;color:#6e685f">大部分案子的 TD 是誰？（案子裡「TD姓名」空白時就用這個）</div>
        <input id="tdhTd" value="${(c.tdName || "").replace(/"/g, "")}" placeholder="例如：王小明">
        <button id="tdhSave">開始使用</button></div>
      <details class="tdh-st" ${seen || force ? "" : "open"}><summary style="font-weight:700;font-size:16px;cursor:pointer">怎麼取得權杖（第一次使用約 5 分鐘）</summary>
        <h2 style="margin-top:12px"><b>A</b>建立 Notion 連接</h2><ol>
        <li>按下面按鈕打開 Notion 的「開發人員連接」頁面（手機請用瀏覽器開）</li>
        <li>按「＋ 新連接」：名稱填「劇場TD小幫手」，驗證方式選「API 權杖」，按「建立連接」</li>
        <li>點進剛建立的連接，找到「API 權杖」→ 複製（開頭是 ntn_）</li></ol>
        <a class="btn" href="https://www.notion.so/profile/integrations" target="_blank" rel="noopener">打開 Notion 開發人員連接</a>
        <h2 style="margin-top:16px"><b>B</b>讓權杖看得到你的頁面</h2><ol>
        <li>在同一個連接設定裡打開「內容存取」，勾選要放劇場資料的頁面</li>
        <li>或：在 Notion 打開那一頁，右上角「⋯」→「連線」→ 選「劇場TD小幫手」</li>
        <li>還沒有劇場資料庫的話，先在 Notion 建一個空白頁面（例如「劇場管理」）再勾選它，下一步可以自動建立</li></ol></details>
      ${force ? `<div class="tdh-st"><button class="ghost" id="tdhClose">關閉</button> <button class="ghost" id="tdhOut">清除權杖（登出）</button></div>` : ""}
      <div style="font-size:12px;color:#8a847a;line-height:1.6;margin-top:8px">權杖只存在這個瀏覽器裡，資料直接在你的 Notion 讀寫，不會存到別的地方。請用 Safari 或 Chrome 打開，LINE、Notion 裡面的內建瀏覽器不會記住設定。</div>
    </div>`;
    document.body.appendChild(ov);
    const $ = (id) => ov.querySelector("#" + id);
    let found = null;
    $("tdhGo").onclick = async () => {
      const tok = $("tdhTok").value.trim(); $("tdhErr").textContent = ""; $("tdhRes").textContent = "連線中…";
      if (!/^(ntn_|secret_)/.test(tok)) { $("tdhRes").textContent = ""; $("tdhErr").textContent = "權杖看起來不對，應該是 ntn_ 開頭的一串字。"; return; }
      try {
        found = await T.findDatabases(tok);
        const names = T.DB_NAMES;
        $("tdhRes").innerHTML = Object.entries(names).map(([k, n]) => found[k] ? `<div class="ok">✓ ${n}</div>` : `<div class="no">✗ 找不到「${n}」</div>`).join("");
        if (Object.keys(names).every(k => found[k])) { T.setCfg({ token: tok }); $("tdhStep4").style.display = ""; $("tdhTd").focus(); }
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
        el.innerHTML = pages.map((p, i) => `<button class="ghost" data-i="${i}" style="display:block;width:100%;text-align:left;margin-top:6px">📄 ${p.title.replace(/</g, "&lt;")}</button>`).join("");
        el.querySelectorAll("button").forEach(b => b.onclick = async () => {
          const pg = pages[+b.dataset.i]; el.innerHTML = `<div>在「${pg.title.replace(/</g, "&lt;")}」建立中…</div><div id="tdhStepMsg"></div>`;
          try {
            found = await T.createDatabases(tok, pg.id, (m) => { const x = $("tdhStepMsg"); if (x) x.textContent = m; });
            box.innerHTML = Object.values(T.DB_NAMES).map(n => `<div class="ok">✓ 已建立 ${n}</div>`).join("") + `<div style="margin-top:6px;color:#6e685f">也建了一個「（範例）」案子，之後新案子可以複製那一頁。</div>`;
            $("tdhStep4").style.display = "";
          } catch (e) { $("tdhErr").textContent = "建立失敗：" + (e.message || e); }
        });
      } catch (e) { $("tdhErr").textContent = "讀取頁面失敗：" + (e.message || e); }
    }
    $("tdhSave").onclick = () => {
      T.setCfg({ db: found, tdName: $("tdhTd").value.trim() });
      try { localStorage.setItem("tdh.seen", "1"); } catch (e) {}
      location.reload();
    };
    if ($("tdhClose")) $("tdhClose").onclick = () => ov.remove();
    if ($("tdhOut")) $("tdhOut").onclick = () => { if (confirm("確定要清除這個瀏覽器裡的 Notion 權杖？")) { localStorage.removeItem("tdh.settings.v1"); location.reload(); } };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const g = document.createElement("button"); g.className = "tdh-gear"; g.textContent = "⚙︎"; g.title = "設定";
    g.onclick = () => open(true);
    const modes = document.querySelector(".modes");
    if (modes) modes.appendChild(g); else { g.style.cssText = "position:fixed;right:10px;top:10px;z-index:50"; document.body.appendChild(g); }
    if (need()) open(false);
  });
})();
