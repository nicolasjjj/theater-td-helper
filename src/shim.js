// 劇場TD小幫手｜獨立版的 Notion 連線層
// 把網頁原本透過 Claude 呼叫的 Notion 工具（notion-query-data-sources / notion-fetch / notion-update-page），
// 改成直接呼叫 Notion 官方 API（經過同網域的 /api 轉接站）。網頁本體的程式完全不用改。
(() => {
  const API = "/api/v1";
  const NV = "2022-06-28";
  const LS = "tdh.settings.v1";
  const DB_NAMES = { cases: "劇場の案子", crew: "劇場のCrew", troupe: "劇場の劇團", venue: "劇場の場館" };

  // ---------- 設定 ----------
  const S = {
    load() { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; } },
    save(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {} },
  };
  let cfg = S.load();
  window.__tdh = { get cfg() { return cfg; }, setCfg(v) { cfg = Object.assign({}, cfg, v); S.save(cfg); } };

  // ---------- 呼叫 Notion（限速：Notion 每秒約 3 次） ----------
  let chain = Promise.resolve(), last = 0;
  const gap = 340;
  function nfetch(path, opt = {}, token = cfg.token) {
    const run = async () => {
      const wait = Math.max(0, last + gap - Date.now()); if (wait) await new Promise(r => setTimeout(r, wait));
      last = Date.now();
      let res, tries = 0;
      for (;;) {
        res = await fetch(API + path, {
          method: opt.method || "GET",
          headers: Object.assign({ "Authorization": "Bearer " + token, "Notion-Version": NV }, opt.body ? { "Content-Type": "application/json" } : {}),
          body: opt.body ? JSON.stringify(opt.body) : undefined,
        });
        if (res.status === 429 && tries++ < 4) { await new Promise(r => setTimeout(r, 1000 * tries)); continue; }
        break;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const e = new Error(j.message || ("Notion " + res.status));
        e.code = res.status === 401 ? "needs_reauth" : res.status === 404 ? "not_found" : "tool_error";
        e.status = res.status; throw e;
      }
      return j;
    };
    const p = chain.then(run, run); chain = p.catch(() => {}); return p;
  }
  window.__tdh.nfetch = nfetch;

  const hex = (u) => { const m = String(u || "").replace(/-/g, "").match(/[0-9a-f]{32}/i); return m ? m[0].toLowerCase() : ""; };
  const dashed = (h) => h.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
  const purl = (id) => "https://www.notion.so/" + hex(id);
  const plain = (rt) => (rt || []).map(t => t.plain_text || (t.text && t.text.content) || "").join("");
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // ---------- 資料庫結構（欄位型別） ----------
  const schemas = {};
  async function schemaOf(dbId) {
    if (!schemas[dbId]) schemas[dbId] = nfetch(`/databases/${dbId}`).then(d => d.properties || {});
    return schemas[dbId];
  }

  // ---------- 一列資料 → 原本網頁看得懂的格式 ----------
  function flat(page) {
    const o = { url: purl(page.id) };
    for (const [k, p] of Object.entries(page.properties || {})) {
      switch (p.type) {
        case "title": case "rich_text": o[k] = plain(p[p.type]); break;
        case "number": o[k] = p.number; break;
        case "select": o[k] = p.select ? p.select.name : null; break;
        case "status": o[k] = p.status ? p.status.name : null; break;
        case "multi_select": o[k] = JSON.stringify((p.multi_select || []).map(x => x.name)); break;
        case "relation": o[k] = JSON.stringify((p.relation || []).map(x => purl(x.id))); break;
        case "url": o[k] = p.url; break;
        case "checkbox": o[k] = p.checkbox ? "__YES__" : "__NO__"; break;
        case "date": o[`date:${k}:start`] = p.date ? p.date.start : null; o[`date:${k}:end`] = p.date ? p.date.end : null; break;
        case "formula": { const f = p.formula || {}; o[k] = f[f.type] ?? null; break; }
        default: break;
      }
    }
    return o;
  }

  // ---------- 原本的「檢視」→ 資料庫查詢 ----------
  async function queryView(view) {
    const key = String(view).replace("view://", "").toUpperCase();
    const db = { TD: "cases", NEED: "cases", DONE: "cases", CREW: "crew", TROUPE: "troupe", VENUE: "venue" }[key];
    if (!db) throw Object.assign(new Error("unknown view " + view), { code: "tool_error" });
    const dbId = cfg.db && cfg.db[db];
    if (!dbId) throw Object.assign(new Error("not configured"), { code: "not_configured" });
    const sch = await schemaOf(dbId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
    const and = [], sorts = [];
    const has = (n, t) => sch[n] && (!t || sch[n].type === t);
    if (db === "cases") {
      if (has("職位", "select")) and.push({ property: "職位", select: { equals: "TD" } });
      if (has("進場日期", "date")) {
        if (key === "DONE") { and.push({ property: "進場日期", date: { on_or_before: isoDay(today) } }); sorts.push({ property: "進場日期", direction: "descending" }); }
        else { and.push({ property: "進場日期", date: { on_or_after: isoDay(weekAgo) } }); sorts.push({ property: "進場日期", direction: "ascending" }); }
      }
      if (key === "NEED" && has("Crew 狀態", "multi_select")) and.push({ property: "Crew 狀態", multi_select: { does_not_contain: "全部完成" } });
    }
    const title = Object.keys(sch).find(k => sch[k].type === "title");
    if (db !== "cases" && title) sorts.push({ property: title, direction: "ascending" });
    const body = { page_size: 100 };
    if (and.length) body.filter = and.length === 1 ? and[0] : { and };
    if (sorts.length) body.sorts = sorts;
    const out = []; let cursor = null, g = 0;
    do {
      const r = await nfetch(`/databases/${dbId}/query`, { method: "POST", body: Object.assign({}, body, cursor ? { start_cursor: cursor } : {}) });
      out.push(...(r.results || []).map(flat));
      cursor = r.has_more ? r.next_cursor : null;
    } while (cursor && g++ < 50);
    return { results: out, has_more: false, next_cursor: null };
  }

  // ---------- 頁面內容 → 文字（表格保留成 <table> 格式） ----------
  const escH = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rtHtml = (rt) => (rt || []).map(t => { const s = escH(t.plain_text || "").replace(/\n/g, "<br>"); return t.annotations && t.annotations.bold ? `<b>${s}</b>` : s; }).join("");
  async function children(id) {
    const out = []; let cursor = null, g = 0;
    do {
      const r = await nfetch(`/blocks/${id}/children?page_size=100${cursor ? "&start_cursor=" + cursor : ""}`);
      out.push(...(r.results || [])); cursor = r.has_more ? r.next_cursor : null;
    } while (cursor && g++ < 20);
    return out;
  }
  async function blocksText(id, depth = 0) {
    const lines = [];
    for (const b of await children(id)) {
      const v = b[b.type] || {};
      if (b.type === "table") {
        const rows = await children(b.id);
        lines.push("<table>");
        rows.forEach(r => { if (r.type !== "table_row") return; lines.push(`<tr data-b="${r.id}">`); (r.table_row.cells || []).forEach(c => lines.push(`<td>\n${rtHtml(c)}\n</td>`)); lines.push("</tr>"); });
        lines.push("</table>");
        continue;
      }
      if (v.rich_text) lines.push(`<p>${rtHtml(v.rich_text)}</p>`);   // 用標籤包起來，讓「抬頭：」這類欄位只讀到同一行
      if (b.has_children && depth < 4 && b.type !== "child_page" && b.type !== "child_database") lines.push(await blocksText(b.id, depth + 1));
    }
    return lines.join("\n");
  }

  // ---------- 寫入：屬性 ----------
  async function updateProps(pageId, props) {
    const page = await nfetch(`/pages/${dashed(hex(pageId))}`);
    const dbId = page.parent && page.parent.database_id;
    const sch = dbId ? await schemaOf(dbId) : {};
    const out = {};
    const chunks = (s) => { const a = []; s = String(s ?? ""); for (let i = 0; i < s.length; i += 1900) a.push({ type: "text", text: { content: s.slice(i, i + 1900) } }); return a; };
    for (const [k, v] of Object.entries(props)) {
      const t = (sch[k] || page.properties[k] || {}).type;
      const list = Array.isArray(v) ? v : typeof v === "string" && v.startsWith("[") ? (() => { try { return JSON.parse(v); } catch (e) { return [v]; } })() : v == null ? [] : [v];
      switch (t) {
        case "relation": out[k] = { relation: list.map(u => ({ id: dashed(hex(u)) })).filter(x => x.id.length === 36) }; break;
        case "number": out[k] = { number: v === "" || v == null ? null : Number(v) }; break;
        case "rich_text": out[k] = { rich_text: v == null ? [] : chunks(v) }; break;
        case "title": out[k] = { title: chunks(v) }; break;
        case "url": out[k] = { url: v || null }; break;
        case "select": out[k] = { select: v ? { name: String(v) } : null }; break;
        case "multi_select": out[k] = { multi_select: list.map(n => ({ name: String(n) })) }; break;
        case "checkbox": out[k] = { checkbox: v === true || v === "__YES__" }; break;
        default: break;   // 不認得的欄位略過
      }
    }
    if (Object.keys(out).length) await nfetch(`/pages/${page.id}`, { method: "PATCH", body: { properties: out } });
    return { ok: true };
  }

  // ---------- 寫入：Call Time 表格的某幾列 ----------
  const unescH = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  function cellRich(inner) {
    const s = inner.replace(/^\s*\n|\n\s*$/g, "").replace(/<br\s*\/?>/gi, "\n");
    const out = [];
    for (const m of s.matchAll(/<b>([\s\S]*?)<\/b>|([^<]+|<(?!b>)[^>]*>)/g)) {
      if (m[1] !== undefined) { const t = unescH(m[1].replace(/<[^>]+>/g, "")); if (t) out.push({ type: "text", text: { content: t }, annotations: { bold: true } }); }
      else { const t = unescH((m[2] || "").replace(/<[^>]+>/g, "")); if (t) out.push({ type: "text", text: { content: t } }); }
    }
    return out;
  }
  async function updateContent(updates) {
    const warnings = [];
    for (const u of updates || []) {
      const id = (String(u.old_str).match(/data-b="([^"]+)"/) || [])[1];
      if (!id) { warnings.push("row not found"); continue; }
      const cells = [...String(u.new_str).matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => cellRich(m[1]));
      try { await nfetch(`/blocks/${id}`, { method: "PATCH", body: { table_row: { cells } } }); }
      catch (e) { warnings.push(e.message); }
    }
    return { warnings };
  }

  // ---------- 模仿 Claude 的 MCP 介面 ----------
  const cache = new Map();   // key → {at, value}
  const ckey = (tool, input) => tool + "|" + JSON.stringify(input);
  async function run(server, tool, input) {
    if (server !== "Notion") throw Object.assign(new Error("此功能在獨立版不支援：" + server), { code: "server_not_connected" });
    if (!cfg.token) throw Object.assign(new Error("尚未設定 Notion 金鑰"), { code: "not_configured" });
    if (tool === "notion-query-data-sources") return queryView(input.data && input.data.view_url);
    if (tool === "notion-fetch") return { text: await blocksText(dashed(hex(input.id))) };
    if (tool === "notion-update-page") {
      if (input.command === "update_properties") return updateProps(input.page_id, input.properties || {});
      if (input.command === "update_content") return updateContent(input.content_updates);
    }
    throw Object.assign(new Error("unsupported " + tool), { code: "tool_error" });
  }
  const wrap = (value, at) => ({ payload: value, content: [{ type: "text", text: JSON.stringify(value) }], cache: { storedAt: at } });
  const mcp = {
    async callTool(server, tool, input, opts = {}) {
      const k = ckey(tool, input), c = opts && opts.cache, write = tool === "notion-update-page";
      if (!write && c && !c.refresh) {
        const hit = cache.get(k);
        if (hit && Date.now() - hit.at < (c.staleTime || 0)) return wrap(hit.value, hit.at);
      }
      const value = await run(server, tool, input);
      if (!write) cache.set(k, { at: Date.now(), value });
      return wrap(value, Date.now());
    },
    watchTool(server, tool, input, handler, opts) {
      let live = true;
      mcp.callTool(server, tool, input, opts)
        .then(result => { if (live) handler({ type: "data", result }); })
        .catch(e => { if (live) handler({ type: "error", error: { code: e.code || "tool_error", message: e.message } }); });
      return () => { live = false; };
    },
    async invalidate(server, tool) { for (const k of [...cache.keys()]) if (!tool || k.startsWith(tool + "|")) cache.delete(k); },
  };
  window.claude = { use: async (kind) => (kind === "mcp" ? mcp : null) };

  // ---------- 設定精靈用：找資料庫 ----------
  window.__tdh.findDatabases = async (token) => {
    const found = {}; let cursor = null, g = 0;
    do {
      const r = await nfetch("/search", { method: "POST", body: Object.assign({ filter: { value: "database", property: "object" }, page_size: 100 }, cursor ? { start_cursor: cursor } : {}) }, token);
      for (const d of r.results || []) {
        const name = plain(d.title).trim();
        for (const [k, want] of Object.entries(DB_NAMES)) if (name === want && !found[k]) found[k] = d.id;
      }
      cursor = r.has_more ? r.next_cursor : null;
    } while (cursor && g++ < 10);
    return found;
  };

  // ---------- 設定精靈用：幫新使用者建立四個資料庫＋一個範例案子 ----------
  window.__tdh.listPages = async (token) => {
    const r = await nfetch("/search", { method: "POST", body: { filter: { value: "page", property: "object" }, page_size: 50 } }, token);
    return (r.results || []).filter(p => p.parent && p.parent.type !== "database_id").map(p => {
      const tp = Object.values(p.properties || {}).find(x => x.type === "title");
      return { id: p.id, title: (tp ? plain(tp.title) : "") || "（未命名頁面）" };
    });
  };
  window.__tdh.createDatabases = async (token, parentId, onStep = () => {}) => {
    const T = (s) => [{ type: "text", text: { content: s } }];
    const opts = (names, color = "default") => ({ options: names.map(n => ({ name: n, color })) });
    const mk = async (title, icon, props) => (await nfetch("/databases", { method: "POST", body: { parent: { type: "page_id", page_id: parentId }, icon: { type: "emoji", emoji: icon }, title: T(title), properties: props } }, token)).id;
    onStep("建立「劇場の場館」…");
    const venue = await mk("劇場の場館", "🏛️", { "場館名稱": { title: {} }, "地區": { select: opts(["雙北地區", "桃竹苗地區", "中部地區", "南部地區", "東部地區", "海外地區"]) }, "官方網站": { url: {} }, "技術資料與圖面": { url: {} } });
    onStep("建立「劇場の劇團」…");
    const troupe = await mk("劇場の劇團", "🎭", { "劇團名稱": { title: {} }, "抬頭": { rich_text: {} }, "統編": { rich_text: {} } });
    onStep("建立「劇場のCrew」…");
    const crew = await mk("劇場のCrew", "👷", { "姓名": { title: {} }, "時段費": { number: { format: "number" } }, "時段費紀錄": { rich_text: {} }, "居住地區": { select: opts(["台北", "新北", "桃園", "台中", "台南", "高雄", "其他"]) }, "車號": { rich_text: {} } });
    onStep("建立「劇場の案子」…");
    const st = [["尚未開始", "gray"], ["等待製作確認", "gray"], ["全部完成", "default"]];
    for (let i = 1; i <= 4; i++) st.push([`全程缺${i}`, "blue"]);
    for (let i = 1; i <= 9; i++) st.push([`裝拆缺${i}`, "yellow"]);
    for (let i = 1; i <= 4; i++) st.push([`裝台缺${i}`, "green"]);
    for (let i = 1; i <= 5; i++) st.push([`拆台缺${i}`, "orange"]);
    for (let i = 1; i <= 4; i++) st.push([`裝車缺${i}`, "gray"]);
    for (let i = 1; i <= 3; i++) st.push([`卸車缺${i}`, "purple"]);
    const rel = (db) => ({ relation: { database_id: db, type: "dual_property", dual_property: {} } });
    const cases = await mk("劇場の案子", "🎪", {
      "案名": { title: {} }, "職位": { select: { options: [{ name: "TD", color: "blue" }, { name: "Crew", color: "yellow" }] } },
      "劇團": rel(troupe), "進場日期": { date: {} }, "進場地點": rel(venue), "裝車時間": { date: {} }, "裝車地點": { rich_text: {} },
      "人力分配": { rich_text: {} }, "Crew 狀態": { multi_select: { options: st.map(([name, color]) => ({ name, color })) } },
      "問過的人": rel(crew), "摳的人": rel(crew), "TD姓名": { rich_text: {} }, "TD時段費": { number: { format: "number" } }, "TD整筆費用": { number: { format: "number" } },
      "Crew時段費": { number: { format: "number" } }, "前置": { rich_text: {} }, "前置段數": { number: { format: "number" } }, "打卡": { rich_text: {} },
      "時段表資料夾": { url: {} }, "巡演": { select: { options: [] } },
    });
    // 把另一邊自動產生的關聯欄位改成好懂的名字
    onStep("整理關聯欄位…");
    const cs = (await nfetch(`/databases/${cases}`, {}, token)).properties;
    const renameBack = async (db, prop, name) => {
      const d = cs[prop] && cs[prop].relation && cs[prop].relation.dual_property;
      if (d && d.synced_property_id) await nfetch(`/databases/${db}`, { method: "PATCH", body: { properties: { [d.synced_property_id]: { name } } } }, token).catch(() => {});
    };
    await renameBack(troupe, "劇團", "劇場の案子"); await renameBack(venue, "進場地點", "劇場の案子");
    await renameBack(crew, "問過的人", "問過的案子"); await renameBack(crew, "摳的人", "做過的案子");
    // 範例案子（可以複製這頁當範本）
    onStep("建立範例案子…");
    const today = new Date(), d0 = new Date(today); d0.setDate(today.getDate() + 14);
    const d1 = new Date(d0); d1.setDate(d0.getDate() + 4); const dl = new Date(d0); dl.setDate(d0.getDate() - 1);
    const callout = (s, emoji) => ({ object: "block", type: "callout", callout: { rich_text: [{ type: "text", text: { content: s }, annotations: { bold: true } }], icon: { type: "emoji", emoji }, color: "gray_background" } });
    const row = (a, b) => ({ type: "table_row", table_row: { cells: [[{ type: "text", text: { content: a }, annotations: { bold: true } }], b ? [{ type: "text", text: { content: b } }] : []] } });
    const rows = [row("裝車", "")].concat([1, 2, 3, 4, 5].map(i => row(`Day ${i}`, ""))).concat([row("拆台", ""), row("卸車", "")]);
    await nfetch("/pages", { method: "POST", body: {
      parent: { database_id: cases }, icon: { type: "emoji", emoji: "📋" },
      properties: { "案名": { title: T("（範例）複製這頁當新案子") }, "職位": { select: { name: "TD" } },
        "進場日期": { date: { start: isoDay(d0), end: isoDay(d1) } }, "裝車時間": { date: { start: isoDay(dl) } },
        "人力分配": { rich_text: T("全程2、裝拆2") }, "Crew 狀態": { multi_select: [{ name: "全程缺2" }, { name: "裝拆缺2" }] } },
      children: [
        { object: "block", type: "column_list", column_list: { children: [
          { object: "block", type: "column", column: { children: [callout("抬頭：\n統編：", "🧾"), callout("採購清單", "🛒"), { object: "block", type: "to_do", to_do: { rich_text: [] } }, callout("工具清單", "🔧"), { object: "block", type: "to_do", to_do: { rich_text: [] } }] } },
          { object: "block", type: "column", column: { children: [callout("地址：\n姓名：\n電話：", "✉️"), callout("舞台組人員 Call Time", "⏰"),
            { object: "block", type: "table", table: { table_width: 2, has_column_header: false, has_row_header: false, children: rows } }] } },
        ] } },
      ] } }, token);
    return { cases, crew, troupe, venue };
  };
  window.__tdh.DB_NAMES = DB_NAMES;
})();
