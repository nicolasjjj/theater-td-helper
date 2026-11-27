// 劇場幫幫｜管理畫面：不用打開 Notion 或試算表，就能新增、編輯案子、人員、場館、劇團，以及封存做完的案子
(() => {
  const T = window.__tdh;
  const K = { cases: "案子", crew: "人員", venue: "場館", troupe: "劇團" };
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const WK = "日一二三四五六";
  const md = (iso) => { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return `${d.getMonth() + 1}/${d.getDate()}(${WK[d.getDay()]})`; };
  const today = () => T.isoDay(new Date());

  const css = `
  .mg{position:fixed;inset:0;z-index:9000;background:#f4f1ea;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif;color:#1d1b18}
  .mg-top{padding:calc(12px + env(safe-area-inset-top)) 16px 8px;background:#f4f1ea;border-bottom:1px solid #e6e1d8}
  .mg-row{display:flex;align-items:center;gap:8px}.mg-row h1{flex:1;font-size:20px;margin:0}
  .mg-x{border:0;background:#ece8df;border-radius:999px;width:36px;height:36px;font-size:18px;cursor:pointer}
  .mg-tabs{display:flex;gap:6px;margin-top:10px}.mg-tabs button{flex:1;border:1px solid #e6e1d8;background:#fff;border-radius:999px;padding:8px 0;font:inherit;font-size:15px;color:#6e685f;cursor:pointer}
  .mg-tabs button.on{background:#1f1d1a;color:#fff;border-color:#1f1d1a;font-weight:700}
  .mg-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px 14px calc(90px + env(safe-area-inset-bottom))}
  .mg-search{width:100%;box-sizing:border-box;border:1.5px solid #e6e1d8;border-radius:12px;padding:10px 12px;font-size:16px;background:#fff;margin-bottom:10px}
  .mg-sec{font-size:13px;color:#7a746b;margin:14px 4px 6px;font-weight:600}
  .mg-it{display:block;width:100%;text-align:left;background:#fff;border:1.5px solid #e6e1d8;border-radius:14px;padding:11px 14px;margin-bottom:8px;font:inherit;color:inherit;cursor:pointer}
  .mg-it b{font-size:16px;display:block}.mg-it small{color:#7a746b;font-size:13px;display:block;margin-top:2px;line-height:1.5}
  .mg-it .tg{display:inline-block;font-size:12px;border-radius:6px;padding:1px 7px;margin:4px 4px 0 0;background:#e3ecf7;color:#2c5282}
  .mg-it .tg.ok{background:#eef8f2;color:#23784b}.mg-it .tg.w{background:#fff4e5;color:#b25d00}
  .mg-add{position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));border:0;border-radius:14px;background:#2f5d50;color:#fff;font:inherit;font-size:17px;font-weight:700;padding:14px;box-shadow:0 4px 14px rgba(0,0,0,.18);cursor:pointer}
  .mg-empty{text-align:center;color:#7a746b;padding:30px 10px;font-size:14px;line-height:1.7}
  .mg-f label{display:block;font-size:13px;color:#6e685f;margin:12px 2px 4px}
  .mg-f input,.mg-f select,.mg-f textarea{width:100%;box-sizing:border-box;border:1.5px solid #ddd7cc;border-radius:12px;padding:11px 12px;font:inherit;font-size:16px;background:#fff;color:#1d1b18}
  .mg-f textarea{min-height:72px}
  .mg-f .two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.mg-f .two>div{min-width:0}
  .mg-f input[type=date]{-webkit-appearance:none;appearance:none;min-width:0;max-width:100%;display:block;min-height:46px;text-align:left}
  .mg-f input::-webkit-date-and-time-value{text-align:left}
  .mg-ck{display:flex;align-items:center;gap:10px;margin:14px 2px 0;font-size:15px;cursor:pointer}.mg-ck input{width:20px;height:20px;margin:0;flex:0 0 20px;accent-color:#2f5d50}
  .mg-tagrow{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #ece8df}.mg-tagrow:last-child{border-bottom:0}
  .mg-tagrow>span{flex:0 0 40px;font-size:14px;color:#6e685f;padding-top:12px}.mg-tagrow>div{flex:1}
  .mg-tag{display:inline-block;border:1.5px solid #ddd7cc;border-radius:8px;padding:5px 10px;margin:6px 6px 0 0;font:inherit;font-size:14px;background:#fff;color:#6e685f;cursor:pointer}
  .mg-tag.on{font-weight:700}
  .mg-tag.on.c-blue{background:#e3ecf7;border-color:#9db8dc;color:#2c5282}.mg-tag.on.c-yellow{background:#fbf1d6;border-color:#e2c674;color:#7a5a00}
  .mg-tag.on.c-green{background:#e4f2e8;border-color:#93c8a3;color:#23784b}.mg-tag.on.c-orange{background:#fbe8d8;border-color:#e6aa75;color:#9a4f0f}
  .mg-tag.on.c-gray{background:#ecebe8;border-color:#bdb8ae;color:#4a463f}.mg-tag.on.c-purple{background:#efe6f6;border-color:#c0a3d8;color:#5f3d82}
  .mg-tag.on.c-default{background:#2f5d50;border-color:#2f5d50;color:#fff}
  .mg-card{background:#fff;border:1.5px solid #e6e1d8;border-radius:16px;padding:4px 14px 14px;margin-bottom:12px}
  .mg-card h3{font-size:15px;margin:12px 0 0}
  .mg-note{font-size:12.5px;color:#7a746b;margin-top:6px;line-height:1.6}
  .mg-step{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px dashed #ece8df;font-size:15px}
  .mg-step:last-child{border-bottom:0}.mg-step span{display:flex;align-items:center;gap:10px}
  .mg-step button{width:34px;height:34px;border-radius:10px;border:1.5px solid #ddd7cc;background:#fbfaf7;font-size:18px;cursor:pointer}
  .mg-step b{min-width:22px;text-align:center;font-size:17px}
  .mg-chip{display:inline-block;border:1.5px solid #ddd7cc;border-radius:999px;padding:7px 13px;margin:6px 6px 0 0;font:inherit;font-size:14px;background:#fff;cursor:pointer}
  .mg-chip.on{background:#2f5d50;border-color:#2f5d50;color:#fff}
  .mg-tbl .r{display:flex;gap:6px;margin-top:6px}.mg-tbl .r input:first-child{flex:0 0 38%}.mg-tbl .r button{flex:0 0 38px;border:0;background:#f3efe7;border-radius:10px;font-size:16px;cursor:pointer}
  .mg-act{display:flex;gap:8px;margin-top:14px}.mg-act button{flex:1;border:0;border-radius:12px;padding:13px;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
  .mg-act .pri{background:#2f5d50;color:#fff}.mg-act .sec{background:#ece8df;color:#1d1b18}.mg-act .dan{background:#fdecea;color:#b3261e}
  .mg-err{color:#b3261e;font-size:14px;margin-top:8px}
  .mg-btn{border:0;background:transparent;font-size:23px;line-height:1;color:#6e685f;cursor:pointer;border-radius:9px;flex:0 0 44px}
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
    ov.innerHTML = `<div class="mg-top"><div class="mg-row"><h1>劇場の資料庫</h1><button class="mg-x" id="mgX" aria-label="關閉">✕</button></div>
      <div class="mg-tabs">${Object.entries(K).map(([k, n]) => `<button data-k="${k}">${n}</button>`).join("")}</div></div>
      <div class="mg-body" id="mgBody"></div>`;
    document.body.appendChild(ov);
    document.documentElement.style.overflow = "hidden";
    $("mgX").onclick = close;
    ov.querySelectorAll(".mg-tabs button").forEach(b => b.onclick = () => { tab = b.dataset.k; q = ""; list(); });
    list();
  }
  function close() {
    ov.remove(); ov = null; document.documentElement.style.overflow = "";
    if (dirty) { dirty = false; location.reload(); }
  }
  function busy(msg) { $("mgBody").innerHTML = `<div class="mg-empty">${esc(msg)}</div>`; const a = ov.querySelector(".mg-add"); if (a) a.remove(); }
  function fail(e) { $("mgBody").innerHTML = `<div class="mg-empty">讀取失敗：${esc((e && e.message) || e)}<br><button class="mg-chip" id="mgRetry">再試一次</button></div>`; $("mgRetry").onclick = () => list(true); }

  // ---------- 列表 ----------
  async function list(force) {
    ov.querySelectorAll(".mg-tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === tab));
    const old = ov.querySelector(".mg-add"); if (old) old.remove();
    busy("讀取中…");
    try {
      await loadKind(tab, force);
      if (tab === "cases") await Promise.all([loadKind("venue"), loadKind("troupe")]);
    } catch (e) { return fail(e); }
    const k = tab, title = T.SCHEMA[k].fields[0][0];
    const rows = data[k].filter(r => !q || JSON.stringify(r).includes(q));
    let h = `<input class="mg-search" id="mgQ" placeholder="搜尋${K[k]}" value="${esc(q)}">`;
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
        return `<button class="mg-it" data-id="${r.id}"><b>${esc(r["案名"] || "（未命名）")}</b><small>${d ? md(d.start) + (d.end && d.end !== d.start ? " – " + md(d.end) : "") : "還沒填日期"}${v ? "・" + esc(v) : ""}${r["職位"] === "Crew" ? "・我是 Crew" : ""}</small>${tags}</button>`;
      };
      h += live.length ? `<div class="mg-sec">進行中、還沒開始</div>` + live.map(item).join("") : `<div class="mg-empty">還沒有案子，按下面的「＋ 新增案子」。</div>`;
      if (past.length) h += `<div class="mg-sec">已經結束</div>` + years.map(y => { const ys = past.filter(r => st(r).startsWith(y)); return `<details ${q ? "open" : ""}><summary class="mg-sec" style="cursor:pointer;font-size:15px;color:#1d1b18">${y} 年（${ys.length}）</summary>${ys.map(item).join("")}</details>`; }).join("");
    } else {
      rows.sort((a, b) => String(a[title]).localeCompare(String(b[title]), "zh-Hant"));
      h += rows.length ? rows.map(r => {
        const sub = k === "crew" ? [r["時段費"] ? "$" + r["時段費"] : "", r["居住地區"], r["電話"]].filter(Boolean).join("・")
          : k === "venue" ? [r["地區"], r["地址"]].filter(Boolean).join("・") : [r["抬頭"], r["統編"]].filter(Boolean).join("・");
        return `<button class="mg-it" data-id="${r.id}"><b>${esc(r[title] || "（未命名）")}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</button>`;
      }).join("") : `<div class="mg-empty">${q ? "找不到符合的" + K[k] : "還沒有" + K[k] + "，按下面的「＋ 新增" + K[k] + "」。"}</div>`;
    }
    $("mgBody").innerHTML = h;
    $("mgBody").querySelectorAll(".mg-it").forEach(b => b.onclick = () => edit(k, b.dataset.id));
    const qi = $("mgQ"); qi.oninput = () => { q = qi.value.trim(); clearTimeout(qi._t); qi._t = setTimeout(() => { list(); setTimeout(() => { const n = $("mgQ"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 0); }, 350); };
    const add = document.createElement("button"); add.className = "mg-add"; add.textContent = `＋ 新增${K[k]}`; add.onclick = () => edit(k, null); ov.appendChild(add);
  }

  // ---------- 編輯 ----------
  const inp = (id, label, v, extra = "") => `<label for="${id}">${label}</label><input id="${id}" value="${esc(v ?? "")}" ${extra}>`;
  function selectHtml(id, label, opts, v, addLabel) {
    return `<label for="${id}">${label}</label><select id="${id}"><option value="">（不選）</option>${opts.map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("")}${addLabel ? `<option value="__new">＋ ${addLabel}</option>` : ""}</select>`;
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
    let h = `<button class="mg-chip" id="mgBack" style="margin:0 0 10px">‹ 回到${K[k]}列表</button><div class="mg-f">`;
    if (k === "cases") h += await caseForm(r, isNew);
    else {
      h += `<div class="mg-card">`;
      for (const [name, type, opts] of T.SCHEMA[k].fields) {
        if (!has(k, name) || type === "content") continue;
        const fid = "f_" + name;
        if (type === "select") h += selectHtml(fid, name, (opts || []).concat(r[name] && !(opts || []).includes(r[name]) ? [r[name]] : []).map(o => [o, o]), r[name] || "");
        else if (name === "時段費紀錄" || name === "備註") h += `<label for="${fid}">${name}</label><textarea id="${fid}">${esc(r[name] || "")}</textarea>`;
        else h += inp(fid, name + (type === "title" ? "（必填）" : ""), r[name], type === "number" ? 'inputmode="numeric"' : name === "電話" ? 'inputmode="tel"' : type === "url" ? 'inputmode="url" placeholder="https://"' : "");
      }
      if (!isNew && r["電話"]) h += `<div class="mg-note"><a href="tel:${esc(String(r["電話"]).replace(/[^\d+]/g, ""))}">📞 打電話給 ${esc(r[T.SCHEMA[k].fields[0][0]])}</a></div>`;
      h += `</div>`;
    }
    h += `<div class="mg-err" id="mgErr"></div><div class="mg-act"><button class="pri" id="mgSave">${isNew ? "新增" : "儲存"}</button></div>`;
    if (!isNew) h += `<div class="mg-act"><button class="dan" id="mgDel">刪除</button></div>`;
    h += `</div>`;
    $("mgBody").innerHTML = h; $("mgBody").scrollTop = 0;
    $("mgBack").onclick = () => list();
    ov.querySelectorAll("select").forEach(s => s.onchange = () => { if (s.value === "__new") pickNew(s, s.dataset.kind); });
    if (k === "cases") bindCase(r, isNew);
    $("mgSave").onclick = () => save(k, id, r);
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
    let h = `<div class="mg-card"><h3>基本資料</h3>
      ${inp("c_name", "案名／劇名（必填，劇團另外選）", r["案名"], 'placeholder="例如：午後的信"')}
      ${has("cases", "劇團") ? selectHtml("c_troupe", "劇團", tOpts, (r["劇團"] || [])[0] || "", "新增劇團…").replace("<select ", '<select data-kind="troupe" ') : ""}
      <div class="two"><div>${inp("c_s", "進場日期", d.start, 'type="date"')}</div><div>${inp("c_e", "最後一天", d.end || d.start, 'type="date"')}</div></div>
      ${has("cases", "進場地點") ? selectHtml("c_venue", "演出場館", vOpts, (r["進場地點"] || [])[0] || "", "新增場館…").replace("<select ", '<select data-kind="venue" ') : ""}
      <div class="two"><div>${inp("c_l", "裝車日期（沒有就空白）", ld.start, 'type="date"')}</div><div>${has("cases", "裝車地點") ? inp("c_lp", "裝車地點（沒有就空白）", r["裝車地點"]) : ""}</div></div>
      ${has("cases", "負責人姓名") ? `<label class="mg-ck"><input type="checkbox" id="c_subOn" ${r["負責人姓名"] ? "checked" : ""}>這一檔我請人代班</label>
        <div id="c_subBox" style="${r["負責人姓名"] ? "" : "display:none"}">${inp("c_td", "代班的人是誰", r["負責人姓名"], 'placeholder="例如：王小明"')}</div>` : ""}
      ${has("cases", "巡演") ? `<label class="mg-ck"><input type="checkbox" id="c_tourOn" ${r["巡演"] ? "checked" : ""}>這是巡演</label>
        <div id="c_tourBox" style="${r["巡演"] ? "" : "display:none"}">${inp("c_tour", "巡演名稱（每一站都填一樣的名字，結案時可以合併成一張時段表）", r["巡演"], 'placeholder="例如：2026午後的信"')}</div>` : ""}
      </div>
      <div class="mg-card"><h3>這檔要找幾個人</h3>
      ${has("cases", "人力分配") ? inp("c_plan", "人力分配", r["人力分配"], 'placeholder="例如：全程1帶2 / 裝2天+拆台1帶4"') : ""}
      <label>還缺的人（可複選，主畫面「找人」會照這個顯示）</label>
      <div id="c_need">${T.NEED_KINDS.map(([kind, n, col]) => `<div class="mg-tagrow"><span>${kind}</span><div>${Array.from({ length: n }, (_, i) => `${kind}缺${i + 1}`).map(tg => `<button type="button" class="mg-tag c-${col} ${st.includes(tg) ? "on" : ""}" data-tag="${tg}">${tg}</button>`).join("")}</div></div>`).join("")}
        <div class="mg-tagrow"><span>其他</span><div><button type="button" class="mg-tag c-default ${st.includes("全部完成") ? "on" : ""}" data-tag="全部完成">人都找齊了</button><button type="button" class="mg-tag c-gray ${st.includes("等待製作確認") ? "on" : ""}" data-tag="等待製作確認">人數尚未確認</button></div></div></div>
      </div>
      <div class="mg-card"><h3>費用</h3>
      <div class="two"><div>${inp("c_tdr", `${esc(window.ROLE())}時段費`, r["負責人時段費"], 'inputmode="numeric"')}</div><div>${inp("c_cr", "Crew 時段費（預設）", r["Crew時段費"], 'inputmode="numeric"')}</div></div>
      ${inp("c_flat", "整筆費用（談好總價才填）", r["負責人整筆費用"], 'inputmode="numeric"')}
      </div>`;
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
      vals["負責人時段費"] = num($("c_tdr").value); vals["Crew時段費"] = num($("c_cr").value); vals["負責人整筆費用"] = num($("c_flat").value);
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
    const gear = modes && modes.querySelector(".tdh-gear");
    if (modes) modes.insertBefore(b, gear || null); else { b.style.cssText = "position:fixed;right:52px;top:10px;z-index:50"; document.body.appendChild(b); }
  });
})();
