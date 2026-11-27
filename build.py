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
      msg.textContent = "準備「劇場幫幫 / 時段表」資料夾…";
      const dir = await G.sheetFolder();
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
h = h.replace("Notion 的連線過期了，請到 claude.ai「設定 → 連接器」重新連接 Notion。", "Notion 金鑰失效了，請按上方的 ⚙︎ 重新貼上金鑰。")
h = h.replace("還沒連接 Notion，請到 claude.ai「設定 → 連接器」加入 Notion。", "還沒設定 Notion，請按上方的 ⚙︎ 設定。")
h = h.replace("這個畫面無法連到 Notion。請在 claude.ai 或 Claude App 裡打開這個頁面。", "還沒設定 Notion，請按上方的 ⚙︎ 設定。")
h = h.replace("這個畫面無法連到 Notion。請在 claude.ai 或 Claude App 裡打開。", "還沒設定 Notion，請按上方的 ⚙︎ 設定。")
h = h.replace("Notion 連線過期，請到 claude.ai 設定 → 連接器 重新連接。", "Notion 金鑰失效了，請按上方的 ⚙︎ 重新貼上金鑰。")
h = h.replace('case "not_granted":', 'case "google_login": msg = "Google 登入過期了，請按上方的 ⚙︎ 重新登入 Google。"; break;\n      case "not_configured": case "not_granted":', 1)
rep('if (c === "needs_reauth") return', 'if (c === "google_login") return "Google 登入過期了，請按上方的 ⚙︎ 重新登入 Google。";\n    if (c === "needs_reauth") return', 1)
# 不一定用 Notion：畫面上的字改成中性的說法
for a, b in [
    ("還沒設定 Notion，請按上方的 ⚙︎ 設定。", "還沒設定好，請按上方的 ⚙︎ 設定。"),
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
h = re.sub(r"<title>[^<]*</title>", "<title>劇場幫幫</title>", h, count=1)
head_extra = f"""<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="劇場幫幫">
<meta name="theme-color" content="#f4f1ea">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon-180.png">
<script>window.TDH_VERSION={json.dumps(VERSION)};</script>
<script>\n{(ROOT/'src/schema.js').read_text()}\n</script>
<script>\n{(ROOT/'src/shim.js').read_text()}\n</script>
<script>\n{(ROOT/'src/google.js').read_text()}\n</script>
<script>\n{(ROOT/'src/gstore.js').read_text()}\n</script>
<script>\n{(ROOT/'src/xlsx.js').read_text()}\n</script>
<script>\n{(ROOT/'src/setup.js').read_text()}\n</script>
<script>\n{(ROOT/'src/manage.js').read_text()}\n</script>
"""
rep("</head>", head_extra + "</head>", 1)

out = ROOT / "dist"; out.mkdir(exist_ok=True)
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
