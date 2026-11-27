// 劇場幫幫｜管理畫面：不用打開 Notion 或試算表，就能新增、編輯案子、人員、場館、劇團，以及封存做完的案子
(() => {
  const T = window.__tdh;
  const K = { cases: "案子", crew: "Crew", venue: "場館", troupe: "劇團" };
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const WK = "日一二三四五六";
  const md = (iso) => { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return `${d.getMonth() + 1}/${d.getDate()}(${WK[d.getDay()]})`; };
  const today = () => T.isoDay(new Date());

  const css = `
  .mg{color-scheme:light dark;position:fixed;inset:0;z-index:9000;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;font-family:"Noto Sans TC",-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;-webkit-tap-highlight-color:transparent}
  .mg *{box-sizing:border-box}
  .mg-top{padding:calc(14px + env(safe-area-inset-top)) 14px 0;background:var(--bg)}
  .mg-top>div,.mg-in{max-width:560px;margin:0 auto}
  .mg-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}.mg-row h1{flex:1;font-size:24px;font-weight:700;margin:0}
  .mg-x{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:7px 12px;font:inherit;font-size:13px;cursor:pointer}
  .mg-tabs{display:flex;gap:6px;margin-bottom:12px}.mg-tabs button{flex:1;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:8px 0;font:inherit;font-size:14px;color:var(--muted);cursor:pointer}
  .mg-tabs button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .mg-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:2px 14px calc(96px + env(safe-area-inset-bottom))}
  .mg-search{display:block;width:100%;border:0;border-radius:10px;padding:9px 12px 9px 34px;font:inherit;font-size:16px;color:var(--ink);margin-bottom:10px;outline:none;
    background:color-mix(in srgb,var(--muted) 14%,var(--bg)) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23908a80' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E") no-repeat 11px 50%}
  .mg-sbox{position:relative}.mg-sbox .mg-search{padding-right:36px}
  .mg-clr{position:absolute;right:8px;top:7px;width:22px;height:22px;border-radius:11px;border:0;background:color-mix(in srgb,var(--muted) 45%,var(--bg));color:var(--card);font-size:11px;font-weight:700;line-height:22px;padding:0;cursor:pointer}
  .mg-search::placeholder{color:var(--muted)}
  .mg-sec{font-size:12px;color:var(--muted);margin:16px 2px 8px;font-weight:600;letter-spacing:.02em}
  .mg-in details>summary{list-style:none}.mg-in details>summary::-webkit-details-marker{display:none}
  .mg-in details>summary::before{content:"▸";display:inline-block;width:14px;transition:transform .15s}.mg-in details[open]>summary::before{transform:rotate(90deg)}
  .mg-it{display:block;width:100%;text-align:left;background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:11px 14px;margin-bottom:8px;font:inherit;color:inherit;cursor:pointer}
  .mg-it b{font-size:15px;font-weight:700;display:block}.mg-it small{color:var(--muted);font-size:12px;display:block;margin-top:3px;line-height:1.5}
  .mg-it .tg{display:inline-block;font-size:12px;font-weight:500;border-radius:6px;padding:2px 8px;margin:6px 4px 0 0;background:var(--blue);color:var(--blue-ink)}
  .mg-it .tg.ok{background:var(--sel);color:var(--accent)}.mg-it .tg.w{background:var(--yellow);color:var(--yellow-ink)}
  .mg-add{position:fixed;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:532px;bottom:calc(14px + env(safe-area-inset-bottom));border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font:inherit;font-size:15px;font-weight:700;padding:13px;box-shadow:0 6px 18px rgba(0,0,0,.16);cursor:pointer}
  .mg-empty{background:var(--card);border:1px dashed var(--line);border-radius:14px;text-align:center;color:var(--muted);padding:22px 12px;font-size:14px;line-height:1.7;margin-top:6px}
  .mg-back{border:0;background:none;color:var(--accent);font:inherit;font-size:14px;font-weight:600;padding:4px 0;margin:0 0 6px;cursor:pointer}
  .mg-card{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:6px 14px 14px;margin-bottom:12px}
  .mg-card h3.big{font-size:16px;font-weight:700;color:var(--ink);letter-spacing:0;margin:12px 0 2px}
  .mg-card h3{font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.02em;margin:10px 0 2px}
  .mg-f label{display:block;font-size:12.5px;color:var(--muted);margin:12px 2px 5px}
  .mg-f input,.mg-f select,.mg-f textarea{display:block;width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit;font-size:16px;background:var(--bg);color:var(--ink);outline:none;-webkit-appearance:none;appearance:none}
  .mg-f select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23908a80' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
  .mg-f input:focus,.mg-f select:focus,.mg-f textarea:focus{border-color:var(--accent)}
  .mg-f textarea{min-height:76px;line-height:1.6}
  .mg-f .two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.mg-f .two>div{min-width:0}
  .mg-f input[type=date]{min-width:0;max-width:100%;min-height:44px;text-align:left}
  .mg-f input::-webkit-date-and-time-value{text-align:left}
  .mg-f label.mg-ck{display:flex;align-items:center;gap:8px;margin:14px 2px 0;font-size:14px;color:var(--ink);cursor:pointer}
  .mg-f .mg-ck input[type=checkbox]{width:17px;height:17px;min-height:0;padding:0;margin:0;flex:0 0 17px;border:0;border-radius:4px;accent-color:var(--accent);-webkit-appearance:auto;appearance:auto}
  .mg-lrow{display:flex;align-items:baseline;justify-content:space-between}.mg-lrow label{margin-bottom:5px}
  .mg-mini{border:0;background:none;color:var(--accent);font:inherit;font-size:13px;font-weight:600;padding:0 2px;cursor:pointer}
  .mg-newrow{display:flex;gap:8px;margin-top:8px}.mg-newrow input{flex:1}.mg-newrow button{flex:0 0 auto;border:0;border-radius:10px;padding:0 14px;font:inherit;font-size:14px;font-weight:700;background:var(--accent);color:var(--accent-ink);cursor:pointer}
  .mg-newrow button.ghost{background:transparent;border:1px solid var(--line);color:var(--muted);font-weight:500}
  .mg-tagrow{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed var(--line)}.mg-tagrow:last-child{border-bottom:0}
  .mg-tagrow>span{flex:0 0 34px;font-size:13px;color:var(--muted);padding-top:9px}.mg-tagrow>div{flex:1;display:flex;flex-wrap:wrap;gap:6px}
  .mg-tag{border:1.5px solid var(--line);border-radius:8px;padding:4px 10px;font:inherit;font-size:13px;background:var(--card);color:var(--muted);cursor:pointer}
  .mg-tag.on{color:#fff;font-weight:700}
  .mg-tag.on.c-blue{background:#4a86c5;border-color:#4a86c5}.mg-tag.on.c-yellow{background:#c99412;border-color:#c99412}
  .mg-tag.on.c-green{background:#3f9a5a;border-color:#3f9a5a}.mg-tag.on.c-orange{background:#d9662b;border-color:#d9662b}
  .mg-tag.on.c-gray{background:#7a746b;border-color:#7a746b}.mg-tag.on.c-purple{background:#7a5aa8;border-color:#7a5aa8}
  .mg-tag.on.c-default{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
  .mg a{color:var(--accent)}
  .mg-note{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.6}
  .mg-chip{border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin:8px 6px 0 0;font:inherit;font-size:13px;background:transparent;color:var(--ink);cursor:pointer}
  .mg-tbl .r{display:flex;gap:6px;margin-top:6px}.mg-tbl .r input:first-child{flex:0 0 36%}.mg-tbl .r button{flex:0 0 36px;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:10px;font-size:14px;cursor:pointer}
  .mg-act{display:flex;gap:8px;margin-top:12px}.mg-act button{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
  .mg-act .pri{background:var(--accent);color:var(--accent-ink)}.mg-act .dan{background:transparent;border:1px solid var(--line);color:var(--tdh-dan);font-weight:500}
  .mg-err{color:var(--tdh-dan);font-size:13px;margin-top:8px}
  .mg-sub{display:flex;gap:6px;overflow-x:auto;margin:0 0 6px;padding-bottom:2px;-webkit-overflow-scrolling:touch}
  .mg-sub button{flex:0 0 auto;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}
  .mg-sub button.on{background:var(--sel);border-color:var(--accent);color:var(--accent);font-weight:700}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  let ov, tab = "cases", data = {}, fields = {}, dirty = false, q = "";
  const store = () => T.store();
  const $ = (id) => ov.querySelector("#" + id);

  async function loadKind(k, force) {
    if (!data[k] || force) data[k] = await store().list(k);
    if (!fields[k]) fields[k] = store().fields ? await store().fields(k) : T.SCHEMA[k].fields.map(f => f[0]);
    return data[k];
  }
  const has = (k, name) => (fields[k] || []).includes(name);
  const nameOf = (k, id) => { const r = (data[k] || []).find(x => x.id === id); return r ? r[T.SCHEMA[k].fields[0][0]] : ""; };

  function open(startTab) {
    if (ov) return;
    tab = startTab || "cases"; q = "";
    ov = document.createElement("div"); ov.className = "mg";
    ov.innerHTML = `<div class="mg-top"><div><div class="mg-row"><h1>劇場の資料庫</h1><button class="mg-x" id="mgX">完成</button></div>
      <div class="mg-tabs">${Object.entries(K).map(([k, n]) => `<button data-k="${k}">${n}</button>`).join("")}</div></div>
      </div></div><div class="mg-body" id="mgScroll"><div class="mg-in" id="mgBody"></div></div>`;
    document.body.appendChild(ov);
    document.documentElement.style.overflow = "hidden";
    $("mgX").onclick = close;
    ov.querySelectorAll(".mg-tabs button").forEach(b => b.onclick = () => { tab = b.dataset.k; q = ""; sub = ""; list(); });
    list();
  }
  function close() {
    ov.remove(); ov = null; document.documentElement.style.overflow = "";
    if (dirty) { dirty = false; location.reload(); }
  }
  function busy(msg) { $("mgBody").innerHTML = `<div class="mg-empty">${esc(msg)}</div>`; const a = ov.querySelector(".mg-add"); if (a) a.remove(); }
  function fail(e) { $("mgBody").innerHTML = `<div class="mg-empty">讀取失敗：${esc((e && e.message) || e)}<br><button class="mg-chip" id="mgRetry">再試一次</button></div>`; $("mgRetry").onclick = () => list(true); }

  // ---------- 列表 ----------
  let sub = "";   // Crew：居住地區、場館：地區 的篩選頁籤
  async function list(force) {
    ov.querySelectorAll(".mg-tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === tab));
    const old = ov.querySelector(".mg-add"); if (old) old.remove();
    busy("讀取中…");
    try {
      await loadKind(tab, force);
      if (tab === "cases") await Promise.all([loadKind("venue"), loadKind("troupe")]);
      if (tab === "crew" || tab === "troupe") await loadKind("cases");
    } catch (e) { return fail(e); }
    const k = tab;
    // 搜尋框只建立一次，打字（含注音組字）時只更新下面的結果，不會跳掉
    $("mgBody").innerHTML = `<div class="mg-sbox"><input class="mg-search" id="mgQ" placeholder="搜尋${K[k]}" value="${esc(q)}" autocomplete="off"><button type="button" class="mg-clr" id="mgClr" aria-label="清除" style="${q ? "" : "display:none"}">✕</button></div><div id="mgSubTabs"></div><div id="mgList"></div>`;
    const qi = $("mgQ"); let composing = false;
    const clr = $("mgClr"), syncClr = () => { clr.style.display = qi.value ? "" : "none"; };
    qi.addEventListener("input", syncClr);
    clr.onclick = () => { qi.value = ""; q = ""; syncClr(); results(); qi.focus(); };
    qi.addEventListener("compositionstart", () => { composing = true; });
    qi.addEventListener("compositionend", () => { composing = false; q = qi.value.trim(); results(); });
    qi.addEventListener("input", () => { if (composing) return; q = qi.value.trim(); results(); });
    results();
    const add = document.createElement("button"); add.className = "mg-add"; add.textContent = `＋ 新增${K[k]}`; add.onclick = () => edit(k, null); ov.appendChild(add);
  }
  function results() {
    const k = tab, title = T.SCHEMA[k].fields[0][0], box = $("mgList"); if (!box) return;
    let rows = data[k].filter(r => !q || JSON.stringify(r).includes(q));
    let h = "";
    if (k === "crew" || k === "venue") {   // 地區頁籤
      const key = k === "crew" ? "居住地區" : "地區";
      const areas = [...new Set(data[k].map(r => r[key]).filter(Boolean))];
      const order = (T.SCHEMA[k].fields.find(f => f[0] === key) || [])[2] || [];
      areas.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
      if (sub && !areas.includes(sub) && sub !== "__none") sub = "";
      const none = data[k].some(r => !r[key]);
      $("mgSubTabs").innerHTML = areas.length ? `<div class="mg-sub">${[["", "全部"]].concat(areas.map(a => [a, a])).concat(none ? [["__none", "未分類"]] : []).map(([v, t]) => `<button data-v="${esc(v)}" class="${sub === v ? "on" : ""}">${esc(t)}</button>`).join("")}</div>` : "";
      $("mgSubTabs").querySelectorAll("button").forEach(b => b.onclick = () => { sub = b.dataset.v; results(); });
      if (sub) rows = rows.filter(r => sub === "__none" ? !r[key] : r[key] === sub);
    } else $("mgSubTabs").innerHTML = "";
    if (k === "cases") {
      const t = today();
      const st = (r) => r["進場日期"] ? (r["進場日期"].end || r["進場日期"].start) : "";
      const live = rows.filter(r => !st(r) || st(r) >= t).sort((a, b) => String((a["進場日期"] || {}).start || "9").localeCompare(String((b["進場日期"] || {}).start || "9")));
      const past = rows.filter(r => st(r) && st(r) < t).sort((a, b) => st(b).localeCompare(st(a)));
      const years = [...new Set(past.map(r => st(r).slice(0, 4)))];
      const item = (r) => {
        const d = r["進場日期"], v = (r["進場地點"] || []).map(id => nameOf("venue", id)).filter(Boolean).join("、");
        const need = (r["Crew 狀態"] || []).filter(x => /缺/.test(x));
        const tags = (r["Crew 狀態"] || []).includes("全部完成") ? `<span class="tg ok">人都找齊了</span>` : need.map(x => `<span class="tg w">${esc(x)}</span>`).join("");
        return `<button class="mg-it" data-id="${r.id}"><b>${esc(r["案名"] || "（未命名）")}</b><small>${d ? md(d.start) + (d.end && d.end !== d.start ? " – " + md(d.end) : "") : "還沒填日期"}${v ? "・" + esc(v) : ""}</small>${tags}</button>`;
      };
      if (live.length) h += `<div class="mg-sec">進行中、還沒開始</div>` + live.map(item).join("");
      else if (!past.length) h += `<div class="mg-empty">${q ? "找不到符合的案子" : "還沒有案子，按下面的「＋ 新增案子」。"}</div>`;
      if (past.length) h += `<div class="mg-sec">已經結束</div>` + years.map(y => { const ys = past.filter(r => st(r).startsWith(y)); return `<details ${q ? "open" : ""}><summary class="mg-sec" style="cursor:pointer;font-size:15px;color:var(--ink)">${y} 年（${ys.length}）</summary>${ys.map(item).join("")}</details>`; }).join("");
    } else {
      if (k === "crew") {   // 常出現的人排前面：被排進或問過的案子數
        const freq = {};
        (data.cases || []).forEach(c => new Set([...(c["摳的人"] || []), ...(c["問過的人"] || [])]).forEach(id => { freq[id] = (freq[id] || 0) + 1; }));
        rows.sort((a, b) => (freq[b.id] || 0) - (freq[a.id] || 0) || String(a[title]).localeCompare(String(b[title]), "zh-Hant"));
        rows.forEach(r => { r._n = freq[r.id] || 0; });
      } else if (k === "troupe") {   // 最近合作的劇團排前面（看案子的進場日期）
        const lastAt = {};
        (data.cases || []).forEach(c => { const d = (c["進場日期"] || {}).start || ""; (c["劇團"] || []).forEach(id => { if (d > (lastAt[id] || "")) lastAt[id] = d; }); });
        rows.sort((a, b) => (lastAt[b.id] || "").localeCompare(lastAt[a.id] || "") || String(a[title]).localeCompare(String(b[title]), "zh-Hant"));
      } else rows.sort((a, b) => String(a[title]).localeCompare(String(b[title]), "zh-Hant"));
      h += rows.length ? rows.map(r => {
        const sub2 = k === "crew" ? [r["時段費"] ? "$" + r["時段費"] : "", r["居住地區"], r["電話"], r._n ? `合作 ${r._n} 檔` : ""].filter(Boolean).join("・")
          : k === "venue" ? [r["地區"], r["地址"]].filter(Boolean).join("・") : [r["抬頭"], r["統編"]].filter(Boolean).join("・");
        return `<button class="mg-it" data-id="${r.id}"><b>${esc(r[title] || "（未命名）")}</b>${sub2 ? `<small>${esc(sub2)}</small>` : ""}</button>`;
      }).join("") : `<div class="mg-empty">${q || sub ? "找不到符合的" + K[k] : "還沒有" + K[k] + "，按下面的「＋ 新增" + K[k] + "」。"}</div>`;
    }
    box.innerHTML = h;
    box.querySelectorAll(".mg-it").forEach(b => b.onclick = () => edit(k, b.dataset.id));
  }

  // ---------- 編輯 ----------
  const inp = (id, label, v, extra = "") => `<label for="${id}">${label}</label><input id="${id}" value="${esc(v ?? "")}" ${extra}>`;
  function selectHtml(id, label, opts, v, addLabel) {
    return `<label for="${id}">${label}</label><select id="${id}"><option value="">（不選）</option>${opts.map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("")}${addLabel ? `<option value="__new">＋ ${addLabel}</option>` : ""}</select>`;
  }
  // 下拉選單＋右上角「＋ 新增」：在下面展開一列輸入框，直接建立
  function pickHtml(id, label, kind, opts, v) {
    return `<div class="mg-lrow"><label for="${id}">${label}</label><button type="button" class="mg-mini" data-addfor="${id}" data-kind="${kind}">＋ 新增${K[kind]}</button></div>
      <select id="${id}"><option value="">（不選）</option>${opts.map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("")}</select>
      <div class="mg-newrow" id="${id}_new" style="display:none"><input placeholder="新的${K[kind]}名稱"><button type="button">加入</button><button type="button" class="ghost">取消</button></div>`;
  }
  function bindPick() {
    ov.querySelectorAll("[data-addfor]").forEach(btn => btn.onclick = () => {
      const id = btn.dataset.addfor, kind = btn.dataset.kind, row = $(id + "_new"), input = row.children[0];
      row.style.display = "flex"; input.value = ""; input.focus();
      row.children[2].onclick = () => { row.style.display = "none"; };
      row.children[1].onclick = async () => {
        const name = input.value.trim(); if (!name) { input.focus(); return; }
        row.children[1].disabled = true; row.children[1].textContent = "加入中…";
        try {
          const nid = await store().create(kind, { [T.SCHEMA[kind].fields[0][0]]: name });
          data[kind] = null; await loadKind(kind, true); dirty = true;
          const sel = $(id); sel.insertAdjacentHTML("beforeend", `<option value="${nid}">${esc(name)}</option>`); sel.value = nid;
          row.style.display = "none";
        } catch (e) { alert("新增失敗：" + (e.message || e)); }
        row.children[1].disabled = false; row.children[1].textContent = "加入";
      };
    });
  }
  async function pickNew(sel, kind) {   // 下拉選單選「＋ 新增…」：直接建立一筆
    const name = prompt(`新增${K[kind]}的名稱`);
    if (!name || !name.trim()) { sel.value = ""; return; }
    sel.disabled = true;
    try {
      const id = await store().create(kind, { [T.SCHEMA[kind].fields[0][0]]: name.trim() });
      data[kind] = null; await loadKind(kind, true); dirty = true;
      sel.insertAdjacentHTML("beforeend", `<option value="${id}">${esc(name.trim())}</option>`); sel.value = id;
    } catch (e) { alert("新增失敗：" + (e.message || e)); sel.value = ""; }
    sel.disabled = false;
  }

  async function edit(k, id) {
    const old = ov.querySelector(".mg-add"); if (old) old.remove();
    const r = id ? data[k].find(x => x.id === id) : {};
    const isNew = !id;
    let h = `<button class="mg-back" id="mgBack">‹ ${K[k]}列表</button><div class="mg-f">`;
    if (k === "cases") h += await caseForm(r, isNew);
    else {
      h += `<div class="mg-card">`;
      const HIDE = { venue: ["官方網站", "技術資料與圖面"] };
      for (const [name, type, opts] of T.SCHEMA[k].fields) {
        if (!has(k, name) || type === "content" || (HIDE[k] || []).includes(name) || (isNew && name === "時段費紀錄")) continue;
        const lab = name + (type === "title" ? "（必填）" : "（非必填）");
        const fid = "f_" + name;
        if (type === "select") h += selectHtml(fid, lab, (opts || []).concat(r[name] && !(opts || []).includes(r[name]) ? [r[name]] : []).map(o => [o, o]), r[name] || "");
        else if (name === "時段費紀錄" || name === "備註") h += `<label for="${fid}">${lab}</label><textarea id="${fid}">${esc(r[name] || "")}</textarea>`;
        else h += inp(fid, lab, r[name], type === "number" ? 'inputmode="numeric"' : name === "電話" ? 'inputmode="tel"' : type === "url" ? 'inputmode="url" placeholder="https://"' : "");
      }
      if (k === "troupe") h += `<div class="mg-note">劇團名稱會放在案名前面，當作複製訊息的內容，例如「光點劇場《午後的信》」。</div>`;
      if (!isNew && r["電話"]) h += `<div class="mg-note"><a href="tel:${esc(String(r["電話"]).replace(/[^\d+]/g, ""))}">📞 打電話給 ${esc(r[T.SCHEMA[k].fields[0][0]])}</a></div>`;
      h += `</div>`;
    }
    h += `<div class="mg-err" id="mgErr"></div><div class="mg-act">${isNew ? `<button class="dan" id="mgClear" style="flex:0 0 34%">清除全部</button>` : ""}<button class="pri" id="mgSave">${isNew ? "新增" : "儲存"}</button></div>`;
    if (!isNew) h += `<div class="mg-act"><button class="dan" id="mgDel">刪除</button></div>`;
    h += `</div>`;
    $("mgBody").innerHTML = h; $("mgScroll").scrollTop = 0;
    $("mgBack").onclick = () => list();
    ov.querySelectorAll("select").forEach(s => s.onchange = () => { if (s.value === "__new") pickNew(s, s.dataset.kind); });
    if (k === "cases") { bindCase(r, isNew); bindPick(); }
    $("mgSave").onclick = () => save(k, id, r);
    if ($("mgClear")) $("mgClear").onclick = () => { if (confirm("清除這張表單裡填的所有內容？")) edit(k, null); };
    if ($("mgArc")) $("mgArc").onclick = async () => {
      $("mgArc").disabled = true;
      try { await store().update("cases", id, { "封存": !r["封存"] }); dirty = true; await loadKind("cases", true); list(); }
      catch (e) { $("mgErr").textContent = "失敗：" + (e.message || e); $("mgArc").disabled = false; }
    };
    if ($("mgDel")) $("mgDel").onclick = async () => {
      const nm = r[T.SCHEMA[k].fields[0][0]] || "";
      if (!confirm(`確定要刪除「${nm}」？${T.cfg.mode === "google" ? "刪除後沒辦法復原。" : "會移到 Notion 的垃圾桶，30 天內可以還原。"}${k === "cases" ? "\n\n只是做完了的話，建議用「封存」。" : ""}`)) return;
      $("mgDel").disabled = true;
      try { await store().remove(k, id); dirty = true; await loadKind(k, true); list(); }
      catch (e) { $("mgErr").textContent = "刪除失敗：" + (e.message || e); $("mgDel").disabled = false; }
    };
  }

  // 案子表單
  const NEEDS = () => T.NEED_KINDS.map(x => x[0]);
  async function caseForm(r, isNew) {
    const d = r["進場日期"] || {}, ld = r["裝車時間"] || {};
    const st = r["Crew 狀態"] || [];
    const cnt = (kind) => { const m = st.map(x => x.match(new RegExp("^" + kind + "缺(\\d+)$"))).find(Boolean); return m ? +m[1] : 0; };
    const vOpts = (data.venue || []).map(x => [x.id, x["場館名稱"] || "（未命名）"]).sort((a, b) => a[1].localeCompare(b[1], "zh-Hant"));
    const tOpts = (data.troupe || []).map(x => [x.id, x["劇團名稱"] || "（未命名）"]).sort((a, b) => a[1].localeCompare(b[1], "zh-Hant"));
    let content = null;
    if (!isNew && T.cfg.mode === "google") content = await T.gstore.getContent(r.id);
    let h = `<div class="mg-card"><h3 class="big">基本資料</h3>
      ${inp("c_name", "案名／劇名（必填）", r["案名"], 'placeholder="例如：午後的信"')}
      ${has("cases", "劇團") ? pickHtml("c_troupe", "劇團", "troupe", tOpts, (r["劇團"] || [])[0] || "") : ""}
      <div class="two"><div>${inp("c_s", "進場日期", d.start, 'type="date"')}</div><div>${inp("c_e", "最後一天", d.end || d.start, 'type="date"')}</div></div>
      ${has("cases", "進場地點") ? pickHtml("c_venue", "演出場館", "venue", vOpts, (r["進場地點"] || [])[0] || "") : ""}
      <div class="two"><div>${inp("c_l", "裝車日期（沒有就空白）", ld.start, 'type="date"')}</div><div>${has("cases", "裝車地點") ? inp("c_lp", "裝車地點（沒有就空白）", r["裝車地點"]) : ""}</div></div>
      ${has("cases", "負責人姓名") ? `<label class="mg-ck"><input type="checkbox" id="c_subOn" ${r["負責人姓名"] ? "checked" : ""}>這一檔我請人代班</label>
        <div id="c_subBox" style="${r["負責人姓名"] ? "" : "display:none"}">${inp("c_td", "代班的人是誰", r["負責人姓名"], 'placeholder="例如：王小明"')}</div>` : ""}
      ${has("cases", "巡演") ? `<label class="mg-ck"><input type="checkbox" id="c_tourOn" ${r["巡演"] ? "checked" : ""}>這一檔是巡演</label>
        <div id="c_tourBox" style="${r["巡演"] ? "" : "display:none"}">${inp("c_tour", "巡演名稱（每一站都填一樣的名字，結案時可以合併成一張時段表）", r["巡演"], 'placeholder="例如：2026午後的信"')}</div>` : ""}
      </div>
      <div class="mg-card"><h3 class="big">這檔要找幾個人？</h3>
      ${has("cases", "人力分配") ? inp("c_plan", "人力分配", r["人力分配"], 'placeholder="例如：全程1帶2 / 裝2天+拆台1帶4"') : ""}
      <label>目前還缺幾人？（可複選）</label>
      <div id="c_need">${T.NEED_KINDS.map(([kind, n, col]) => `<div class="mg-tagrow"><span>${kind}</span><div>${Array.from({ length: n }, (_, i) => `${kind}缺${i + 1}`).map(tg => `<button type="button" class="mg-tag c-${col} ${st.includes(tg) ? "on" : ""}" data-tag="${tg}">${tg}</button>`).join("")}</div></div>`).join("")}
        <div class="mg-tagrow"><span>其他</span><div><button type="button" class="mg-tag c-default ${st.includes("全部完成") ? "on" : ""}" data-tag="全部完成">人都找齊了</button><button type="button" class="mg-tag c-gray ${st.includes("等待製作確認") ? "on" : ""}" data-tag="等待製作確認">人數尚未確認</button></div></div></div>
      </div>
      ${isNew ? "" : `      <div class="mg-card"><h3>費用</h3>
      ${inp("c_tdr", "我這一檔的時段費", r["負責人時段費"], 'inputmode="numeric" placeholder="例如：1400"')}
      ${inp("c_flat", "整筆費用（這一檔是談整筆才填寫）", r["負責人整筆費用"], 'inputmode="numeric"')}
      </div>`}`;
    if (isNew) h += `<div class="mg-note" style="margin:0 4px 10px">新增後會自動建立每一天的 Call Time 排班表，之後在主畫面「找人」選人就會填進去。</div>`;
    else if (content) {
      h += `<div class="mg-card"><h3>Call Time 排班表</h3><div class="mg-note">左邊是日期或項目，右邊是排的人（用「、」分開）。主畫面選人時會自動填，這裡可以手動修改。</div>
        <div class="mg-tbl" id="c_tbl">${content.table.map(row => `<div class="r"><input value="${esc(row[0])}"><input value="${esc(row[1] || "")}"><button type="button" title="刪除這列">✕</button></div>`).join("")}</div>
        <button type="button" class="mg-chip" id="c_addRow">＋ 加一列</button> <button type="button" class="mg-chip" id="c_fillDays">補上缺的日期</button>
        <h3 style="margin-top:16px">其他資訊</h3><textarea id="c_notes" placeholder="抬頭：&#10;統編：&#10;地址：">${esc(content.notes.join("\n"))}</textarea>
        <div class="mg-note">「抬頭：」「統編：」會用在截圖的抬頭統編卡片。</div></div>`;
    } else if (!isNew) h += `<div class="mg-note" style="margin:0 4px 10px">Call Time 排班表在這個案子的 Notion 頁面裡。</div>`;
    return h;
  }
  function bindCase(r, isNew) {
    ov.querySelectorAll("#c_need .mg-tag").forEach(b => b.onclick = () => b.classList.toggle("on"));
    [["c_subOn", "c_subBox", "c_td"], ["c_tourOn", "c_tourBox", "c_tour"]].forEach(([ck, box, input]) => { if ($(ck)) $(ck).onchange = () => { $(box).style.display = $(ck).checked ? "" : "none"; if ($(ck).checked) $(input).focus(); }; });
    $("c_s").onchange = () => { if (!$("c_e").value || $("c_e").value < $("c_s").value) $("c_e").value = $("c_s").value; };
    const tbl = $("c_tbl");
    if (tbl) {
      const bindDel = () => tbl.querySelectorAll("button").forEach(b => b.onclick = () => b.parentNode.remove());
      bindDel();
      $("c_addRow").onclick = () => { tbl.insertAdjacentHTML("beforeend", `<div class="r"><input placeholder="例如 12/20 (六)"><input placeholder="人名"><button type="button">✕</button></div>`); bindDel(); };
      $("c_fillDays").onclick = () => {
        const have = new Set([...tbl.querySelectorAll(".r")].map(x => x.children[0].value.replace(/\s*\(.*$/, "").trim()));
        T.callRows($("c_s").value, $("c_e").value, $("c_l").value).forEach(([label]) => {
          if (have.has(label.replace(/\s*\(.*$/, "").trim())) return;
          tbl.insertAdjacentHTML("beforeend", `<div class="r"><input value="${esc(label)}"><input><button type="button">✕</button></div>`);
        });
        bindDel();
      };
    }
  }
  const num = (v) => { const t = String(v || "").replace(/[,\s$]/g, ""); return t === "" || isNaN(+t) ? null : +t; };

  async function save(k, id, r) {
    const btn = $("mgSave"), errEl = $("mgErr"); errEl.textContent = "";
    const vals = {}; let content = null;
    if (k === "cases") {
      const name = $("c_name").value.trim(); if (!name) { errEl.textContent = "請填案名"; return; }
      const s = $("c_s").value, e = $("c_e").value || s, l = $("c_l").value;
      if (!s) { errEl.textContent = "請填進場日期"; return; }
      Object.assign(vals, { "案名": name, "進場日期": { start: s, end: e > s ? e : null }, "裝車時間": l ? { start: l } : null });
      if ($("c_troupe")) vals["劇團"] = $("c_troupe").value && $("c_troupe").value !== "__new" ? [$("c_troupe").value] : [];
      if ($("c_venue")) vals["進場地點"] = $("c_venue").value && $("c_venue").value !== "__new" ? [$("c_venue").value] : [];
      if ($("c_lp")) vals["裝車地點"] = $("c_lp").value.trim();
      if ($("c_plan")) vals["人力分配"] = $("c_plan").value.trim();
      if ($("c_tour")) vals["巡演"] = $("c_tourOn").checked ? ($("c_tour").value.trim() || null) : null;
      if (!id) vals["職位"] = "負責人";
      const tags = [...ov.querySelectorAll("#c_need .mg-tag.on")].map(b => b.dataset.tag);
      if (!tags.length) tags.push("尚未開始");
      vals["Crew 狀態"] = tags;
      if ($("c_tdr")) { vals["負責人時段費"] = num($("c_tdr").value); vals["負責人整筆費用"] = num($("c_flat").value); }
      if ($("c_td")) vals["負責人姓名"] = $("c_subOn").checked ? ($("c_td").value.trim() || null) : null;
      if (!id) content = { notes: ["抬頭：", "統編："], table: T.callRows(s, e > s ? e : s, l) };
      else if ($("c_tbl")) content = { notes: $("c_notes").value.split("\n"), table: [...$("c_tbl").querySelectorAll(".r")].map(x => [x.children[0].value.trim(), x.children[1].value.trim()]).filter(x => x[0] || x[1]) };
    } else {
      for (const [name, type] of T.SCHEMA[k].fields) {
        const el = $("f_" + name); if (!el) continue;
        vals[name] = type === "number" ? num(el.value) : el.value.trim();
      }
      const tf = T.SCHEMA[k].fields[0][0];
      if (!vals[tf]) { errEl.textContent = `請填${tf}`; return; }
    }
    // Notion：自訂的單選值（例如巡演名稱）會自動新增選項；沒有的欄位略過
    btn.disabled = true; btn.textContent = "儲存中…";
    try {
      if (id) { await store().update(k, id, vals); if (content && T.cfg.mode === "google") await store().update(k, id, { "內容": content }); }
      else await store().create(k, vals, k === "cases" ? content : null);
      dirty = true;
      await loadKind(k, true);
      list();
    } catch (e) { errEl.textContent = "儲存失敗：" + ((e && e.message) || e); btn.disabled = false; btn.textContent = id ? "儲存" : "新增"; }
  }

  T.openManage = open;
  document.addEventListener("DOMContentLoaded", () => {
    const modes = document.querySelector(".modes");
    const b = document.createElement("button"); b.className = "mg-btn"; b.textContent = "☰"; b.title = "管理案子、人員、場館、劇團"; b.setAttribute("aria-label", "管理");
    b.onclick = () => open();
    const tools = document.querySelector(".tdh-tools");
    if (tools) tools.insertBefore(b, tools.firstChild); else { b.style.cssText = "position:fixed;right:52px;top:10px;z-index:50"; document.body.appendChild(b); }
  });
})();
