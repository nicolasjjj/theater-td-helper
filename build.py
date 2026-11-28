#!/usr/bin/env python3
"""把 Claude 版網頁（crew-copy/index.html）轉成獨立版（劇場幫幫）（dist/index.html）。
同一份程式碼維護兩個版本：Claude 版直接用；獨立版經過這支腳本替換「連線層」。"""
import re, sys, pathlib, json, datetime

ROOT = pathlib.Path(__file__).parent
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/crew-copy/index.html")
VERSION = datetime.datetime.now().strftime("%Y.%m.%d-%H%M")

h = SRC.read_text(encoding="utf-8")

def rep(old, new, count=None):
    global h
    n = h.count(old)
    if n == 0 or (count is not None and n != count):
        raise SystemExit(f"build: expected {count or '>=1'} of {old[:60]!r}, found {n}")
    h = h.replace(old, new)

# 1. Notion 檢視 → 獨立版的邏輯名稱（連線層會換成資料庫查詢）
VIEWS = {
    "view://dcb08810-da2f-4f2f-8b91-659d8674dae1": "view://TD",
    "view://12861050-6a4f-80fa-b972-000c6a62fde0": "view://DONE",
    "view://1b70e5af-c947-4339-88b7-06999f18415b": "view://NEED",
    "view://94b52fd3-9cb7-4daf-8c63-0d38bbcf6e8c": "view://CREW",
    "view://41c61050-6a4f-8139-a08c-000c42ea20dd": "view://TROUPE",
    "view://19861050-6a4f-801d-aa73-000c3aeaea50": "view://VENUE",
}
for a, b in VIEWS.items(): rep(a, b)
h = re.sub(r'collection://[0-9a-f-]{36}', 'collection://unused', h)

# 2. 預設 TD 名字 → 使用者設定
rep('"劉冠佑"', 'window.TDN()')
rep('"冠佑墊款金額為"', '"${window.TDN()}墊款金額為"', 1)
rep('"←冠佑墊付總金額"', '"←" + window.TDN() + "墊付總金額"', 1)
h = h.replace("空白就是冠佑", "空白就是你")

# 2b. 「TD」字樣 → 使用者自己的職稱；「舞台組」→ 使用者的組別（程式內部判斷仍用 "TD"）
R = "${window.ROLE()}"
for a, b in [
    ('<mark class="hl">TD ${esc(TD)}</mark>', f'<mark class="hl">{R} ${{esc(TD)}}</mark>'),
    ('<div class="tdrow"><span>TD</span>', f'<div class="tdrow"><span>{R}</span>'),
    ('toast(`TD 改成 ${v}`)', f'toast(`{R} 改成 ${{v}}`)'),
    ('（含 TD）', f'（含{R}）'),
    ('<label>TD 時段費<input', f'<label>{R} 時段費<input'),
    ('<label>這個案子的 TD<input', f'<label>這個案子的{R}<input'),
    ('<mark class="hl">TD ${TD_NAME}</mark>・人數含 TD', f'<mark class="hl">{R} ${{TD_NAME}}</mark>・人數含{R}'),
    ('`<span>舞台技術指導 TD</span>`', f'`<span>{R}</span>`'),
    ('`<span>TD ${TD_NAME}</span>', f'`<span>{R} ${{TD_NAME}}</span>'),
    ('if (name === TD_NAME) return "TD";', 'if (name === TD_NAME) return window.ROLE();'),
    ('roleText: any.role === "TD" ? "TD" :', 'roleText: any.role === "TD" ? window.ROLE() :'),
]: rep(a, b)
h = h.replace(">舞台組人員名單<", ">${window.TEAM()}人員名單<")
h = h.replace("每天預計的舞台組人員", "每天預計的${window.TEAM()}人員")
assert "劉冠佑" not in h and "冠佑" not in h, "personal name left"

# 3. 時段表：仿預覽樣式。主要按鈕建立 Google 試算表（使用者自己的雲端），另外可以下載 Excel
rep("async function makeGoogleSheet(c, s) {", "async function makeGoogleSheet_google(c, s) {", 1)
rep("  // ---------- preview ----------", (ROOT/"src/prettysheet.js").read_text() + """
  async function makeGoogleSheet(c, s) {   // 劇場幫幫：在使用者自己的 Google 雲端建立試算表
    const btn = $("tsMake"), msg = $("tsMsg"), G = window.__tdh.google;
    if (!(await G.ready())) { msg.textContent = "Google 試算表功能還沒開通，請先用「下載 Excel」。"; return; }
    if (!G.signedIn) { msg.textContent = "要先登入 Google，才能在你的雲端硬碟建立試算表。前往 Google 登入中…"; G.login("sheet:" + c.id); return; }
    btn.disabled = true; btn.textContent = "建立中…";
    try {
      const plan = prettyPlan(s);
      msg.textContent = `準備「劇場幫幫 / ${c.title || "案子"} / 時段表」資料夾…`;
      const dir = await G.caseSheetFolder(c.title);
      msg.textContent = "建立試算表…";
      const f = await G.api("https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", body: { name: s.title, mimeType: "application/vnd.google-apps.spreadsheet", parents: [dir] } });
      const id = f.id, SS = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
      const meta = await G.api(`${SS}?fields=sheets.properties.sheetId`);
      const SID = ((meta.sheets || [])[0] || { properties: { sheetId: 0 } }).properties.sheetId || 0, SID2 = SID === 1 ? 2 : 1;
      await G.api(`${SS}:batchUpdate`, { method: "POST", body: { requests: [
        { updateSheetProperties: { properties: { sheetId: SID, title: "時段表" }, fields: "title" } },
        { addSheet: { properties: { sheetId: SID2, title: EXP_TAB, index: 1 } } } ] } });
      msg.textContent = "寫入表格內容…";
      await G.api(`${SS}/values:batchUpdate`, { method: "POST", body: { valueInputOption: "USER_ENTERED", data: [{ range: "'時段表'!A1", values: plan.rows }, { range: `'${EXP_TAB}'!A1`, values: plan.rows2 }] } });
      msg.textContent = "套用樣式…";
      await G.api(`${SS}:batchUpdate`, { method: "POST", body: { requests: plan.reqs(SID, SID2, "sheets") } });
      msg.textContent = "設定共用連結…";
      let shared = true;
      try { await G.api(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, { method: "POST", body: { role: "reader", type: "anyone" } }); } catch (e) { shared = false; }
      if (!shared) sheetWarn[c.id] = "試算表建好了，但共用設定沒有成功，請在 Google 試算表裡手動改成「知道連結的使用者：檢視者」。"; else delete sheetWarn[c.id];
      sheetLinks[c.id] = `https://docs.google.com/spreadsheets/d/${id}/edit`;
      toast("試算表建立好了");
      render();
    } catch (e) {
      btn.disabled = false; btn.textContent = "建立 Google 試算表";
      msg.textContent = e && e.code === "google_login" ? String(e.message) + "（按一下按鈕就會前往登入）" : "建立失敗：" + String((e && e.message) || e).slice(0, 140);
    }
  }
  async function makeXlsx(c, s) {   // 下載 Excel（樣式和 Google 試算表一樣）
    const btn = $("tsXlsx"), msg = $("tsMsg");
    btn.disabled = true;
    try {
      const plan = prettyPlan(s);
      const blob = window.__tdh.xlsx([{ name: "時段表", rows: plan.rows }, { name: EXP_TAB, rows: plan.rows2 }], plan.reqs(0, 1, "xlsx"));
      const how = await window.__tdh.saveFile(blob, `${s.title}.xlsx`.replace(/[\\\\/:*?"<>|]/g, "_"));
      if (how !== "cancelled") toast("Excel 已下載");
    } catch (e) { msg.textContent = "製作失敗：" + String((e && e.message) || e).slice(0, 120); }
    btn.disabled = false;
  }
  // ---------- preview ----------""", 1)
rep('${sheetLinks[c.id] ? "重新建立 Google 試算表" : "建立 Google 試算表"}</button>', '${sheetLinks[c.id] ? "重新建立 Google 試算表" : "建立 Google 試算表"}</button><button class="ghost" id="tsXlsx" style="margin-top:8px;width:100%">下載 Excel 檔</button>', 1)
rep('$("tsMake").onclick = () => makeGoogleSheet(c, merge ? buildTourSheet(c) : buildSheet(c, rec, tmap));', 'const fresh = async () => { loadTable(c); const m = $("tsMsg"); for (let i = 0; i < 80 && Object.values(tables).includes("loading"); i++) { if (m) m.textContent = "等 Call Time 表格讀取完成…"; await new Promise(r => setTimeout(r, 250)); } return merge ? buildTourSheet(c) : buildSheet(c, recOf(c), tableMap(c)); };\n      $("tsMake").onclick = async () => makeGoogleSheet(c, await fresh()); $("tsXlsx").onclick = async () => makeXlsx(c, await fresh());', 1)   # 按下去時 Call Time 表格可能還在讀 → 等讀完，才不會漏人
rep("會建立在這個案子資料夾裡的「時段表」資料夾（知道連結的人都能檢視），同名的舊檔會保留，新檔名後面加上時間。", "會建立在你 Google 雲端硬碟的「劇場幫幫 / 時段表」資料夾（知道連結的人都能檢視），樣式和上面的預覽一樣，可以直接編輯：改段數或時段費，金額會自動重算。", 1)
h = re.sub(r'\$\{c\.tsFolder \? `<div class="note">存放位置：[\s\S]*?</div>` : ""\}', "", h, count=1)

# 3b. 預覽：拿掉上方的人數、段數、總金額
h, n = re.subn(r'\$\{shot \? "" : `<div class="tsx-chips">.*?</div>`\}', "", h, count=1)
assert n == 1, "tsx-chips"

# 4. 錯誤訊息：獨立版沒有 claude.ai
h = h.replace("Notion 的連線過期了，請到 claude.ai「設定 → 連接器」重新連接 Notion。", "Notion 金鑰失效了，請到「名單」頁右上角的 ⚙︎ 重新貼上金鑰。")
h = h.replace("還沒連接 Notion，請到 claude.ai「設定 → 連接器」加入 Notion。", "還沒設定 Notion，請到「名單」頁右上角的 ⚙︎ 設定。")
h = h.replace("這個畫面無法連到 Notion。請在 claude.ai 或 Claude App 裡打開這個頁面。", "還沒設定 Notion，請到「名單」頁右上角的 ⚙︎ 設定。")
h = h.replace("這個畫面無法連到 Notion。請在 claude.ai 或 Claude App 裡打開。", "還沒設定 Notion，請到「名單」頁右上角的 ⚙︎ 設定。")
h = h.replace("Notion 連線過期，請到 claude.ai 設定 → 連接器 重新連接。", "Notion 金鑰失效了，請到「名單」頁右上角的 ⚙︎ 重新貼上金鑰。")
h = h.replace('case "not_granted":', 'case "google_login": msg = "Google 登入過期了，請到「名單」頁右上角的 ⚙︎ 重新登入 Google。"; break;\n      case "not_configured": case "not_granted":', 1)
rep('if (c === "needs_reauth") return', 'if (c === "google_login") return "Google 登入過期了，請到「名單」頁右上角的 ⚙︎ 重新登入 Google。";\n    if (c === "needs_reauth") return', 1)
# 不一定用 Notion：畫面上的字改成中性的說法
for a, b in [
    ("還沒設定 Notion，請到「名單」頁右上角的 ⚙︎ 設定。", "還沒設定好，請到「名單」頁右上角的 ⚙︎ 設定。"),
    ("<h1>缺人訊息</h1>", "<h1>Call人訊息複製 / 編輯人員名單</h1>"),   # 之後再改成「Call人訊息複製」
    ("・來自「劇場の案子」`", "・來自${window.__tdh.cfg.mode === \"google\" ? \"你的 Google 雲端\" : \" Notion「劇場の案子」\"}`"),
    ('toast("已記錄到 Notion")', 'toast("已記錄")'),
    ("表格有幾列沒寫進去，請到 Notion 確認", "表格有幾列沒寫進去，請到「☰ 管理」確認排班表"),
    (">寫入 Notion<", ">確定寫入<"),
    ('fail(e, go, "寫入 Notion")', 'fail(e, go, "確定寫入")'),
    ("`已把 ${person.name} 寫進 Notion`", "`已把 ${person.name} 排進去了`"),
    ("讀取 Notion 時出了問題", "讀取資料時出了問題"),
    ("Notion 暫時沒有回應", "資料暫時讀不到"),
    ("Notion 回報錯誤", "讀取資料出錯"),
    ("Notion 這個小時的查詢次數用完了", "這個小時的查詢次數用完了"),
    ("還沒找到，請在案子內文或「劇場の劇團」填寫", "還沒找到，請在「☰ 管理」的劇團或案子裡填寫"),
]: h = h.replace(a, b)

# 5. 標題、手機加到主畫面、版本
h = re.sub(r"<title>[^<]*</title>", """<title>劇場幫幫</title>
<meta name="description" content="給劇場人的工作小幫手：找人、每日打卡、時段表一次搞定。資料存在你自己的 Google 雲端硬碟。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="劇場幫幫">
<meta property="og:title" content="劇場幫幫｜找人・打卡・時段表">
<meta property="og:description" content="給劇場人的工作小幫手：找人、每日打卡、時段表一次搞定。">
<meta property="og:url" content="https://theater-helper.j7897063.workers.dev/">
<meta property="og:image" content="https://theater-helper.j7897063.workers.dev/og.png?v=3">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://theater-helper.j7897063.workers.dev/og.png?v=3">""", h, count=1)
head_extra = f"""<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="劇場幫幫">
<meta name="theme-color" content="#f4f1ea">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon-180.png?v=3"><link rel="icon" type="image/png" href="/icon-192.png?v=3">
<script>window.TDH_VERSION={json.dumps(VERSION)};</script>
<script>\n{(ROOT/'src/inapp.js').read_text()}\n</script>
<script>\n{(ROOT/'src/schema.js').read_text()}\n</script>
<script>\n{(ROOT/'src/shim.js').read_text()}\n</script>
<script>\n{(ROOT/'src/google.js').read_text()}\n</script>
<script>\n{(ROOT/'src/gstore.js').read_text()}\n</script>
<script>\n{(ROOT/'src/xlsx.js').read_text()}\n</script>
<script>\n{(ROOT/'src/setup.js').read_text()}\n</script>
<script>\n{(ROOT/'src/manage.js').read_text()}\n</script>
<script>\n{(ROOT/'src/nav.js').read_text()}\n</script>
<script>\n{(ROOT/'src/tour.js').read_text()}\n</script>
"""
rep("</head>", head_extra + "</head>", 1)

out = ROOT / "dist"; out.mkdir(exist_ok=True)
# 框架 D：截圖搬到結案、找人卡片標上案子網址
for a, b in [
    ('c.className = "card" + (selected.has(i.key) ? " sel" : "");', 'c.className = "card" + (selected.has(i.key) ? " sel" : ""); c.dataset.url = i.url || "";'),
    ('const PHASE_TABS = { live: [["punch", "每日打卡"], ["shot", "截圖"]], close: [["crew", "時段費"], ["sheet", "時段表"], ["give", "給 Crew"]] };',
     'const PHASE_TABS = window.__tdh && window.__tdh.solo && window.__tdh.solo() && window.__tdh.ui && window.__tdh.ui() !== "C" ? { live: [["punch", "每日打卡"]], close: [["mine", "我的時段明細"]] } : window.__tdh && window.__tdh.ui && window.__tdh.ui() !== "C" ? { live: [["punch", "每日打卡"]], close: [["crew", "時段費"], ["sheet", "時段表"], ["give", "給 Crew"], ["shot", "截圖"]] } : { live: [["punch", "每日打卡"], ["shot", "截圖"]], close: [["crew", "時段費"], ["sheet", "時段表"], ["give", "給 Crew"]] };'),
]:
    assert a in h, a[:40]; h = h.replace(a, b)
# 找人頁：標題、卡片按鈕、只列 20 位常找的 Crew、「詳細資訊」跳到案子看板的 Call Time
for a, b in [
    ("<h1>Call人訊息複製 / 編輯人員名單</h1>", "<h1>Call人訊息複製</h1>"),
    ('let html = `<div class="planrow"><b>人力分配</b>　<span>${i.plan ? esc(i.plan) : "—"}</span></div>`;', 'let html = "";'),
    ('el.innerHTML = `<div class="bk-h"><span>加入 / 編輯</span><i>›</i></div>`;', 'el.innerHTML = `<div class="bk-h"><span>+ Crew</span></div>`;'),
    ('<button class="tblBtn">看表格</button>', '<button class="tblBtn">目前人力</button>'),
    ('if (e.target.closest(".tblBtn")) { e.stopPropagation(); openTable(i); return; }', 'if (e.target.closest(".tblBtn")) { e.stopPropagation(); const T2 = window.__tdh, m = String(i.url || "").replace(/-/g, "").match(/[0-9a-f]{32}/i); if (T2 && T2.showTab && m) T2.showTab("cases", { caseId: m[0].toLowerCase(), scrollTo: "ct" }); else openTable(i); return; }'),
    ('${rest.slice(0, 120).map(p => chip(p, false)).join("")', '${rest.slice(0, q ? 120 : 20).map(p => chip(p, false)).join("")'),
    ('body.querySelectorAll(".ask").forEach(b => b.onclick = () => openConfirm(i, crewDir[b.dataset.id], draw));',
     '''if (!all.some(p => p.name === q)) { body.insertAdjacentHTML("beforeend", `<div class="bk-new"><button type="button" class="bk-newbtn" id="bkNew">＋ 新增${q ? `「${esc(q)}」為` : "全新的"} Crew</button></div>`);
        body.querySelector("#bkNew").onclick = () => {
          const srW = sheet.querySelector(".tdh-sx") || sheet.querySelector("#askSearch"); if (srW) srW.style.display = "none";
          body.innerHTML = `<div class="bk-new"><div class="clabel">新增全新的 Crew</div><div class="bk-newrow"><input id="bkNewName" placeholder="新 Crew 的姓名" value="${esc(q)}" enterkeyhint="done"><button type="button" id="bkNewOk">新增</button></div>
            <div class="note" style="margin-top:8px">其他資料之後可以到「資料庫 → Crew」補</div><button type="button" class="linkbtn" id="bkNewBack" style="margin-top:10px">← 回到名單</button></div>`;
          body.scrollTop = 0;
          const box = body.querySelector(".bk-new");
          body.querySelector("#bkNewBack").onclick = () => { if (srW) srW.style.display = ""; draw(); };
          const inp = box.querySelector("#bkNewName"); inp.focus();
          const go = async () => {
            const nm = inp.value.trim(); if (!nm) { inp.focus(); return; }
            const ok = box.querySelector("#bkNewOk"); ok.disabled = true; ok.textContent = "新增中…";
            try {
              await window.__tdh.store().create("crew", { "姓名": nm });
              crewDirState = null; await loadCrewDir();
              const np = Object.values(crewDir).find(p => p.name === nm);
              toast(`已新增 ${nm}`);
              if (srW) srW.style.display = "";
              if (np) openConfirm(i, np, draw); else draw();
            } catch (e) { ok.disabled = false; ok.textContent = "新增"; toast("新增失敗：" + ((e && e.message) || e)); }
          };
          box.querySelector("#bkNewOk").onclick = go;
          inp.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) go(); };
        }; }
      body.querySelectorAll(".ask").forEach(b => b.onclick = () => openConfirm(i, crewDir[b.dataset.id], draw));'''),
    ("    const tabs = PHASE_TABS[phase];\n", '''    { const sm = $("pSum").querySelector(".sum");
      const day = 864e5, t0 = new Date(c.start).setHours(0, 0, 0, 0), t1 = new Date(c.end || c.start).setHours(0, 0, 0, 0) + day, now = Date.now();
      const nD = Math.max(1, Math.round((t1 - t0) / day)), pct = Math.max(0, Math.min(1, (now - t0) / (t1 - t0)));
      const dN = Math.min(nD, Math.floor((now - t0) / day) + 1), left = nD - dN;
      const txt = now < t0 ? [`還沒進場`, `${Math.ceil((t0 - now) / day)} 天後開始`] : now >= t1 ? [`共 ${nD} 天`, `這檔走完了，辛苦了！`] : [`第 ${dN} 天／共 ${nD} 天`, left ? `再撐 ${left} 天` : `最後一天！`];
      sm.classList.add("tap"); sm.querySelector(".sum-l").insertAdjacentHTML("beforeend", `<span class="sum-go">明細</span>`);
      sm.insertAdjacentHTML("beforeend", `<div class="prog"><div class="prog-t"><span>${txt[0]}</span><span>${txt[1]}</span></div><div class="prog-b"><i style="width:${(window.__progW || 0) * 100}%"></i></div></div>`);
      const bar = sm.querySelector(".prog-b i"); requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = pct * 100 + "%"; }));
      window.__progW = pct;
      sm.onclick = () => { try { const sh = buildSheet(c, rec, tmap), me = sh.people.find(p => p.role === "TD"); if (me) showShot(crewShotCard(c, sh, me)); else toast("還沒有打卡紀錄"); } catch (e) { toast("明細還算不出來"); } }; }
    const tabs = PHASE_TABS[phase];\n'''),
]:
    assert a in h, a[:40]; h = h.replace(a, b)
# 標題、進場前最下面的「回到最上面」
for a, b in [
    ("<header><h1>進場中</h1>", "<header><h1>每日打卡 / 截圖</h1>"),
    ('t.textContent = phase === "close" ? "結案" : "進場中";', 't.textContent = phase === "close" ? (window.__tdh.solo && window.__tdh.solo() ? "我的時段明細" : "時段表生成") : (window.__tdh.ui && window.__tdh.ui() !== "C" ? "每日打卡" : "每日打卡 / 截圖");'),
    ('let h = `<div class="ptabs">${tabs.map(', 'let h = tabs.length < 2 ? "" : `<div class="ptabs">${tabs.map('),
    ('<div id="list"><div class="state">讀取中…</div></div>\n  </div>', '<div id="list"><div class="state">讀取中…</div></div>\n  <button class="totop" type="button" onclick="window.scrollTo({top:0,behavior:\'smooth\'})" aria-label="回到最上面"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>回到最上面</button>\n  </div>'),
]:
    assert a in h, a[:40]; h = h.replace(a, b)
# 打卡「加入人員」視窗跟 +Crew 一樣的樣子；個人打卡模式的「我的時段明細」
for a, b in [
    ("""    sheet.innerHTML = `<div class="sh-in"><b>${dw(d.date)} 加入人員</b>
      <input id="pSearch" placeholder="搜尋姓名"><div id="pList" class="plist"></div>
      <div class="sh-actions"><button class="ghost" id="shClose">關閉</button></div></div>`;""",
     """    sheet.innerHTML = `<div class="sh-in"><div class="sh-top"><b>${dw(d.date)} 加入人員</b><button class="shx" id="shClose" aria-label="關閉">✕</button></div>
      <input id="pSearch" placeholder="搜尋姓名" enterkeyhint="done"><div class="sh-body"><div class="clabel">點名字加入這一天</div><div id="pList" class="plist"></div></div></div>`;
    sheet.onclick = (e) => { if (e.target === sheet) closeSheet(); };"""),
    ("""      const names = crewOrder(c, rec, tmap);
      h += `<details class="card rates\"""",
     """      if (ptab === "mine") {
        let mh = "";
        try { const sh = giveSheet(c, rec, tmap), me = sh.people.find(p => p.role === "TD"); mh = me && me.total ? crewShotCard(c, sh, me) : ""; } catch (e) {}
        h += `<div class="mine-card">${mh || `<div class="card note">還沒有打卡紀錄，先到「打卡」記上下班時間。</div>`}</div>
          ${mh ? `<div class="pvact"><button class="primary" id="mineShot">全螢幕看（方便截圖）</button><button class="ghost" id="mineCopy" style="margin-top:8px">複製文字明細</button></div>` : ""}`;
      } else {
      const names = crewOrder(c, rec, tmap);
      h += `<details class="card rates\""""),
    ("""    } else if (ptab === "give") {""", """      }
    } else if (ptab === "give") {"""),
    ("""    } else if (ptab === "crew") {""", """    } else if (ptab === "crew" || ptab === "mine") {"""),
    ("""\n    if (ptab === "crew") {\n""", """\n    if (ptab === "crew" || ptab === "mine") {
      if ($("mineShot")) $("mineShot").onclick = () => { const sh = giveSheet(c, rec, tmap); showShot(crewShotCard(c, sh, sh.people.find(p => p.role === "TD"))); };
      if ($("mineCopy")) $("mineCopy").onclick = () => { const m = crewMessages(c, rec, tmap, true)[0]; if (m) copyText(m.text, "已複製我的時段明細"); };
      if (document.querySelector(".rates")) \n"""),
    ("""  function crewMessages(c, rec, tmap) {
    const s = buildSheet(c, rec, tmap);
    return s.people.filter(p => p.role !== "TD").map(p => {""", """  function crewMessages(c, rec, tmap, me) {
    const s = buildSheet(c, rec, tmap);
    return s.people.filter(p => me ? p.role === "TD" : p.role !== "TD").map(p => {"""),
    ("""    $("rateAllBtn").onclick = () => {""", """    if ($("rateAllBtn")) $("rateAllBtn").onclick = () => {"""),
]:
    assert h.count(a) == 1, (h.count(a), a[:60]); h = h.replace(a, b)
# 日間／夜間模式可以手動切換：<html data-theme="light|dark">；沒設定就跟著系統
h, n = re.subn(r'@media \(prefers-color-scheme: dark\)\{\s*:root\{([^}]*)\}\s*\}', lambda m: "@media (prefers-color-scheme: dark){:root:not([data-theme=light]){" + m.group(1) + "}} :root[data-theme=dark]{" + m.group(1) + "}", h)
print("theme blocks", n)
(out / "index.html").write_text(h, encoding="utf-8")
(out / "version.json").write_text(json.dumps({"version": VERSION}), encoding="utf-8")
(out / "manifest.webmanifest").write_text(json.dumps({
    "name": "劇場幫幫", "short_name": "劇場幫幫", "start_url": "/", "display": "standalone",
    "background_color": "#f4f1ea", "theme_color": "#f4f1ea",
    "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}],
}, ensure_ascii=False), encoding="utf-8")
import shutil
for f in (ROOT / "static").glob("*"): shutil.copy(f, out / f.name)
print("built", VERSION, len(h), "bytes")
