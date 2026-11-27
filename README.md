# 劇場幫幫（獨立版）

給劇場 TD 用的手機網頁：找 Crew、記錄名單、每日打卡算時段、截圖分享、一鍵產生 Excel 時段表。
資料存在每個使用者自己的 Notion，網站本身不存任何資料。

## 結構
- `src/shim.js`：Notion 連線層（取代 Claude 版的連接器呼叫，直接用 Notion 官方 API）
- `src/xlsx.js`：產生 Excel 時段表（不需外部套件）
- `src/setup.js`：第一次設定（貼金鑰、找/建立資料庫、預設 TD）
- `build.py`：把 Claude 版網頁轉成獨立版 → `dist/`
- `worker/worker.js`：Cloudflare Worker，提供網頁並把 `/api/v1/*` 轉送到 api.notion.com
- `tests/`：模擬 Notion API 的自動測試

## 部署
Cloudflare Workers（免費方案）連接這個 GitHub repo，build 指令留空，部署設定讀 `wrangler.toml`。
`dist/` 已經 commit 在 repo 裡，不需要在 Cloudflare 上跑 build。
