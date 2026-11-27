// 劇場幫幫｜用 Google 試算表當資料庫（給不用 Notion 的人）
// 資料放在使用者自己的雲端硬碟「劇場幫幫 / 劇場幫幫資料」：分頁「案子、人員、場館、劇團」，第一列是欄位名稱，A 欄是 id。
// 對網頁本體提供和 Notion 版一樣的格式（view 查詢、頁面內文、更新欄位、更新 Call Time 表格）。
(() => {
  const T = window.__tdh, S = T.SCHEMA;
  const KINDS = ["cases", "crew", "venue", "troupe"];
  const DATA_NAME = "劇場幫幫資料";
  const SS = (id) => `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
  const err = (code, message) => Object.assign(new Error(message), { code });
  const U = (id) => "app://" + id;
  const idOf = (u) => { const m = String(u || "").replace(/-/g, "").match(/[0-9a-f]{32}/i); return m ? m[0].toLowerCase() : ""; };
  const typeOf = (kind, name) => { const f = S[kind].fields.find(x => x[0] === name); return f ? f[1] : null; };
  const colL = (n) => { let s = ""; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

  // ---------- 找到或建立資料試算表 ----------
  async function ensure(onStep = () => {}) {
    const G = T.google;
    if (T.cfg.gData && await G.fileOk(T.cfg.gData)) { await fixHeaders(T.cfg.gData); return T.cfg.gData; }
    onStep("在你的雲端硬碟找「劇場幫幫資料」…");
    const q = `name = '${DATA_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const r = await G.api("https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({ q, fields: "files(id,name,createdTime)", orderBy: "createdTime", pageSize: "5" }));
    if (r.files && r.files[0]) { T.setCfg({ gData: r.files[0].id }); await fixHeaders(r.files[0].id); return r.files[0].id; }
    onStep("建立「劇場幫幫」資料夾…");
    const root = await G.rootFolder();
    onStep("建立「劇場幫幫資料」試算表…");
    const f = await G.api("https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", body: { name: DATA_NAME, mimeType: "application/vnd.google-apps.spreadsheet", parents: [root] } });
    const id = f.id;
    const meta = await G.api(`${SS(id)}?fields=sheets.properties.sheetId`);
    const first = ((meta.sheets || [])[0] || { properties: { sheetId: 0 } }).properties.sheetId || 0;
    const sid = { cases: first, crew: 101, venue: 102, troupe: 103 };
    const reqs = [{ updateSheetProperties: { properties: { sheetId: first, title: S.cases.tab }, fields: "title" } }];
    ["crew", "venue", "troupe"].forEach((k, i) => reqs.push({ addSheet: { properties: { sheetId: sid[k], title: S[k].tab, index: i + 1 } } }));
    KINDS.forEach(k => reqs.push(
      { updateSheetProperties: { properties: { sheetId: sid[k], gridProperties: { frozenRowCount: 1, frozenColumnCount: 2 } }, fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount" } },
      { repeatCell: { range: { sheetId: sid[k], startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColorStyle: { rgbColor: { red: 0.93, green: 0.96, blue: 0.95 } } } }, fields: "userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColorStyle" } },
      { updateDimensionProperties: { range: { sheetId: sid[k], dimension: "COLUMNS", startIndex: 0, endIndex: 1 }, properties: { hiddenByUser: true }, fields: "hiddenByUser" } }));
    onStep("建立分頁…");
    await G.api(`${SS(id)}:batchUpdate`, { method: "POST", body: { requests: reqs } });
    await G.api(`${SS(id)}/values:batchUpdate`, { method: "POST", body: { valueInputOption: "RAW", data: KINDS.map(k => ({ range: `'${S[k].tab}'!A1`, values: [["id"].concat(S[k].fields.map(f => f[0]))] })) } });
    T.setCfg({ gData: id });
    cache = null;
    onStep("建立範例案子…");
    const today = new Date(), d0 = new Date(today); d0.setDate(today.getDate() + 14);
    const d1 = new Date(d0); d1.setDate(d0.getDate() + 4); const dl = new Date(d0); dl.setDate(d0.getDate() - 1);
    const st = T.isoDay(d0), en = T.isoDay(d1), ld = T.isoDay(dl);
    await create("cases", { "案名": "（範例）可以刪掉或改成你的案子", "職位": "負責人", "進場日期": { start: st, end: en }, "裝車時間": { start: ld },
      "人力分配": "全程2、裝拆2", "Crew 狀態": ["全程缺2", "裝拆缺2"] }, { notes: ["抬頭：", "統編："], table: T.callRows(st, en, ld) });
    return id;
  }
  // 舊的資料表少了新欄位 → 自動補在最右邊
  async function fixHeaders(id) {
    const r = await T.google.api(`${SS(id)}/values:batchGet?` + KINDS.map(k => "ranges=" + encodeURIComponent(`'${S[k].tab}'!1:1`)).join("&"));
    const data = [];
    KINDS.forEach((k, i) => {
      const head = ((r.valueRanges[i] || {}).values || [[]])[0] || [];
      const miss = ["id"].concat(S[k].fields.map(f => f[0])).filter(n => !head.includes(n));
      if (miss.length) data.push({ range: `'${S[k].tab}'!${colL(head.length)}1`, values: [miss] });
    });
    if (data.length) await T.google.api(`${SS(id)}/values:batchUpdate`, { method: "POST", body: { valueInputOption: "RAW", data } });
  }

  // ---------- 讀取（快取 15 秒，寫入時同步更新快取） ----------
  let cache = null, loading = null;
  // 沒有要求重新讀取時：先用記憶體，再用手機裡的快照（打開 app 不用等）；寫入一定先讀最新
  function drop() { cache = null; T.snap.drop(k => k === "g:data"); }
  async function load(force) {
    if (!force && cache) return cache;
    if (!force && !cache && !loading) { const sv = T.snap.get("g:data"); if (sv) { cache = build(sv.r, sv.at); cache.snap = true; return cache; } }
    if (loading) return loading;
    loading = (async () => {
      const id = T.cfg.gData; if (!id) throw err("not_configured", "還沒設定資料");
      const r = await T.google.api(`${SS(id)}/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&` + KINDS.map(k => "ranges=" + encodeURIComponent(`'${S[k].tab}'!A1:AZ5000`)).join("&"));
      T.snap.set("g:data", { at: Date.now(), r });
      cache = build(r, Date.now()); return cache;
    })().finally(() => { loading = null; });
    return loading;
  }
  const loadW = () => load(!cache || !!cache.snap);
  function build(r, at) {
    {
      const c = { at, byId: {} };
      KINDS.forEach((k, i) => {
        const vals = (r.valueRanges[i] || {}).values || [];
        const head = vals[0] || [];
        const rows = [];
        for (let j = 1; j < vals.length; j++) {
          const v = vals[j], rid = String(v[0] || "").trim();
          if (!rid) continue;
          const o = {}; head.forEach((h, x) => { if (h && h !== "id") o[h] = v[x] === undefined ? "" : v[x]; });
          const rec = { id: rid, kind: k, row: j + 1, v: o };
          rows.push(rec); c.byId[rid] = rec;
        }
        c[k] = { head, rows };
      });
      return c;
    }
  }

  // ---------- 一列資料 → 網頁本體看得懂的格式（和 Notion 版相同） ----------
  const splitIds = (s) => String(s || "").split(/[,\s]+/).map(x => x.trim()).filter(Boolean);
  const splitList = (s) => { const t = String(s || "").trim(); if (!t) return []; if (t.startsWith("[")) { try { return JSON.parse(t); } catch (e) {} } return t.split(/\s*[、,]\s*/).filter(Boolean); };
  const dateParts = (s) => { const t = String(s || "").trim(); if (!t) return [null, null]; const m = t.split(/\s*[~～]\s*/); return [m[0] || null, m[1] || null]; };
  function flat(rec) {
    const o = { url: U(rec.id) };
    for (const [name, type] of S[rec.kind].fields) {
      const k = T.ALIAS[name] || name, v = rec.v[name];
      if (type === "content") continue;
      if (type === "number") o[k] = v === "" || v === undefined || isNaN(+v) ? null : +v;
      else if (type === "multi") o[k] = JSON.stringify(splitList(v));
      else if (type.startsWith("rel:")) o[k] = JSON.stringify(splitIds(v).map(U));
      else if (type === "date") { const [a, b] = dateParts(v); o[`date:${k}:start`] = a; o[`date:${k}:end`] = b; }
      else if (type === "checkbox") o[k] = v === true || String(v).toUpperCase() === "TRUE" ? "__YES__" : "__NO__";
      else if (type === "select") o[k] = k === "職位" && T.LEAD.includes(v) ? "TD" : (v === "" ? null : String(v));
      else o[k] = v === undefined ? "" : String(v);
    }
    return o;
  }
  // 給管理畫面：每個欄位的原始值（日期 {start,end}、關聯 id 陣列、多選陣列）
  function raw(rec) {
    const o = { id: rec.id };
    for (const [name, type] of S[rec.kind].fields) {
      const v = rec.v[name];
      if (type === "content") continue;
      if (type === "number") o[name] = v === "" || v === undefined || isNaN(+v) ? null : +v;
      else if (type === "multi") o[name] = splitList(v);
      else if (type.startsWith("rel:")) o[name] = splitIds(v);
      else if (type === "date") { const [a, b] = dateParts(v); o[name] = a ? { start: a, end: b } : null; }
      else if (type === "checkbox") o[name] = v === true || String(v).toUpperCase() === "TRUE";
      else o[name] = v === undefined ? "" : String(v);
    }
    return o;
  }

  const isoDay = T.isoDay;
  async function queryView(view) {
    const key = String(view).replace("view://", "").toUpperCase();
    const kind = { TD: "cases", NEED: "cases", DONE: "cases", CREW: "crew", TROUPE: "troupe", VENUE: "venue" }[key];
    if (!kind) throw err("tool_error", "unknown view " + view);
    const c = await load();
    let rows = c[kind].rows.slice();
    if (kind === "cases") {
      const today = isoDay(new Date()), wa = new Date(); wa.setDate(wa.getDate() - 7); const weekAgo = isoDay(wa);
      rows = rows.filter(r => { const v = raw(r); return !v["封存"] && (!v["職位"] || T.LEAD.includes(v["職位"])) && v["進場日期"]; });
      if (key === "DONE") rows = rows.filter(r => raw(r)["進場日期"].start <= today).sort((a, b) => raw(b)["進場日期"].start.localeCompare(raw(a)["進場日期"].start));
      else rows = rows.filter(r => raw(r)["進場日期"].start >= weekAgo).sort((a, b) => raw(a)["進場日期"].start.localeCompare(raw(b)["進場日期"].start));
      if (key === "NEED") rows = rows.filter(r => !raw(r)["Crew 狀態"].includes("全部完成"));
    } else {
      const t = S[kind].fields[0][0];
      rows.sort((a, b) => String(a.v[t]).localeCompare(String(b.v[t]), "zh-Hant"));
    }
    return { results: rows.map(flat), has_more: false, next_cursor: null };
  }

  // ---------- 內文：備註文字＋Call Time 表格 ----------
  const escH = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const unescH = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const contentOf = (rec) => { try { const j = JSON.parse(rec.v["內容"] || "{}"); return { notes: j.notes || [], table: j.table || [] }; } catch (e) { return { notes: [], table: [] }; } };
  async function fetchText(id) {
    const c = await load(), rec = c.byId[idOf(id)];
    if (!rec) throw err("not_found", "找不到這個案子");
    const ct = contentOf(rec);
    const lines = ct.notes.map(n => `<p>${escH(n).replace(/\n/g, "<br>")}</p>`);
    if (ct.table.length) {
      lines.push(`<p><b>${window.TEAM ? window.TEAM() : "舞台組"}人員 Call Time</b></p>`, "<table>");
      ct.table.forEach((r, i) => { lines.push(`<tr data-b="ROW${i}">`); r.forEach((cell, j) => lines.push(`<td>\n${j === 0 ? "<b>" + escH(cell) + "</b>" : escH(cell).replace(/\n/g, "<br>")}\n</td>`)); lines.push("</tr>"); });
      lines.push("</table>");
    }
    return lines.join("\n");
  }
  async function updateContent(pageId, updates) {
    const c = await load(true), rec = c.byId[idOf(pageId)];
    if (!rec) throw err("not_found", "找不到這個案子");
    const ct = contentOf(rec), warnings = [];
    for (const u of updates || []) {
      const i = +((String(u.old_str).match(/data-b="ROW(\d+)"/) || [])[1]);
      if (isNaN(i) || !ct.table[i]) { warnings.push("row not found"); continue; }
      ct.table[i] = [...String(u.new_str).matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => unescH(m[1].replace(/^\s*\n|\n\s*$/g, "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).trim());
    }
    await writeFields(rec, { "內容": JSON.stringify(ct) });
    return { warnings };
  }

  // ---------- 寫入 ----------
  function cellOf(kind, name, v) {
    const type = typeOf(kind, name) || "text";
    if (v === null || v === undefined) return "";
    if (type === "number") return v === "" || isNaN(+v) ? "" : +v;
    if (type === "multi") { const a = Array.isArray(v) ? v : (() => { try { return JSON.parse(v); } catch (e) { return [v]; } })(); return a.join("、"); }
    if (type.startsWith("rel:")) { const a = Array.isArray(v) ? v : typeof v === "string" && v.startsWith("[") ? JSON.parse(v) : [v]; return a.map(idOf).filter(Boolean).join(","); }
    if (type === "date") return typeof v === "string" ? v : v.start ? v.start + (v.end && v.end !== v.start ? "~" + v.end : "") : "";
    if (type === "checkbox") return v === true || v === "__YES__";
    if (type === "content") return typeof v === "string" ? v : JSON.stringify(v);
    return String(v);
  }
  async function writeFields(rec, vals) {
    const c = cache || await load(), tab = S[rec.kind].tab, head = c[rec.kind].head;
    const data = [];
    for (const [name, v] of Object.entries(vals)) {
      const col = head.indexOf(name); if (col < 0) continue;
      const cell = cellOf(rec.kind, name, v);
      rec.v[name] = cell;
      data.push({ range: `'${tab}'!${colL(col)}${rec.row}`, values: [[cell]] });
    }
    if (data.length) await T.google.api(`${SS(T.cfg.gData)}/values:batchUpdate`, { method: "POST", body: { valueInputOption: "RAW", data } });
    T.snap.drop(k => k === "g:data");
  }
  async function updateProps(pageId, props) {
    const c = await loadW(), rec = c.byId[idOf(pageId)];
    if (!rec) throw err("not_found", "找不到這筆資料");
    const vals = {};
    for (const [k, v] of Object.entries(props)) vals[T.BACK[k] || k] = v;
    await writeFields(rec, vals);
    return { ok: true };
  }
  async function create(kind, props, content) {
    const c = await load(true), tab = S[kind].tab, head = c[kind].head;
    const id = T.hex32(), row = head.map(h => h === "id" ? id : h === "內容" && content ? JSON.stringify(content) : props[h] !== undefined ? cellOf(kind, h, props[h]) : "");
    const r = await T.google.api(`${SS(T.cfg.gData)}/values/${encodeURIComponent(`'${tab}'!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: "POST", body: { values: [row] } });
    const m = String((r.updates || {}).updatedRange || "").match(/(\d+)(?::[A-Z]+\d+)?$/);
    const rec = { id, kind, row: m ? +m[1] : c[kind].rows.length + 2, v: Object.fromEntries(head.map((h, i) => [h, row[i]])) };
    c[kind].rows.push(rec); c.byId[id] = rec; T.snap.drop(k => k === "g:data");
    return id;
  }
  async function remove(kind, id) {
    const c = await load(true), rec = c.byId[idOf(id)]; if (!rec) return;
    const meta = await T.google.api(`${SS(T.cfg.gData)}?fields=sheets.properties`);
    const sh = (meta.sheets || []).find(s => s.properties.title === S[kind].tab);
    await T.google.api(`${SS(T.cfg.gData)}:batchUpdate`, { method: "POST", body: { requests: [{ deleteDimension: { range: { sheetId: sh.properties.sheetId, dimension: "ROWS", startIndex: rec.row - 1, endIndex: rec.row } } }] } });
    drop();
  }

  T.gstore = {
    ensure, load, queryView, fetchText, updateContent, updateProps, create, remove,
    async list(kind, fresh) { const c = await load(!!fresh); return c[kind].rows.map(raw); },
    async update(kind, id, vals) { const c = await loadW(); const rec = c.byId[idOf(id)]; if (!rec) throw err("not_found", "找不到這筆資料"); await writeFields(rec, vals); },
    async getContent(id) { const c = await load(); const rec = c.byId[idOf(id)]; return rec ? contentOf(rec) : { notes: [], table: [] }; },
    url: () => T.cfg.gData ? `https://docs.google.com/spreadsheets/d/${T.cfg.gData}/edit` : "",
    invalidate() { drop(); },
  };
})();
