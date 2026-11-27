// 劇場幫幫｜管理畫面：不用打開 Notion 或試算表，就能新增、編輯案子、人員、場館、劇團，以及封存做完的案子
(() => {
  const T = window.__tdh;
  const K = { cases: "案子", crew: "Crew", venue: "場館", troupe: "劇團" };
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const WK = "日一二三四五六";
  const md = (iso) => { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return `${d.getMonth() + 1}/${d.getDate()}(${WK[d.getDay()]})`; };
  const today = () => T.isoDay(new Date());

  const css = `
  .mg{position:fixed;inset:0;z-index:9000;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;font-family:"Noto Sans TC",-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;-webkit-tap-highlight-color:transparent}
  .mg *{box-sizing:border-box}
  .mg.embed{z-index:14;bottom:calc(var(--tab-h,58px) + env(safe-area-inset-bottom))}
  .mg.embed .mg-body{padding-bottom:96px}
  .mg.embed.d{bottom:calc(var(--tab-h,0px) + env(safe-area-inset-bottom))}
  .mg.embed .mg-add{bottom:calc(var(--tab-h,58px) + env(safe-area-inset-bottom) + 16px)}
  .mg-gear{flex:0 0 40px;width:40px;height:40px;border:0;background:transparent;color:var(--ink);border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
  .mg-quick{display:flex;gap:8px;margin:0 0 6px}.mg-quick button{flex:1;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:10px 6px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
  .mg-top{padding:calc(14px + env(safe-area-inset-top)) 14px 0;background:var(--bg)}
  .mg-top>div,.mg-in{max-width:560px;margin:0 auto}
  .mg-row{display:flex;align-items:center;gap:6px;margin-bottom:12px}.mg-row h1{flex:1;font-size:24px;font-weight:700;margin:0}
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
  .mg-it{position:relative;padding-right:40px;transition:transform .15s ease,border-color .2s,background .2s}
  .mg-it::after{content:"";position:absolute;right:17px;top:50%;width:7px;height:7px;border-right:2px solid var(--muted);border-top:2px solid var(--muted);transform:translateY(-50%) rotate(45deg);opacity:.75;transition:right .2s}
  .mg-it:active{transform:scale(.982);background:var(--sel)}
  @media (hover:hover){.mg-it:hover{border-color:var(--accent)}.mg-it:hover::after{right:14px}}
  .mg-gow{display:flex;justify-content:center;margin:26px 0 10px}
  .mg-go{position:relative;display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--accent);font:inherit;font-size:17px;font-weight:800;letter-spacing:.06em;padding:8px 4px 6px;cursor:pointer;border-bottom:2px solid currentColor;transition:gap .2s,opacity .15s}
  .mg-go i{display:inline-block;width:8px;height:8px;border-right:2.4px solid currentColor;border-top:2.4px solid currentColor;transform:rotate(45deg);margin-right:3px}
  .mg-go:active{opacity:.6}
  @media (hover:hover){.mg-go:hover{gap:12px}}
  .mg-it b{font-size:15px;font-weight:700;display:block}.mg-it small{color:var(--muted);font-size:12px;display:block;margin-top:3px;line-height:1.5}
  .mg-it .tg{display:inline-block;font-size:12px;font-weight:500;border-radius:6px;padding:2px 8px;margin:6px 4px 0 0;background:var(--blue);color:var(--blue-ink)}
  .mg-it .tg.ok{background:var(--sel);color:var(--accent)}.mg-it .tg.w{background:var(--yellow);color:var(--yellow-ink)}
  .mg-add{position:fixed;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:532px;bottom:calc(14px + env(safe-area-inset-bottom));border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font:inherit;font-size:15px;font-weight:700;padding:13px;box-shadow:0 6px 18px rgba(0,0,0,.16);cursor:pointer}
  .mg-empty{background:var(--card);border:1px dashed var(--line);border-radius:14px;text-align:center;color:var(--muted);padding:22px 12px;font-size:14px;line-height:1.7;margin-top:6px}
  .mg-back{border:0;background:none;color:var(--accent);font:inherit;font-size:14px;font-weight:600;padding:4px 0;margin:0 0 6px;cursor:pointer}
  .mg-card{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:6px 14px 14px;margin-bottom:12px}
  .mg-h{font-size:16px;font-weight:700;color:var(--ink);margin:18px 2px 8px}.mg-f>.mg-h:first-child{margin-top:4px}
  .mg-ct{width:100%;border-collapse:collapse;background:var(--card);table-layout:fixed}
  .mg-ct td{border:1px solid var(--line);padding:0;vertical-align:top}.mg-ct td:first-child{width:34%}
  .mg-f .mg-ct input{border:0;border-radius:0;background:transparent;padding:9px 10px;font-size:15px;min-height:0;height:100%}
  .mg-ct td:first-child{vertical-align:middle}
  .mg-f .mg-ct .ca{font-weight:700}.mg-f .mg-ct input:focus{background:var(--sel)}
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
  .mg-tag.on{color:var(--accent-ink);font-weight:700}
  .mg-tag.on.c-blue{background:#4a86c5;border-color:#4a86c5}.mg-tag.on.c-yellow{background:#c99412;border-color:#c99412}
  .mg-tag.on.c-green{background:#3f9a5a;border-color:#3f9a5a}.mg-tag.on.c-orange{background:#d9662b;border-color:#d9662b}
  .mg-tag.on.c-gray{background:#7a746b;border-color:#7a746b}.mg-tag.on.c-purple{background:#7a5aa8;border-color:#7a5aa8}
  .mg-tag.on.c-default{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
  .mg a{color:var(--accent)}
  @keyframes mgFwd{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
  @keyframes mgBack{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
  @keyframes mgFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes mgItem{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  #mgBody.a-fwd{animation:mgFwd .32s cubic-bezier(.2,.8,.2,1) both}
  #mgBody.a-back{animation:mgBack .32s cubic-bezier(.2,.8,.2,1) both}
  #mgBody.a-fade{animation:mgFade .3s cubic-bezier(.2,.8,.2,1) both}
  #mgBody.a-list .mg-it,#mgBody.a-list .mg-card,#mgBody.a-list .mg-h,#mgBody.a-list details{animation:mgItem .38s cubic-bezier(.2,.8,.2,1) both}
  #mgBody.a-list .mg-it:nth-of-type(2){animation-delay:.03s}#mgBody.a-list .mg-it:nth-of-type(3){animation-delay:.06s}#mgBody.a-list .mg-it:nth-of-type(4){animation-delay:.09s}#mgBody.a-list .mg-it:nth-of-type(5){animation-delay:.12s}#mgBody.a-list .mg-it:nth-of-type(n+6){animation-delay:.15s}
  .mg-add{transition:transform .15s,box-shadow .2s}.mg-add:active{transform:scale(.9)}
  .mg-top button:active,.tdh-back:active{transform:scale(.92)}
  .mg-tabs button{transition:background .22s,color .22s,border-color .22s}
  .mg-card{transition:border-color .2s}
  .mg-modal{position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;padding:calc(14px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));transition:background .28s,backdrop-filter .28s}
  .mg-modal.in{background:rgba(0,0,0,.42);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
  .mg-dlg{background:var(--bg);border-radius:22px;width:100%;max-width:540px;max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.3);transform:translateY(28px) scale(.96);opacity:0;transition:transform .36s cubic-bezier(.2,.9,.25,1.05),opacity .22s ease}
  .mg-modal.in .mg-dlg{transform:none;opacity:1}
  .mg-dlg-h{font-size:19px;font-weight:700;padding:18px 18px 10px}
  .mg-dlg-b{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:0 16px 8px}
  .mg-dlg-f{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px 16px;border-top:1px solid var(--line)}
  .mg-dlg-f button{border-radius:14px;padding:12px 22px;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
  .mg-dlg-f .ghost{background:var(--card);border:1px solid var(--line);color:var(--ink);font-weight:500}
  .mg-dlg-f .pri{background:var(--accent);border:0;color:var(--accent-ink)}
  .mg-cardfoot{display:flex;justify-content:flex-end;margin-top:12px}
  .mg-clr2{border:0;background:none;color:var(--muted);font:inherit;font-size:13px;text-decoration:underline;text-underline-offset:3px;padding:2px 0;cursor:pointer}
  .mg-clr2.armed{color:var(--tdh-dan);font-weight:700}
  .mg-names{display:flex;flex-wrap:wrap;gap:5px;padding:6px 6px;align-items:center;min-height:38px}
  .mg-nm{display:inline-flex;align-items:center;gap:2px;background:var(--sel);color:var(--ink);border:1px solid transparent;border-radius:8px;padding:3px 4px 3px 8px;font-size:14px;line-height:1.3}
  .mg-nm.unk{background:transparent;border:1px dashed var(--tdh-no)}
  .mg-nm button{border:0;background:none;color:var(--muted);font-size:15px;line-height:1;padding:0 3px;cursor:pointer}
  .mg-nadd{border:1px dashed var(--line);background:transparent;color:var(--accent);border-radius:8px;width:30px;height:28px;font-size:16px;font-weight:700;cursor:pointer}
  .mg-pick{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}.mg-pick .mg-tag{font-size:14px;padding:6px 12px}.mg-pick .mg-tag.unk{border-style:dashed}
  .mg .mg-add{left:auto;right:max(18px,calc(50% - 262px));transform:none;width:58px;height:58px;max-width:none;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.22)}
  .mg-row .mg-edit{flex:0 0 auto}.mg-row h1{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mg-row .tdh-back{margin-left:-8px}
  .mg-kvs a{color:var(--accent)}.mg-row h1.item{font-size:19px}
  .mg-bhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
  .mg-edit{border:0;background:var(--accent);color:var(--accent-ink);border-radius:999px;padding:8px 18px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
  .mg-btitle{font-size:20px;font-weight:700;margin:6px 2px 4px;line-height:1.4}
  .mg-kvs{padding:4px 14px}
  .mg-kvs .kv{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:15px;align-items:baseline}.mg-kvs .kv:last-child{border-bottom:0}
  .mg-kvs .kv>span{flex:0 0 64px;color:var(--muted);font-size:13px}.mg-kvs .kv>b{flex:1;font-weight:500;line-height:1.6}.mg-kvs .kv i{color:var(--muted);font-style:normal}
  .mg-kvs .mg-tag{cursor:default;font-size:12px;padding:2px 8px;margin:2px 4px 2px 0}
  .mg-ct.ro td{padding:0}.mg-ct.ro td:first-child{padding:9px 10px;font-weight:700;font-size:14px}
  .mg-none{color:var(--muted);padding:2px 4px}
  .mg-act .ghost2{background:var(--card);border:1px solid var(--line);color:var(--ink);font-weight:500}
  .mg-act .red{background:#b3261e;color:#fff}
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
    if (!data[k] || force) data[k] = await store().list(k, force);
    if (!fields[k]) fields[k] = store().fields ? await store().fields(k) : T.SCHEMA[k].fields.map(f => f[0]);
    return data[k];
  }
  const has = (k, name) => (fields[k] || []).includes(name);
  const nameOf = (k, id) => { const r = (data[k] || []).find(x => x.id === id); return r ? r[T.SCHEMA[k].fields[0][0]] : ""; };

  // 嵌在下方分頁裡：section = "cases"（案子）或 "lists"（Crew、場館、劇團）
  let section = "cases";
  function open(o = {}) {
    if (typeof o === "string") o = { section: o === "cases" ? "cases" : "lists" };
    section = o.section === "lists" ? "lists" : "cases";
    let tabs = section === "cases" ? ["cases"] : ["crew", "venue", "troupe"];
    if (o.only) { tabs = [o.only]; section = o.only === "cases" ? "cases" : "lists"; }
    if (o.tab && tabs.includes(o.tab)) tab = o.tab;
    if (!tabs.includes(tab)) tab = tabs[0];
    q = ""; sub = "";
    if (ov) ov.remove();
    const D = T.ui && T.ui() !== "C";   // D 框架：左上角是選單，不放齒輪
    const title = o.only ? (o.only === "cases" ? "我的案子" : K[o.only]) : section === "cases" ? "我的案子" : "名單";
    ov = document.createElement("div"); ov.className = "mg embed" + (D ? " d" : "");
    ov.innerHTML = `<div class="mg-top"><div><div class="mg-row">${D ? `<span id="mgMenu"></span>` : ""}<button class="tdh-back" id="mgHBack" aria-label="返回" hidden><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><h1 id="mgTitle">${title}</h1><button class="mg-edit" id="mgHAct" hidden>編輯</button>${D ? "" : `<button class="mg-gear" id="mgGear" aria-label="設定"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.9 4.6 1.7 1.7 0 0 0 9.97 3.04V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.26.6.85 1 1.51 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg></button>`}</div>
      ${tabs.length > 1 ? `<div class="mg-tabs">${tabs.map(k => `<button data-k="${k}">${K[k]}</button>`).join("")}</div>` : ""}</div>
      </div></div><div class="mg-body" id="mgScroll"><div class="mg-in" id="mgBody"></div></div>`;
    document.body.appendChild(ov);
    document.documentElement.style.overflow = "hidden";
    if ($("mgMenu") && T.menuButton) { const mb = T.menuButton(); mb.id = "mgMenuBtn"; $("mgMenu").replaceWith(mb); }
    listTitle = title;
    if ($("mgGear")) $("mgGear").onclick = () => T.openSettings && T.openSettings();
    ov.querySelectorAll(".mg-tabs button").forEach(b => b.onclick = () => { tab = b.dataset.k; q = ""; sub = ""; list(); });
    scrollCT = o.scrollTo === "ct"; backTo = o.from || null;
    if (o.caseId) { tab = "cases"; loadKind("cases").then(() => Promise.all([loadKind("venue"), loadKind("troupe"), loadKind("crew")])).then(() => edit("cases", o.caseId)).catch(() => list()); }
    else { list().then(() => { if (o.add) edit(tab, null); }); }
  }
  // 離開案子／名單頁。資料有改過就重新載入，回傳 true
  function close(nextTab) {
    if (!ov) return false;
    ov.remove(); ov = null; document.documentElement.style.overflow = "";
    if (dirty) { dirty = false; try { if (nextTab) localStorage.setItem("tdh.tab", nextTab); } catch (e) {} location.reload(); return true; }
    return false;
  }
  function busy(msg) { $("mgBody").innerHTML = `<div class="mg-empty">${esc(msg)}</div>`; const a = ov.querySelector(".mg-add"); if (a) a.remove(); }
  function fail(e) { $("mgBody").innerHTML = `<div class="mg-empty">讀取失敗：${esc((e && e.message) || e)}<br><button class="mg-chip" id="mgRetry">再試一次</button></div>`; $("mgRetry").onclick = () => list(true); }

  // ---------- 列表 ----------
  let lastMode = "list";
  function reveal(mode) {
    const b = $("mgBody"); if (!b) return;
    const dir = lastMode === "list" && mode === "item" ? "a-fwd" : lastMode === "item" && mode === "list" ? "a-back" : mode === "list" ? "a-list" : "a-fade";
    lastMode = mode;
    b.classList.remove("a-fwd", "a-back", "a-fade", "a-list"); void b.offsetWidth; b.classList.add(dir);
    if (mode === "list" && dir !== "a-list") setTimeout(() => b.classList.add("a-list"), 0);
    clearTimeout(reveal.t); reveal.t = setTimeout(() => b.classList.remove("a-fwd", "a-back", "a-fade", "a-list"), 700);
  }
  let sub = "";   // Crew：居住地區、場館：地區 的篩選頁籤
  // 標題列：列表時是「選單＋頁面名稱」，看板／編輯時是「← 項目名稱」
  let listTitle = "";
  function head(itemTitle, onBack, act) {
    const mb = $("mgMenuBtn"), bk = $("mgHBack"), tabs = ov.querySelector(".mg-tabs"), ab = $("mgHAct");
    if (itemTitle) { if (mb) mb.hidden = true; bk.hidden = false; bk.onclick = onBack; $("mgTitle").textContent = itemTitle; $("mgTitle").classList.add("item"); if (tabs) tabs.hidden = true; }
    else { if (mb) mb.hidden = false; bk.hidden = true; $("mgTitle").textContent = listTitle; $("mgTitle").classList.remove("item"); if (tabs) tabs.hidden = false; }
    ab.hidden = !act; if (act) { ab.textContent = act.label; ab.onclick = act.fn; }
  }
  async function list(force) {
    reBoard = null; head(null);
    ov.querySelectorAll(".mg-tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === tab));
    const old = ov.querySelector(".mg-add"); if (old) old.remove();
    busy("讀取中…");
    try {
      await loadKind(tab, force);
      if (tab === "cases") await Promise.all([loadKind("venue"), loadKind("troupe"), loadKind("crew")]);
      if (tab === "crew" || tab === "troupe") await loadKind("cases");
    } catch (e) { return fail(e); }
    const k = tab;
    // 搜尋框只建立一次，打字（含注音組字）時只更新下面的結果，不會跳掉
    $("mgBody").innerHTML = `<div class="mg-sbox"><input class="mg-search" id="mgQ" placeholder="搜尋${K[k]}" value="${esc(q)}" autocomplete="off"><button type="button" class="mg-clr" id="mgClr" aria-label="清除" style="${q ? "" : "display:none"}">✕</button></div><div id="mgSubTabs"></div><div id="mgList"></div>`; reveal("list");
    const qi = $("mgQ"); let composing = false;
    const clr = $("mgClr"), syncClr = () => { clr.style.display = qi.value ? "" : "none"; };
    qi.addEventListener("input", syncClr);
    clr.onclick = () => { qi.value = ""; q = ""; syncClr(); results(); qi.focus(); };
    qi.addEventListener("compositionstart", () => { composing = true; });
    qi.addEventListener("compositionend", () => { composing = false; q = qi.value.trim(); results(); });
    qi.addEventListener("input", () => { if (composing) return; q = qi.value.trim(); results(); });
    results();
    const add = document.createElement("button"); add.className = "mg-add"; add.setAttribute("aria-label", `新增${K[k]}`); add.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`; add.onclick = () => edit(k, null); ov.appendChild(add);
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
      else if (!past.length) h += `<div class="mg-empty">${q ? "找不到符合的案子" : "還沒有案子，按右下角的 ＋ 新增。"}</div>`;
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
        const sub2 = k === "crew" ? [r["居住地區"], r["電話"], r._n ? `合作 ${r._n} 檔` : ""].filter(Boolean).join("・")
          : k === "venue" ? [r["地區"], r["地址"]].filter(Boolean).join("・") : [r["抬頭"], r["統編"]].filter(Boolean).join("・");
        return `<button class="mg-it" data-id="${r.id}"><b>${esc(r[title] || "（未命名）")}</b>${sub2 ? `<small>${esc(sub2)}</small>` : ""}</button>`;
      }).join("") : `<div class="mg-empty">${q || sub ? "找不到符合的" + K[k] : "還沒有" + K[k] + "，按右下角的 ＋ 新增。"}</div>`;
    }
    box.innerHTML = h;
    box.querySelectorAll(".mg-it").forEach(b => b.onclick = () => edit(k, b.dataset.id));
  }

  // ---------- 編輯 ----------
  const inp = (id, label, v, extra = "") => `<label for="${id}">${label}</label><input id="${id}" value="${esc(v ?? "")}" ${extra}>`;
  function selectHtml(id, label, opts, v, addLabel) {
    return `<label for="${id}">${label}</label><select id="${id}"><option value="">點這裡選擇</option>${opts.map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("")}${addLabel ? `<option value="__new">＋ ${addLabel}</option>` : ""}</select>`;
  }
  // 下拉選單＋右上角「＋ 新增」：在下面展開一列輸入框，直接建立
  function pickHtml(id, label, kind, opts, v) {
    return `<div class="mg-lrow"><label for="${id}">${label}</label><button type="button" class="mg-mini" data-addfor="${id}" data-kind="${kind}">＋ 新增${K[kind]}</button></div>
      <select id="${id}"><option value="">點這裡選擇${label}</option>${opts.map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("")}</select>
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

  async function edit(k, id, mode) {
    if (id && mode !== "edit") return k === "cases" ? caseBoard(id) : itemBoard(k, id);
    const r = id ? data[k].find(x => x.id === id) : {};
    const isNew = !id;
    if (!isNew) { const old = ov.querySelector(".mg-add"); if (old) old.remove(); head("編輯・" + (r[T.SCHEMA[k].fields[0][0]] || ""), () => edit(k, id)); }
    let h = `<div class="mg-f">`;
    if (k === "cases") h += await caseForm(r, isNew);
    else {
      h += `<div class="mg-card">`;
      const HIDE = { venue: ["官方網站", "技術資料與圖面"], crew: ["時段費"] };
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
      if (isNew) h += `<div class="mg-cardfoot"><button type="button" class="mg-clr2" data-clear="all">清除資料</button></div>`;
      h += `</div>`;
    }
    if (isNew) {   // 新增：彈出視窗，右下角「取消、新增」
      h += `<div class="mg-err" id="mgErr"></div></div>`;
      const old = ov.querySelector(".mg-modal"); if (old) old.remove();
      const md = document.createElement("div"); md.className = "mg-modal";
      md.innerHTML = `<div class="mg-dlg" role="dialog"><div class="mg-dlg-h">新增${K[k]}</div><div class="mg-dlg-b">${h}</div>
        <div class="mg-dlg-f"><button type="button" class="ghost" id="mgCancel">取消</button><button type="button" class="pri" id="mgSave">新增</button></div></div>`;
      ov.appendChild(md);
      requestAnimationFrame(() => md.classList.add("in"));
      $("mgCancel").onclick = () => { md.classList.remove("in"); setTimeout(() => md.remove(), 180); };
      md.onclick = (e) => { if (e.target === md) $("mgCancel").onclick(); };
    } else {
      h += `<div class="mg-err" id="mgErr"></div><div class="mg-act"><button class="ghost2" id="mgCancel">取消</button><button class="pri" id="mgSave">儲存</button></div><div class="mg-act" style="margin-top:28px"><button class="red" id="mgDel">${k === "cases" ? "刪除整個案子" : "刪除這筆" + K[k]}</button></div></div>`;
      $("mgBody").innerHTML = h; $("mgScroll").scrollTop = 0; reveal("item");
      $("mgCancel").onclick = () => edit(k, id);
    }
    // 「清除資料」：點兩下才清（第一下變成「再點一次清除」）
    ov.querySelectorAll("[data-clear]").forEach(btn => {
      let t = null;
      btn.onclick = () => {
        if (!btn.classList.contains("armed")) { btn.classList.add("armed"); btn.textContent = "再點一次清除"; t = setTimeout(() => { btn.classList.remove("armed"); btn.textContent = "清除資料"; }, 2500); return; }
        clearTimeout(t); btn.classList.remove("armed"); btn.textContent = "清除資料";
        clearPart(btn.closest(".mg-card"), btn.dataset.clear);
      };
    });
    ov.querySelectorAll("select").forEach(s => s.onchange = () => { if (s.value === "__new") pickNew(s, s.dataset.kind); });
    if (k === "cases") { bindCase(r, isNew); bindPick(); }
    $("mgSave").onclick = () => save(k, id, r);
    if ($("mgArc")) $("mgArc").onclick = async () => {
      $("mgArc").disabled = true;
      try { await store().update("cases", id, { "封存": !r["封存"] }); dirty = true; await loadKind("cases", true); list(); }
      catch (e) { $("mgErr").textContent = "失敗：" + (e.message || e); $("mgArc").disabled = false; }
    };
    if ($("mgDel")) $("mgDel").onclick = async () => {
      const nm = r[T.SCHEMA[k].fields[0][0]] || "";
      if (!confirm(`確定要刪除${k === "cases" ? "整個案子" : ""}「${nm}」？${T.cfg.mode === "google" ? "刪除後沒辦法復原。" : "會移到 Notion 的垃圾桶，30 天內可以還原。"}`)) return;
      if (k === "cases" && !confirm(`再確認一次：刪除「${nm}」，包含它的 Call Time 排班表和打卡紀錄？`)) return;
      $("mgDel").disabled = true;
      try { await store().remove(k, id); dirty = true; await loadKind(k, true); list(); }
      catch (e) { $("mgErr").textContent = "刪除失敗：" + (e.message || e); $("mgDel").disabled = false; }
    };
  }

  // Call Time 排班表：新增時照日期自動產生；Google 存在資料表；Notion 讀頁面裡的表格
  async function loadCT(r, isNew) {
    const d = r["進場日期"] || {}, ld = r["裝車時間"] || {};
    ct = { mode: isNew ? "new" : T.cfg.mode, rows: [], notes: null, orig: {} };
    if (!isNew && T.cfg.mode === "google") { const c = await T.gstore.getContent(r.id); ct.rows = c.table.map((x, i) => ({ key: "ROW" + i, a: x[0] || "", b: x[1] || "" })); ct.notes = c.notes; }
    else if (!isNew) {
      try {
        const m = await window.claude.use("mcp"); const res = await m.callTool("Notion", "notion-fetch", { id: r.id });
        const text = (res && ((res.payload && res.payload.text) || res.text)) || "";
        const strip = (x) => x.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
        ct.rows = [...text.matchAll(/<tr data-b="([^"]+)">([\s\S]*?)<\/tr>/g)].map(mm => { const cells = [...mm[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => strip(c[1])); return { key: mm[1], a: cells[0] || "", b: cells[1] || "" }; });
      } catch (e) { ct.err = String(e.message || e); }
    } else ct.rows = T.callRows(d.start, d.end, ld.start).map(x => ({ key: "", a: x[0], b: "" }));
    ct.rows.forEach(x => { ct.orig[x.key] = x.a + "\u0001" + x.b; });
    if (d.start) ct.rows.forEach(x => {   // 「Day 1」這類標籤 → 照進場日期換成「12/14 (一)」
      const m = String(x.a).match(/^day\s*(\d+)$/i); if (!m) return;
      const dt = new Date(d.start + "T00:00:00"); dt.setDate(dt.getDate() + +m[1] - 1);
      x.a = `${dt.getMonth() + 1}/${dt.getDate()} (${"日一二三四五六"[dt.getDay()]})`;
    });
  }
  // ---------- 案子看板（只看，按「編輯」才改） ----------
  let reBoard = null;
  async function caseBoard(id) {
    reBoard = () => caseBoard(id);
    const old = ov.querySelector(".mg-add"); if (old) old.remove();
    const r = (data.cases || []).find(x => x.id === id);
    if (!r) return list();
    busy("讀取中…");
    await Promise.all([loadKind("venue"), loadKind("troupe"), loadKind("crew")]);
    await loadCT(r, false);
    const tr = (data.troupe || []).find(x => x.id === (r["劇團"] || [])[0]) || null;
    const vn = (r["進場地點"] || []).map(x => nameOf("venue", x)).filter(Boolean).join("、");
    const d = r["進場日期"] || {}, ld = r["裝車時間"] || {}, stt = r["Crew 狀態"] || [];
    const kv = (k, v) => v ? `<div class="kv"><span>${k}</span><b>${v}</b></div>` : "";
    const known = new Set(crewNames());
    const ttl = tr ? `${tr["劇團名稱"]}《${r["案名"]}》` : r["案名"] || "（未命名）";
    head(ttl, () => { if (backTo) { const b = backTo; backTo = null; T.showTab(b); } else list(); }, { label: "編輯", fn: () => edit("cases", id, "edit") });
    rememberRecent(id, ttl);
    let h = `<div class="mg-h" style="margin-top:4px">基本資料</div><div class="mg-card mg-kvs">
        ${kv("進場日期", d.start ? esc(md(d.start) + (d.end && d.end !== d.start ? " – " + md(d.end) : "")) : "")}
        ${kv("裝車", ld.start ? esc(md(ld.start) + (r["裝車地點"] ? "・" + r["裝車地點"] : "")) : "")}
        ${kv("演出場館", esc(vn))}
        ${kv("劇團", tr ? esc(tr["劇團名稱"]) : "")}
        ${kv("抬頭", tr && tr["抬頭"] ? esc(tr["抬頭"]) : "")}
        ${kv("統編", tr && tr["統編"] ? esc(tr["統編"]) : "")}
        ${kv("代班", r["負責人姓名"] ? esc(r["負責人姓名"]) : "")}
        ${kv("巡演", r["巡演"] ? esc(r["巡演"]) : "")}
      </div>
      <div class="mg-h">人力分配</div><div class="mg-card mg-kvs">
        ${kv("筆記", r["人力分配"] ? esc(r["人力分配"]) : "<i>沒有填</i>")}
        <div class="kv"><span>還缺</span><b>${stt.includes("全部完成") ? `<span class="mg-tag on c-default">人都找齊了</span>` : stt.filter(x => /缺/.test(x)).map(x => { const kd = (T.NEED_KINDS.find(n => x.startsWith(n[0])) || [0, 0, "gray"])[2]; return `<span class="mg-tag on c-${kd}">${esc(x)}</span>`; }).join(" ") || "<i>沒有填</i>"}${stt.includes("等待製作確認") ? ` <span class="mg-tag on c-gray">人數尚未確認</span>` : ""}</b></div>
      </div>
      <div class="mg-h" id="ctSec">${esc(window.TEAM())}人員 Call Time</div>
      ${ct.err ? `<div class="mg-note">讀不到 Call Time 表格：${esc(ct.err)}</div>` : ct.rows.length ? `<table class="mg-ct ro"><tbody>${ct.rows.map(x => `<tr><td>${esc(x.a)}</td><td><div class="mg-names">${splitNames(x.b).map(n => `<span class="mg-nm${known.size && !known.has(n) ? " unk" : ""}">${esc(n)}</span>`).join("") || `<span class="mg-none">—</span>`}</div></td></tr>`).join("")}</tbody></table>` : `<div class="mg-empty" style="margin:0">還沒有 Call Time 表格</div>`}`;
    h += `<div class="mg-gow"><button class="mg-go" id="mgGoClose">去結案<i></i></button></div>`;
    $("mgBody").innerHTML = h; $("mgScroll").scrollTop = 0; reveal("item");
    $("mgGoClose").onclick = () => T.showTab && T.showTab("close", { caseId: id });
    if (scrollCT) { scrollCT = false; const el = $("ctSec"); if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }
  }
  let scrollCT = false, backTo = null;
  function rememberRecent(id, title) {
    try { const a = JSON.parse(localStorage.getItem("tdh.recent") || "[]").filter(x => x.id !== id); a.unshift({ id, title }); localStorage.setItem("tdh.recent", JSON.stringify(a.slice(0, 6))); } catch (e) {}
  }
  // ---------- Crew／場館／劇團 看板 ----------
  async function itemBoard(k, id) {
    reBoard = () => itemBoard(k, id);
    const old = ov.querySelector(".mg-add"); if (old) old.remove();
    const r = (data[k] || []).find(x => x.id === id); if (!r) return list();
    const tf = T.SCHEMA[k].fields[0][0];
    head(r[tf] || "（未命名）", () => list(), { label: "編輯", fn: () => edit(k, id, "edit") });
    const kv = (a, v) => v ? `<div class="kv"><span>${a}</span><b>${v}</b></div>` : "";
    const HIDE = { venue: [], crew: ["時段費"] };
    let rows = "";
    for (const [name, type] of T.SCHEMA[k].fields) {
      if (name === tf || type === "content" || !has(k, name) || (HIDE[k] || []).includes(name)) continue;
      const v = r[name]; if (v === null || v === undefined || v === "") continue;
      if (name === "電話") rows += kv(name, `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ""))}">${esc(v)}</a>`);
      else if (type === "url") rows += kv(name, `<a href="${esc(v)}" target="_blank" rel="noopener">打開連結 ↗</a>`);
      else if (name === "時段費") rows += kv(name, "$" + esc(v));
      else rows += kv(name, esc(v).replace(/\n/g, "<br>"));
    }
    // 相關案子
    if (!data.cases) await loadKind("cases");
    const rel = (data.cases || []).filter(c => (k === "crew" ? [...(c["摳的人"] || []), ...(c["問過的人"] || [])] : k === "venue" ? (c["進場地點"] || []) : (c["劇團"] || [])).includes(id))
      .sort((a, b) => String((b["進場日期"] || {}).start || "").localeCompare(String((a["進場日期"] || {}).start || "")));
    let h = `<div class="mg-h" style="margin-top:4px">資料</div><div class="mg-card mg-kvs">${rows || `<div class="kv"><b><i>還沒有填其他資料，按右上角「編輯」補上</i></b></div>`}</div>`;
    if (rel.length) h += `<div class="mg-h">${k === "crew" ? "合作過的案子" : "相關案子"}（${rel.length}）</div>` + rel.slice(0, 12).map(c => `<button class="mg-it" data-cid="${c.id}"><b>${esc(c["案名"] || "")}</b><small>${c["進場日期"] ? md(c["進場日期"].start) : ""}</small></button>`).join("");
    $("mgBody").innerHTML = h; $("mgScroll").scrollTop = 0; reveal("item");
    $("mgBody").querySelectorAll("[data-cid]").forEach(b => b.onclick = () => T.showTab && T.showTab("cases", { caseId: b.dataset.cid }));
  }
  // 案子表單
  const NEEDS = () => T.NEED_KINDS.map(x => x[0]);
  async function caseForm(r, isNew) {
    const d = r["進場日期"] || {}, ld = r["裝車時間"] || {};
    const st = r["Crew 狀態"] || [];
    const cnt = (kind) => { const m = st.map(x => x.match(new RegExp("^" + kind + "缺(\\d+)$"))).find(Boolean); return m ? +m[1] : 0; };
    const vOpts = (data.venue || []).map(x => [x.id, x["場館名稱"] || "（未命名）"]).sort((a, b) => a[1].localeCompare(b[1], "zh-Hant"));
    const tOpts = (data.troupe || []).map(x => [x.id, x["劇團名稱"] || "（未命名）"]).sort((a, b) => a[1].localeCompare(b[1], "zh-Hant"));
    await loadCT(r, isNew);
    let h = `<div class="mg-h">基本資料填寫</div><div class="mg-card">
      ${inp("c_name", "案名／劇名（必填）", r["案名"], 'placeholder="例如：午後的信"')}
      ${has("cases", "劇團") ? pickHtml("c_troupe", "劇團", "troupe", tOpts, (r["劇團"] || [])[0] || "") : ""}
      ${has("cases", "劇團") ? (() => { const t0 = (data.troupe || []).find(x => x.id === (r["劇團"] || [])[0]) || {}; return `<div class="two" id="c_taxBox"><div>${inp("c_tt", "抬頭（存在劇團資料）", t0["抬頭"], 'placeholder="先選劇團"')}</div><div>${inp("c_tn", "統編", t0["統編"], 'inputmode="numeric" placeholder="先選劇團"')}</div></div>`; })() : ""}
      <div class="two"><div>${inp("c_s", "進場日期", d.start, 'type="date"')}</div><div>${inp("c_e", "最後一天", d.end || d.start, 'type="date"')}</div></div>
      ${has("cases", "進場地點") ? pickHtml("c_venue", "演出場館", "venue", vOpts, (r["進場地點"] || [])[0] || "") : ""}
      <div class="two"><div>${inp("c_l", "裝車日期（沒有就空白）", ld.start, 'type="date"')}</div><div>${has("cases", "裝車地點") ? inp("c_lp", "裝車地點（沒有就空白）", r["裝車地點"]) : ""}</div></div>
      ${has("cases", "負責人姓名") ? `<label class="mg-ck"><input type="checkbox" id="c_subOn" ${r["負責人姓名"] ? "checked" : ""}>這一檔我請人代班</label>
        <div id="c_subBox" style="${r["負責人姓名"] ? "" : "display:none"}">${inp("c_td", "代班的人是誰", r["負責人姓名"], 'placeholder="例如：王小明"')}</div>` : ""}
      ${has("cases", "巡演") ? `<label class="mg-ck"><input type="checkbox" id="c_tourOn" ${r["巡演"] ? "checked" : ""}>這一檔是巡演</label>
        <div id="c_tourBox" style="${r["巡演"] ? "" : "display:none"}">${inp("c_tour", "巡演名稱（每一站都填一樣的名字，結案時可以合併成一張時段表）", r["巡演"], 'placeholder="例如：2026午後的信"')}</div>` : ""}
      <div class="mg-cardfoot"><button type="button" class="mg-clr2" data-clear="basic">清除資料</button></div>
      </div>
      <div class="mg-h">人力分配填寫</div><div class="mg-card">
      ${has("cases", "人力分配") ? inp("c_plan", "人力分配（寫給自己看的筆記）", r["人力分配"], 'placeholder="例如：全程1帶2 / 裝2天+拆台1帶4"') : ""}
      <label>目前還缺幾人？（可複選）</label>
      <div id="c_need">${T.NEED_KINDS.map(([kind, n, col]) => `<div class="mg-tagrow"><span>${kind}</span><div>${Array.from({ length: n }, (_, i) => `${kind}缺${i + 1}`).map(tg => `<button type="button" class="mg-tag c-${col} ${st.includes(tg) ? "on" : ""}" data-tag="${tg}">${tg}</button>`).join("")}</div></div>`).join("")}
        <div class="mg-tagrow"><span>其他</span><div><button type="button" class="mg-tag c-default ${st.includes("全部完成") ? "on" : ""}" data-tag="全部完成">人都找齊了</button><button type="button" class="mg-tag c-gray ${st.includes("等待製作確認") ? "on" : ""}" data-tag="等待製作確認">人數尚未確認</button></div></div></div>
      <div class="mg-cardfoot"><button type="button" class="mg-clr2" data-clear="need">清除資料</button></div>
      </div>
      <div class="mg-h">${esc(window.TEAM())}人員 Call Time</div>
      ${ct.err ? `<div class="mg-note">讀不到這個案子的 Call Time 表格：${esc(ct.err)}</div>` : `<div id="c_tblBox">${ctTable()}</div>
      <div class="mg-note">${isNew ? "會照日期自動產生，改日期會跟著變。" : ""}點「＋」從名單選人；虛線框是名單裡沒有的名字，可以檢查是不是打錯字。在「找人」排人也會寫進這張表。</div>
      ${ct.mode === "google" ? `<div><button type="button" class="mg-chip" id="c_addRow">＋ 加一列</button><button type="button" class="mg-chip" id="c_fillDays">補上缺的日期</button></div>` : ""}`}`;
    return h;
  }
  function clearPart(card, which) {
    if (!card) return;
    card.querySelectorAll("input:not([type=checkbox]),select,textarea").forEach(x => { x.value = ""; });
    card.querySelectorAll("input[type=checkbox]").forEach(x => { x.checked = false; x.dispatchEvent(new Event("change")); });
    card.querySelectorAll(".mg-tag.on").forEach(x => x.classList.remove("on"));
    card.querySelectorAll(".mg-newrow").forEach(x => { x.style.display = "none"; });
    if (which === "basic" && $("c_e") && $("c_e").onchange) $("c_e").onchange();
  }
  let ct = null;
  const splitNames = (t) => String(t || "").split(/[、,，\n]+/).map(x => x.trim()).filter(Boolean);
  const crewNames = () => (data.crew || []).map(c => c["姓名"]).filter(Boolean);
  function ctTable() {
    if (!ct.rows.length) return `<div class="mg-empty" style="margin:0">${ct.mode === "new" ? "填好進場日期就會出現排班表" : "這個案子還沒有 Call Time 表格"}</div>`;
    const known = new Set(crewNames());
    return `<table class="mg-ct"><tbody>${ct.rows.map((x, i) => `<tr data-i="${i}"><td><input class="ca" value="${esc(x.a)}" placeholder="日期或項目"></td><td><div class="mg-names">${splitNames(x.b).map((n, j) =>
      `<span class="mg-nm${known.size && !known.has(n) ? " unk" : ""}" title="${known.size && !known.has(n) ? "Crew 名單裡沒有這個名字" : ""}">${esc(n)}<button type="button" data-rm="${i}:${j}" aria-label="移除">×</button></span>`).join("")}<button type="button" class="mg-nadd" data-add="${i}" aria-label="加人">＋</button></div></td></tr>`).join("")}</tbody></table>`;
  }
  function ctRead() {   // 把畫面上的日期欄讀回 ct.rows（名字由選人視窗直接改 ct.rows）
    const tb = $("c_tblBox"); if (!tb) return;
    tb.querySelectorAll("tr[data-i]").forEach(tr => { const x = ct.rows[+tr.dataset.i]; if (x) x.a = tr.querySelector(".ca").value.trim(); });
  }
  // 選人視窗：從 Crew 名單點選（避免打錯字），也可以加名單外的名字
  function pickPeople(i) {
    ctRead();
    const row = ct.rows[i]; let chosen = splitNames(row.b);
    const freq = {}; (data.cases || []).forEach(c => (c["摳的人"] || []).forEach(id => { freq[id] = (freq[id] || 0) + 1; }));
    const crew = (data.crew || []).slice().sort((a, b) => (freq[b.id] || 0) - (freq[a.id] || 0)).map(c => c["姓名"]).filter(Boolean);
    const md = document.createElement("div"); md.className = "mg-modal";
    md.innerHTML = `<div class="mg-dlg"><div class="mg-dlg-h">${esc(row.a || "這一列")}・選人</div><div class="mg-dlg-b">
      <div class="mg-sbox"><input class="mg-search" id="pkQ" placeholder="搜尋 Crew" autocomplete="off"></div>
      <div class="mg-pick" id="pkList"></div>
      <div class="mg-f"><label>名單裡沒有的人</label><div class="mg-newrow" style="display:flex;margin-top:0"><input id="pkNew" placeholder="輸入名字"><button type="button" id="pkAdd">加入</button></div>
      <div class="mg-note">名單外的名字會用虛線框標出來。常合作的人，建議到「名單」新增，之後就能直接點選。</div></div></div>
      <div class="mg-dlg-f"><button type="button" class="ghost" id="pkCancel">取消</button><button type="button" class="pri" id="pkOk">完成</button></div></div>`;
    ov.appendChild(md); requestAnimationFrame(() => md.classList.add("in"));
    const draw = () => {
      const qq = md.querySelector("#pkQ").value.trim();
      const all = crew.concat(chosen.filter(n => !crew.includes(n)));
      md.querySelector("#pkList").innerHTML = all.filter(n => !qq || n.includes(qq)).map(n => `<button type="button" class="mg-tag c-default${chosen.includes(n) ? " on" : ""}${crew.includes(n) ? "" : " unk"}" data-n="${esc(n)}">${esc(n)}</button>`).join("") || `<div class="mg-note">${crew.length ? "找不到" : "名單裡還沒有 Crew"}</div>`;
      md.querySelectorAll("#pkList [data-n]").forEach(b => b.onclick = () => { const n = b.dataset.n; chosen = chosen.includes(n) ? chosen.filter(x => x !== n) : chosen.concat(n); draw(); });
    };
    let comp = false; const qi = md.querySelector("#pkQ");
    qi.addEventListener("compositionstart", () => comp = true); qi.addEventListener("compositionend", () => { comp = false; draw(); }); qi.addEventListener("input", () => { if (!comp) draw(); });
    md.querySelector("#pkAdd").onclick = () => { const v = md.querySelector("#pkNew").value.trim(); if (v && !chosen.includes(v)) chosen.push(v); md.querySelector("#pkNew").value = ""; draw(); };
    const shut = () => { md.classList.remove("in"); setTimeout(() => md.remove(), 180); };
    md.querySelector("#pkCancel").onclick = shut; md.onclick = (e) => { if (e.target === md) shut(); };
    md.querySelector("#pkOk").onclick = () => { row.b = chosen.join("、"); $("c_tblBox").innerHTML = ctTable(); shut(); };
    draw();
  }
  function bindCase(r, isNew) {
    if ($("c_troupe") && $("c_tt")) $("c_troupe").addEventListener("change", () => { const t0 = (data.troupe || []).find(x => x.id === $("c_troupe").value) || {}; $("c_tt").value = t0["抬頭"] || ""; $("c_tn").value = t0["統編"] || ""; });
    const tb = $("c_tblBox");
    if (tb) tb.onclick = (e) => {
      const rm = e.target.closest("[data-rm]"), add = e.target.closest("[data-add]");
      if (rm) { ctRead(); const [i, j] = rm.dataset.rm.split(":").map(Number); const ns = splitNames(ct.rows[i].b); ns.splice(j, 1); ct.rows[i].b = ns.join("、"); tb.innerHTML = ctTable(); }
      else if (add) pickPeople(+add.dataset.add);
    };
    ov.querySelectorAll("#c_need .mg-tag").forEach(b => b.onclick = () => b.classList.toggle("on"));
    [["c_subOn", "c_subBox", "c_td"], ["c_tourOn", "c_tourBox", "c_tour"]].forEach(([ck, box, input]) => { if ($(ck)) $(ck).onchange = () => { $(box).style.display = $(ck).checked ? "" : "none"; if ($(ck).checked) $(input).focus(); }; });
    const regen = () => {   // 新增時：日期改了就重新產生表格（已經填的名字照日期保留）
      if (ct.mode !== "new") return;
      ctRead(); const keep = {}; ct.rows.forEach(x => { if (x.b) keep[x.a] = x.b; });
      ct.rows = T.callRows($("c_s").value, $("c_e").value || $("c_s").value, $("c_l").value).map(x => ({ key: "", a: x[0], b: keep[x[0]] || "" }));
      $("c_tblBox").innerHTML = ctTable();
    };
    $("c_s").onchange = () => { if (!$("c_e").value || $("c_e").value < $("c_s").value) $("c_e").value = $("c_s").value; regen(); };
    $("c_e").onchange = regen; $("c_l").onchange = regen;
    if ($("c_addRow")) $("c_addRow").onclick = () => { ctRead(); ct.rows.push({ key: "", a: "", b: "" }); $("c_tblBox").innerHTML = ctTable(); };
    if ($("c_fillDays")) $("c_fillDays").onclick = () => {
      ctRead(); const have = new Set(ct.rows.map(x => x.a.replace(/\s*\(.*$/, "").trim()));
      T.callRows($("c_s").value, $("c_e").value, $("c_l").value).forEach(([label]) => { if (!have.has(label.replace(/\s*\(.*$/, "").trim())) ct.rows.push({ key: "", a: label, b: "" }); });
      $("c_tblBox").innerHTML = ctTable();
    };
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
      ctRead();
      if (!id) content = { notes: ["抬頭：", "統編："], table: ct.rows.filter(x => x.a || x.b).map(x => [x.a, x.b]) };
      else if (ct && ct.mode === "google") content = { notes: $("c_notes") ? $("c_notes").value.split("\n") : ct.notes, table: ct.rows.filter(x => x.a || x.b).map(x => [x.a, x.b]) };
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
      if (k === "cases" && $("c_tt") && vals["劇團"] && vals["劇團"][0]) {   // 抬頭、統編寫回劇團
        const tid = vals["劇團"][0], t0 = (data.troupe || []).find(x => x.id === tid) || {};
        const tt = $("c_tt").value.trim(), tn = $("c_tn").value.trim();
        if (tt !== (t0["抬頭"] || "") || tn !== (t0["統編"] || "")) { await store().update("troupe", tid, { "抬頭": tt, "統編": tn }); data.troupe = null; await loadKind("troupe", true); }
      }
      if (id) {
        await store().update(k, id, vals);
        if (content && T.cfg.mode === "google") await store().update(k, id, { "內容": content });
        if (k === "cases" && ct && ct.mode === "notion") {   // Notion：只把改過的列寫回頁面裡的表格
          const e2 = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const ups = ct.rows.filter(x => x.key && ct.orig[x.key] !== x.a + "\u0001" + x.b).map(x => ({ old_str: `<tr data-b="${x.key}">`, new_str: `<tr data-b="${x.key}"><td><b>${e2(x.a)}</b></td><td>${e2(x.b).replace(/\n/g, "<br>")}</td></tr>` }));
          if (ups.length) { const m = await window.claude.use("mcp"); await m.callTool("Notion", "notion-update-page", { page_id: id, command: "update_content", content_updates: ups }); }
        }
      }
      else await store().create(k, vals, k === "cases" ? content : null);
      dirty = true;
      const md = ov.querySelector(".mg-modal"); if (md) md.remove();
      await loadKind(k, true);
      if (id) { edit(k, id); if (T.toast) T.toast("已儲存"); } else list();
    } catch (e) { errEl.textContent = "儲存失敗：" + ((e && e.message) || e); btn.disabled = false; btn.textContent = id ? "儲存" : "新增"; }
  }

  // 往下拉重新整理：清掉這頁的資料重新向雲端讀
  T.manageRefresh = async () => {
    if (!ov || ov.querySelector(".mg-modal") || $("mgCancel")) return false;
    const kinds = Object.keys(data); data = {}; fields = {};
    if (reBoard) { busy("更新中…"); try { await Promise.all(kinds.map(k => loadKind(k, true))); } catch (e) { fail(e); return true; } reBoard(); }
    else { await Promise.all(kinds.filter(k => k !== tab).map(k => loadKind(k, true).catch(() => {}))); await list(true); }
    return true;
  };
  T.openManage = open;
  T.closeManage = close;
})();
