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

# 3. 時段表：Google 試算表 → 下載 Excel
rep("async function makeGoogleSheet(c, s) {", "async function makeGoogleSheet_google(c, s) {", 1)
rep("  // ---------- preview ----------", """  async function makeGoogleSheet(c, s) {   // 獨立版：直接下載 Excel 檔
    const btn = $("tsMake"), msg = $("tsMsg");
    btn.disabled = true; btn.textContent = "製作中…";
    try {
      const plan = sheetPlan(s);
      const blob = window.__tdh.xlsx([{ name: "時段表", rows: plan.rows }, { name: EXP_TAB, rows: plan.rows2 }], plan.reqs(0, 1));
      const how = await window.__tdh.saveFile(blob, `${s.title}.xlsx`.replace(/[\\\\/:*?"<>|]/g, "_"));
      msg.textContent = how === "cancelled" ? "已取消。" : "Excel 檔做好了！可以存到檔案、傳到 LINE，或用 Google 試算表打開。";
      if (how !== "cancelled") toast("時段表已下載");
    } catch (e) { msg.textContent = "製作失敗：" + String((e && e.message) || e).slice(0, 120); }
    btn.disabled = false; btn.textContent = "下載 Excel 時段表";
  }
  // ---------- preview ----------""", 1)
rep('${sheetLinks[c.id] ? "重新建立 Google 試算表" : "建立 Google 試算表"}', "下載 Excel 時段表", 1)
rep("會建立在這個案子資料夾裡的「時段表」資料夾（知道連結的人都能檢視），同名的舊檔會保留，新檔名後面加上時間。", "下載成 Excel 檔（.xlsx），格式和顏色都會保留，可以直接傳給製作。", 1)
h = re.sub(r'\$\{c\.tsFolder \? `<div class="note">存放位置：[\s\S]*?</div>` : ""\}', "", h, count=1)

# 4. 錯誤訊息：獨立版沒有 claude.ai
h = h.replace("Notion 的連線過期了，請到 claude.ai「設定 → 連接器」重新連接 Notion。", "Notion 金鑰失效了，請按上方的 ⚙︎ 重新貼上金鑰。")
h = h.replace("還沒連接 Notion，請到 claude.ai「設定 → 連接器」加入 Notion。", "還沒設定 Notion，請按上方的 ⚙︎ 設定。")
h = h.replace("這個畫面無法連到 Notion。請在 claude.ai 或 Claude App 裡打開這個頁面。", "還沒設定 Notion，請按上方的 ⚙︎ 設定。")
h = h.replace("這個畫面無法連到 Notion。請在 claude.ai 或 Claude App 裡打開。", "還沒設定 Notion，請按上方的 ⚙︎ 設定。")
h = h.replace("Notion 連線過期，請到 claude.ai 設定 → 連接器 重新連接。", "Notion 金鑰失效了，請按上方的 ⚙︎ 重新貼上金鑰。")
h = h.replace('case "not_granted":', 'case "not_configured": case "not_granted":', 1)

# 5. 標題、手機加到主畫面、版本
h = re.sub(r"<title>[^<]*</title>", "<title>劇場幫幫</title>", h, count=1)
head_extra = f"""<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="劇場幫幫">
<meta name="theme-color" content="#f4f1ea">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon-180.png">
<script>window.TDH_VERSION={json.dumps(VERSION)};</script>
<script>\n{(ROOT/'src/shim.js').read_text()}\n</script>
<script>\n{(ROOT/'src/xlsx.js').read_text()}\n</script>
<script>\n{(ROOT/'src/setup.js').read_text()}\n</script>
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
