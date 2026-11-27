// 劇場幫幫｜整體框架（可以在設定切換，方便比較）
//   C ：下方五個分頁（案子・找人・打卡・結案・名單）
//   D1：下方只有三個主功能（找人・打卡・結案，純文字），其他收進左上角選單
//   D2：首頁就是手上的案子，每檔依階段給一個主要按鈕；其他收進左上角選單
// 找人／打卡／結案 是原本的三個模式；案子、Crew、場館、劇團 是資料庫畫面（嵌在頁面裡）
(() => {
  const T = window.__tdh;
  const UIS = ["D1", "D2", "C"];
  // 正式介面是 D1；?ui=C／D2 只給測試比較用（只在這個分頁有效）
  try { const u = new URLSearchParams(location.search).get("ui"); if (u && UIS.includes(u.toUpperCase())) { sessionStorage.setItem("tdh.ui", u.toUpperCase()); localStorage.removeItem("tdh.tab"); history.replaceState(null, "", location.pathname + location.hash); } } catch (e) {}
  const ui = () => { let u = ""; try { u = sessionStorage.getItem("tdh.ui") || ""; } catch (e) {} return UIS.includes(u) ? u : "D1"; };
  T.ui = ui;
  const UI = ui();
  const I = (d, w = 24) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const MENU = I('<path d="M4 7h16M4 12h16M4 17h10"/>', 26);
  const CHEV = I('<path d="M9 6l6 6-6 6"/>', 16);

  const css = `
  .tdh-toprow{display:none!important}
  .tdh-tabbar{position:fixed;left:0;right:0;bottom:0;z-index:15;background:color-mix(in srgb,var(--card) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
  .tdh-tabbar>div{max-width:560px;margin:0 auto;display:flex;height:var(--tab-h)}
  .tdh-tabbar button{flex:1;border:0;background:transparent;color:var(--muted);font:inherit;font-family:"Noto Sans TC",-apple-system,sans-serif;font-size:11px;font-weight:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .tdh-tabbar button.on{color:var(--accent);font-weight:700}
  .tdh-tabbar button.on svg{stroke-width:2.3}
  .tdh-tabbar.text button{font-size:15px;letter-spacing:.08em}
  .tdh-tabbar.text button{position:relative;transition:color .25s ease,transform .12s}
  .tdh-tabbar.text button::after{content:"";position:absolute;top:0;left:30%;right:30%;height:3px;border-radius:0 0 3px 3px;background:var(--accent);transform:scaleX(0);transition:transform .32s cubic-bezier(.2,.8,.2,1)}
  .tdh-tabbar.text button.on::after{transform:scaleX(1)}
  .tdh-tabbar button:active{transform:scale(.94)}
  @keyframes tdhViewIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .tdh-vin{animation:tdhViewIn .32s cubic-bezier(.2,.8,.2,1) both}
  .mg.embed{animation:tdhViewIn .3s cubic-bezier(.2,.8,.2,1) both}
  .toast{top:calc(env(safe-area-inset-top) + 64px)!important;bottom:auto!important;z-index:9600!important;transform:translateX(-50%) translateY(-14px) scale(.96)!important;transition:opacity .22s ease,transform .3s cubic-bezier(.2,.8,.2,1)!important;box-shadow:0 8px 24px -8px rgba(0,0,0,.35)}
  .toast.show{transform:translateX(-50%) translateY(0) scale(1)!important}
  button,.card,.chip{-webkit-tap-highlight-color:transparent}
  .tdh-sx{position:relative;display:block}.tdh-sx>input{padding-right:38px!important}
  .tdh-sxc{position:absolute;right:9px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:11px;border:0;background:color-mix(in srgb,var(--muted) 45%,var(--bg));color:var(--card);font-size:11px;font-weight:700;line-height:22px;padding:0;cursor:pointer;margin-top:-1px}
  .casesel{appearance:none;-webkit-appearance:none;font-size:16px!important;font-weight:800;letter-spacing:.01em;padding:9px 40px 9px 14px!important;border-radius:13px!important;border:1.5px solid var(--line)!important;background:var(--card)!important;box-shadow:0 4px 14px -10px rgba(0,0,0,.35);cursor:pointer;margin:2px 0 6px!important;text-overflow:ellipsis;transition:border-color .2s}
  .casesel:focus{outline:none;border-color:var(--accent)!important}
  .pstick::before{content:"";position:absolute;right:18px;top:20px;width:8px;height:8px;border-right:2.4px solid var(--muted);border-bottom:2.4px solid var(--muted);transform:rotate(45deg);pointer-events:none;z-index:1}
  .more>summary{list-style:none}.more>summary::-webkit-details-marker{display:none}
  .more>summary::before{content:"";flex:0 0 auto;width:6px;height:6px;border-right:2px solid currentColor;border-top:2px solid currentColor;transform:rotate(45deg);margin:0 2px 0 1px;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
  .more[open]>summary::before{transform:rotate(135deg)}
  .pstick .sum{padding:10px 14px!important;border-radius:14px!important;margin:0 0 8px!important;align-items:flex-end}
  .pstick .sum-n{font-size:28px!important}
  .pstick .sum-l{display:flex;align-items:center}
  .pstick .sum-r{font-size:11px!important;line-height:1.5!important}
  .pstick .prog{margin-top:8px}.pstick .prog-t{font-size:11px;margin-bottom:4px}.pstick .prog-b{height:6px}
  .tdh-drawer [hidden]{display:none!important}
  .tdh-drawer .donate{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;text-align:left;margin:0 6px 8px;padding:10px 12px;border-radius:12px;border:1px dashed var(--line);background:transparent;color:var(--ink);font:inherit;cursor:pointer;transition:background .2s,transform .12s}
  .tdh-drawer .donate span{grid-row:span 2;font-size:20px}.tdh-drawer .donate b{font-size:14px}.tdh-drawer .donate small{font-size:11.5px;color:var(--muted)}
  .tdh-drawer .donate:active{transform:scale(.98);background:var(--sel)}
  .tdh-solo .day .crew,.tdh-solo .day .crewx{display:none!important}
  .mine-card{font-size:14px;margin:4px 0 12px}.mine-card .shot-card{box-shadow:0 6px 22px -12px rgba(0,0,0,.35)}
  .sum.tap{flex-wrap:wrap;cursor:pointer;transition:transform .15s}.sum.tap:active{transform:scale(.985)}
  .sum-go{display:inline-flex;align-items:center;gap:4px;margin-left:8px;font-size:11px;padding:1px 8px;border-radius:9px;border:1px solid currentColor;opacity:.9}
  .sum-go::after{content:"";width:5px;height:5px;border-right:1.5px solid currentColor;border-top:1.5px solid currentColor;transform:rotate(45deg)}
  .prog{flex:0 0 100%;margin-top:12px}
  .prog-t{display:flex;justify-content:space-between;font-size:12px;opacity:.85;margin-bottom:6px}
  .prog-t span:last-child{font-weight:700;opacity:1}
  .prog-b{height:8px;border-radius:4px;background:color-mix(in srgb,var(--bg) 22%,transparent);overflow:hidden}
  .prog-b i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#7fd1a8,#f2c46d,#ef8a5b);background-size:max(100%,260px) 100%;position:relative;overflow:hidden;transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
  .prog-b i::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:progShine 2.6s ease-in-out infinite}
  @keyframes progShine{to{transform:translateX(100%)}}
  .bk-new{margin-top:12px}
  .bk-newbtn{width:100%;padding:11px;border-radius:12px;border:1.5px dashed var(--line);background:transparent;color:var(--accent);font:inherit;font-weight:700;cursor:pointer}
  .bk-newrow{display:flex;gap:8px}.bk-newrow input{flex:1}
  .bk-newrow button{border:0;border-radius:10px;padding:0 16px;background:var(--accent);color:var(--accent-ink,#fff);font:inherit;font-weight:700;cursor:pointer}
  @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  body.tdh-sheet-open .tdh-tabbar{display:none}
  .wrap{padding-bottom:calc(170px + var(--tab-h))!important}
  .bar{bottom:calc(var(--tab-h) + env(safe-area-inset-bottom))!important;padding-bottom:10px!important;z-index:13}
  .tdh-menu{flex:0 0 auto;width:38px;height:38px;margin:0 4px 0 -8px;border:0;background:transparent;color:var(--ink);border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
  .tdh-menu:active{background:var(--line)}
  body.tdh-d header{justify-content:flex-start!important;gap:2px}
  body.tdh-d header h1{flex:1;min-width:0}
  body.tdh-d #refresh,body.tdh-d #pRefresh{display:none!important}
  .tdh-drawer{position:fixed;inset:0;z-index:9500;pointer-events:none}
  .tdh-drawer .sh{position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .3s,backdrop-filter .3s}
  .tdh-drawer .pn{position:absolute;top:0;bottom:0;left:0;width:min(80vw,320px);background:var(--bg);box-shadow:4px 0 24px rgba(0,0,0,.18);transform:translateX(-102%);transition:transform .34s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;padding:calc(18px + env(safe-area-inset-top)) 12px calc(14px + env(safe-area-inset-bottom));font-family:"Noto Sans TC",-apple-system,sans-serif;color:var(--ink)}
  .tdh-drawer.open{pointer-events:auto}.tdh-drawer.open .sh{background:rgba(0,0,0,.38);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}.tdh-drawer.open .pn{transform:none}
  .tdh-drawer h2{font-size:20px;font-weight:700;margin:2px 10px 14px}
  .tdh-drawer .new{display:flex;align-items:center;gap:8px;margin:0 4px 12px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font:inherit;font-size:15px;font-weight:700;padding:12px 14px;cursor:pointer}
  .tdh-drawer .grp{font-size:12px;color:var(--muted);font-weight:600;margin:14px 10px 4px}
  .tdh-drawer .it{display:flex;align-items:center;width:100%;border:0;background:transparent;color:var(--ink);font:inherit;font-size:16px;text-align:left;padding:11px 10px;border-radius:10px;cursor:pointer}
  .tdh-drawer .it.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-weight:700}
  .tdh-drawer .sp{flex:1}
  .tdh-drawer .db .car{display:inline-flex;color:var(--muted);transition:transform .32s cubic-bezier(.2,.8,.2,1)}.tdh-drawer .db.open .car{transform:rotate(90deg)}
  .tdh-drawer .scr{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;margin:0 -12px;padding:0 12px 10px}
  .tdh-drawer .dbl{display:grid;grid-template-rows:0fr;transition:grid-template-rows .34s cubic-bezier(.2,.8,.2,1)}
  .tdh-drawer .dbl>div{min-height:0;overflow:hidden}
  .tdh-drawer .dbl.open{grid-template-rows:1fr}
  .tdh-drawer .dbl .it.sub,.tdh-drawer .dbl .none{opacity:0;transform:translateX(-10px);transition:opacity .22s ease,transform .3s cubic-bezier(.2,.8,.2,1)}
  .tdh-drawer .dbl.open .it.sub,.tdh-drawer .dbl.open .none{opacity:1;transform:none}
  .tdh-drawer .dbl.open>div>*:nth-child(2){transition-delay:.04s}.tdh-drawer .dbl.open>div>*:nth-child(3){transition-delay:.08s}.tdh-drawer .dbl.open>div>*:nth-child(4){transition-delay:.12s}.tdh-drawer .dbl.open>div>*:nth-child(5){transition-delay:.16s}.tdh-drawer .dbl.open>div>*:nth-child(n+6){transition-delay:.2s}
  .tdh-drawer .it{transition:background .18s,transform .12s}.tdh-drawer .it:active{transform:scale(.98);background:var(--sel)}
  .tdh-drawer .new{transition:transform .12s,filter .2s}.tdh-drawer .new:active{transform:scale(.97)}
  .tdh-drawer .it,.tdh-drawer .it.sub{font-weight:700}
  .tdh-drawer .sync{font-size:11.5px;color:var(--muted);margin:6px 10px 8px;line-height:1.5}
  .tdh-drawer .it.sub{font-size:14.5px;padding:6px 10px 6px 22px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.tdh-drawer .it.sub.on{color:var(--accent);font-weight:700}
  .tdh-drawer .dbl>div{padding-bottom:2px}.tdh-drawer .none{font-size:13px;color:var(--muted);padding:4px 22px 6px}
  .tdh-drawer .ic{display:inline-flex;margin-right:10px;color:var(--muted)}
  .tdh-drawer .foot{border-top:1px solid var(--line);padding-top:8px}
  .tdh-drawer .ver{font-size:11px;color:var(--muted);margin:6px 10px 0}
  .tdh-ptr{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));z-index:9400;transform:translate(-50%,-70px);background:var(--card);color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:13px "Noto Sans TC",sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.12);transition:transform .15s}
  .tdh-home{position:fixed;inset:0;z-index:14;background:var(--bg);color:var(--ink);overflow:auto;-webkit-overflow-scrolling:touch;font-family:"Noto Sans TC",-apple-system,"PingFang TC",sans-serif}
  .tdh-home .in{max-width:560px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 14px calc(40px + env(safe-area-inset-bottom))}
  .tdh-home .hd{display:flex;align-items:center;gap:2px;margin-bottom:4px}.tdh-home .hd h1{font-size:24px;font-weight:700;margin:0;flex:1}
  .tdh-home .sub{font-size:12px;color:var(--muted);margin:0 2px 14px}
  .tdh-home .hm-stg{font-size:12px;color:var(--muted);font-weight:600;margin:18px 2px 8px;letter-spacing:.02em}
  .tdh-home .cd{background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:13px 14px;margin-bottom:10px}
  .tdh-home .cd .t{display:flex;align-items:baseline;gap:8px}.tdh-home .cd .t b{font-size:16px;flex:1}
  .tdh-home .pill{font-size:12px;font-weight:700;border-radius:999px;padding:2px 9px;white-space:nowrap}
  .tdh-home .p-find{background:var(--yellow);color:var(--yellow-ink)}.tdh-home .p-live{background:var(--sel);color:var(--accent)}.tdh-home .p-close{background:var(--blue);color:var(--blue-ink)}.tdh-home .p-ok{background:var(--line);color:var(--muted)}
  .tdh-home .cd small{display:block;color:var(--muted);font-size:12.5px;margin-top:4px;line-height:1.6}
  .tdh-home .tg{display:inline-block;font-size:12px;border-radius:6px;padding:1px 7px;margin:6px 4px 0 0;background:var(--yellow);color:var(--yellow-ink)}
  .tdh-home .bt{display:flex;gap:8px;margin-top:11px}
  .tdh-home .bt button{flex:1;border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:9px 6px;font:inherit;font-size:14px;cursor:pointer}
  .tdh-home .bt button.pri{flex:1.6;background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
  .tdh-home .empty{background:var(--card);border:1px dashed var(--line);border-radius:14px;text-align:center;color:var(--muted);padding:26px 12px;font-size:14px;line-height:1.7}
  .tdh-home .add{display:block;width:100%;margin-top:16px;border:1px dashed var(--accent);background:transparent;color:var(--accent);border-radius:14px;padding:13px;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
  .card.tdh-flash{animation:tdhFlash 1.6s ease}
  @keyframes tdhFlash{0%,60%{box-shadow:0 0 0 3px var(--accent)}100%{box-shadow:0 0 0 0 transparent}}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  document.documentElement.style.setProperty("--tab-h", UI === "C" ? "58px" : UI === "D1" ? "52px" : "0px");

  // ---------- 切換畫面 ----------
  let cur = null;
  const MODES = ["find", "live", "close"];
  const fb = () => document.getElementById("findBar");
  function later(fn, n = 0) { if (!fn() && n < 40) setTimeout(() => later(fn, n + 1), 200); }
  function goMode(m, opt = {}) {
    if (T.closeManage && T.closeManage(m)) return;
    closeHome();
    const b = document.querySelector(`.mode[data-m="${m}"]`); if (b) b.click();
    window.scrollTo(0, 0);
    const w = document.querySelector(".wrap"); if (w) { w.classList.remove("tdh-vin"); void w.offsetWidth; w.classList.add("tdh-vin"); }
    const pickTab = () => { if (!opt.ptab) return true; const t = document.querySelector(`.ptabs button[data-t="${opt.ptab}"]`); if (t) { t.click(); return true; } return false; };
    if (opt.caseId && m !== "find") setTimeout(() => later(() => {   // 選到那個案子
      const sel = document.getElementById("caseSel");
      const o = sel && [...sel.options].find(x => x.value.replace(/-/g, "").includes(opt.caseId));
      if (!o) return false;
      if (sel.value !== o.value) { sel.value = o.value; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      setTimeout(() => later(pickTab), 150); return true;
    }), 60);
    else if (opt.ptab) setTimeout(() => later(pickTab), 60);
    if (opt.caseId && m === "find") setTimeout(() => later(() => {   // 找人：捲到那個案子並閃一下
      const c = [...document.querySelectorAll("#list .card")].find(x => (x.dataset.url || "").replace(/-/g, "").includes(opt.caseId));
      if (!c) return false;
      c.scrollIntoView({ behavior: "smooth", block: "center" }); c.classList.remove("tdh-flash"); void c.offsetWidth; c.classList.add("tdh-flash"); return true;
    }), 60);
  }
  function show(view, opt = {}) {
    const prev = cur;
    cur = view;
    try { localStorage.setItem("tdh.tab", view); } catch (e) {}
    document.querySelectorAll(".tdh-tabbar button").forEach(b => b.classList.toggle("on", b.dataset.t === view));
    closeDrawer();
    if (MODES.includes(view)) return goMode(view, opt);
    if (view === "home") { if (T.closeManage && T.closeManage("home")) return; openHome(); return; }
    closeHome();
    if (fb()) fb().hidden = true;
    if (UI === "C") { T.openManage({ section: view === "lists" ? "lists" : "cases", caseId: opt.caseId, scrollTo: opt.scrollTo, from: opt.caseId && prev !== view ? prev : null }); return; }
    T.openManage({ only: view, caseId: opt.caseId, add: opt.add, scrollTo: opt.scrollTo, from: opt.caseId && prev !== view ? prev : null });
  }
  T.showTab = (v, opt) => show(v === "lists" && UI !== "C" ? "crew" : v, opt);
  T.currentTab = () => cur;

  // ---------- 左側選單（D1、D2） ----------
  let drawer = null;
  const SOLO = !!(T.cfg && T.cfg.use === "solo") && UI !== "C";
  const DONATE_URL = "";   // 贊助連結：之後填上就會生效
  function buildDrawer() {
    drawer = document.createElement("div"); drawer.className = "tdh-drawer";
    const main = UI === "D2" ? [["home", "首頁"], ["find", "找人"], ["live", "每日打卡"], ["close", "結案"]] : [];
    drawer.innerHTML = `<div class="sh"></div><div class="pn"><h2>劇場幫幫</h2><div class="scr">
      <button class="new" data-new="1">＋ 新增案子</button>
      ${main.map(([v, t]) => `<button class="it" data-v="${v}">${t}</button>`).join("")}
      <button class="it" data-v="cases">我的案子</button>
      <button class="it db" id="rcTog"><span style="flex:1">最近項目</span><span class="car">${CHEV}</span></button>
      <div class="dbl" id="rcWrap"><div id="rcList"></div></div>
      <button class="it db" id="dbTog" ${SOLO ? "hidden" : ""}><span style="flex:1">資料庫</span><span class="car">${CHEV}</span></button>
      <div class="dbl" id="dbWrap" ${SOLO ? "hidden" : ""}><div id="dbList">${[["troupe", "劇團"], ["crew", "Crew"], ["venue", "場館"]].map(([v, t]) => `<button class="it sub" data-v="${v}">${t}</button>`).join("")}</div></div>
      </div>
      <div class="sync" id="drSync"></div>
      <button class="donate" id="drDonate"><span>☕</span><b>支持劇場幫幫</b><small>維護需要時間和成本，喜歡的話請我喝杯咖啡</small></button>
      <div class="foot"><button class="it" data-set="1"><span class="ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.9 4.6 1.7 1.7 0 0 0 9.97 3.04V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.26.6.85 1 1.51 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg></span>設定</button>${UI !== "D1" ? `<div class="ver">介面 ${UI}（測試）</div>` : ""}</div></div>`;
    document.body.appendChild(drawer);
    drawer.querySelector(".sh").onclick = closeDrawer;
    drawer.querySelectorAll("[data-v]").forEach(b => b.onclick = () => show(b.dataset.v));
    drawer.querySelector("[data-new]").onclick = () => show("cases", { add: true });
    drawer.querySelector("#drDonate").onclick = () => { if (DONATE_URL) window.open(DONATE_URL, "_blank", "noopener"); else if (T.toast) T.toast("贊助連結準備中，謝謝你！"); };
    [["#dbTog", "#dbWrap"], ["#rcTog", "#rcWrap"]].forEach(([t, l]) => drawer.querySelector(t).onclick = () => { const el = drawer.querySelector(l), on = !el.classList.contains("open"); el.classList.toggle("open", on); drawer.querySelector(t).classList.toggle("open", on); });
    drawer.querySelector("[data-set]").onclick = () => { T.openSettings && T.openSettings(() => openDrawer()); setTimeout(() => drawer.classList.remove("open"), 250); };
    let x0 = null;   // 往左滑關閉
    drawer.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    drawer.addEventListener("touchend", e => { if (x0 !== null && e.changedTouches[0].clientX - x0 < -60) closeDrawer(); x0 = null; });
  }
  function openDrawer() {
    if (!drawer) buildDrawer();
    drawer.querySelectorAll(".it[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === cur));
    if (["troupe", "crew", "venue"].includes(cur)) { drawer.querySelector("#dbWrap").classList.add("open"); drawer.querySelector("#dbTog").classList.add("open"); }
    const at = T.snap ? T.snap.syncAt() : 0, sy = drawer.querySelector("#drSync");
    if (sy) { const d = new Date(at); sy.textContent = at ? `資料更新於 ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}・往下拉可重新整理` : ""; }
    let rc = []; try { rc = JSON.parse(localStorage.getItem("tdh.recent") || "[]"); } catch (e) {}   // 最近看過的案子
    const rl = drawer.querySelector("#rcList");
    rl.innerHTML = rc.length ? rc.map(x => `<button class="it sub" data-rc="${esc(x.id)}">${esc(x.title)}</button>`).join("") : `<div class="none">還沒有看過的案子</div>`;
    rl.querySelectorAll("[data-rc]").forEach(b => b.onclick = () => show("cases", { caseId: b.dataset.rc }));
    requestAnimationFrame(() => drawer.classList.add("open"));
  }
  function closeDrawer() { if (drawer) drawer.classList.remove("open"); }
  T.menuButton = () => { const b = document.createElement("button"); b.className = "tdh-menu"; b.type = "button"; b.setAttribute("aria-label", "選單"); b.innerHTML = MENU; b.onclick = openDrawer; return b; };

  // ---------- D2 首頁：手上的案子 ----------
  let home = null;
  const WK = "日一二三四五六";
  const md = (iso) => { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return `${d.getMonth() + 1}/${d.getDate()}(${WK[d.getDay()]})`; };
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function closeHome() { if (home) { home.remove(); home = null; document.documentElement.style.overflow = ""; } }
  async function openHome() {
    closeHome(); if (fb()) fb().hidden = true;
    home = document.createElement("div"); home.className = "tdh-home";
    home.innerHTML = `<div class="in"><div class="hd"><span id="hmMenu"></span><h1>我的案子</h1></div><div class="sub" id="hmSub">讀取中…</div><div id="hmList"></div><button class="add" id="hmAdd">＋ 新增案子</button></div>`;
    document.body.appendChild(home); document.documentElement.style.overflow = "hidden";
    home.querySelector("#hmMenu").replaceWith(T.menuButton());
    home.querySelector("#hmAdd").onclick = () => show("cases", { add: true });
    const me = home;
    try {
      const [cases, troupes, venues] = await Promise.all(["cases", "troupe", "venue"].map(k => T.store().list(k)));
      if (home !== me) return;
      const nm = (arr, id, f) => { const r = arr.find(x => x.id === id); return r ? r[f] : ""; };
      const today = T.isoDay(new Date()), back = new Date(); back.setDate(back.getDate() - 21); const cut = T.isoDay(back);
      const rows = cases.filter(c => !c["封存"] && (!c["職位"] || T.LEAD.includes(c["職位"])) && c["進場日期"] && (c["進場日期"].end || c["進場日期"].start) >= cut).map(c => {
        const s = c["進場日期"].start, e = c["進場日期"].end || s, l = (c["裝車時間"] || {}).start || s;
        const first = l < s ? l : s;
        return { c, s, e, l, stage: today < first ? "find" : today <= e ? "live" : "close" };
      }).sort((a, b) => a.s.localeCompare(b.s));
      let h = "";
      [["live", "進場中"], ["find", "還沒進場"], ["close", "等結案"]].forEach(([stg, label]) => {
        const g = rows.filter(r => r.stage === stg); if (!g.length) return;
        h += `<div class="hm-stg">${label}</div>` + g.map(({ c, s, e, l, stage }) => {
          const tr = (c["劇團"] || []).map(id => nm(troupes, id, "劇團名稱")).filter(Boolean).join("、");
          const vn = (c["進場地點"] || []).map(id => nm(venues, id, "場館名稱")).filter(Boolean).join("、");
          const tags = c["Crew 狀態"] || [], done = tags.includes("全部完成"), need = tags.filter(x => /缺/.test(x));
          const pill = stage === "find" ? (done ? `<span class="pill p-ok">人找齊了</span>` : `<span class="pill p-find">找人中</span>`) : stage === "live" ? `<span class="pill p-live">進場中</span>` : `<span class="pill p-close">等結案</span>`;
          const btn = stage === "find" ? `${done ? "" : `<button class="pri" data-go="find">找人</button>`}<button data-go="case">排班表</button>`
            : stage === "live" ? `<button class="pri" data-go="live">今天收工，打卡</button><button data-go="case">排班表</button>`
            : `<button class="pri" data-go="sheet">時段表</button><button data-go="give">對帳卡</button><button data-go="shot">截圖</button>`;
          return `<div class="cd" data-id="${c.id}"><div class="t"><b>${esc(tr ? `${tr}《${c["案名"]}》` : c["案名"])}</b>${pill}</div>
            <small>${l < s ? md(l) + " 裝車・" : ""}${md(s)}${e !== s ? " – " + md(e) : ""}${vn ? "　@" + esc(vn) : ""}</small>
            ${stage === "find" && !done ? need.map(x => `<span class="tg">${esc(x)}</span>`).join("") : ""}
            <div class="bt">${btn}</div></div>`;
        }).join("");
      });
      me.querySelector("#hmSub").textContent = rows.length ? `手上 ${rows.length} 檔` : "";
      me.querySelector("#hmList").innerHTML = h || `<div class="empty">最近沒有案子。<br>按下面的「＋ 新增案子」開始。</div>`;
      me.querySelectorAll(".cd [data-go]").forEach(b => b.onclick = () => {
        const id = b.closest(".cd").dataset.id, g = b.dataset.go;
        if (g === "case") show("cases", { caseId: id });
        else if (g === "find") show("find", { caseId: id });
        else if (g === "live") show("live", { caseId: id, ptab: "punch" });
        else show("close", { caseId: id, ptab: g });
      });
    } catch (e) { if (home === me) me.querySelector("#hmSub").textContent = "讀取失敗：" + (e.message || e); }
  }

  // ---------- 往下拉重新整理、回到 app 時自動更新 ----------
  async function refreshNow() {
    if (document.querySelector(".mg.embed")) {
      try { const m = await window.claude.use("mcp"); await m.invalidate("Notion"); } catch (e) {}
      if (T.manageRefresh) { await T.manageRefresh(); T.toast && T.toast("已更新"); }
      return;
    }
    if (home) { if (T.gstore) T.gstore.invalidate(); openHome(); return; }
    const m = document.querySelector(".mode.on"); const v = m ? m.dataset.m : "find";
    const b = document.getElementById(v === "find" ? "refresh" : "pRefresh"); if (b) b.click();
  }
  T.refreshNow = refreshNow;
  function setupPull() {
    const tip = document.createElement("div"); tip.className = "tdh-ptr"; tip.textContent = "放開重新整理"; document.body.appendChild(tip);
    let y0 = null, dy = 0;
    document.addEventListener("touchstart", e => {
      const emb = document.querySelector(".mg.embed");
      if (document.querySelector(".mg:not(.embed), .tdh-ov, .tdh-drawer.open, .mg-modal") || document.body.classList.contains("tdh-sheet-open")) { y0 = null; return; }
      const sc = emb ? emb.querySelector("#mgScroll") : null;
      const top = sc ? sc.scrollTop : home ? home.scrollTop : window.scrollY;
      y0 = top <= 0 ? e.touches[0].clientY : null; dy = 0;
    }, { passive: true });
    document.addEventListener("touchmove", e => {
      if (y0 === null) return; dy = e.touches[0].clientY - y0;
      if (dy > 10) { tip.style.transform = `translate(-50%,${Math.min(dy, 120) - 70}px)`; tip.textContent = dy > 80 ? "放開重新整理" : "往下拉重新整理"; }
    }, { passive: true });
    document.addEventListener("touchend", () => {
      if (y0 !== null && dy > 80) { tip.textContent = "更新中…"; refreshNow(); setTimeout(() => { tip.style.transform = ""; }, 900); }
      else tip.style.transform = "";
      y0 = null; dy = 0;
    });
    // 不再自動更新：資料先用手機裡存的，想看最新就往下拉
  }

  // ---------- 啟動 ----------
  document.addEventListener("DOMContentLoaded", () => {
    if (UI !== "C") {
      document.body.classList.add("tdh-d");
      document.querySelectorAll("#findView header, #punchView header").forEach(h => h.insertBefore(T.menuButton(), h.firstChild));
      setupPull();
    }
    const TABS = UI === "C" ? [
      ["cases", "案子", I('<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>')],
      ["find", "找人", I('<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19c.8-3.4 3.4-5.2 6.5-5.2 1.4 0 2.7.4 3.8 1.1"/><path d="M18 14v6M15 17h6"/>')],
      ["live", "打卡", I('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.8h5"/>')],
      ["close", "結案", I('<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M9 9v11"/>')],
      ["lists", "名單", I('<path d="M16 19v-1.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 17.8V19"/><circle cx="10" cy="7.5" r="3.5"/><path d="M20 19v-1.2a3.8 3.8 0 0 0-2.8-3.6M15.5 4.2a3.6 3.6 0 0 1 0 6.6"/>')],
    ] : UI === "D1" ? (SOLO ? [["live", "打卡", ""], ["close", "我的明細", ""]] : [["find", "找人", ""], ["live", "打卡", ""], ["close", "結案", ""]]) : [];
    if (TABS.length) {
      const bar = document.createElement("nav"); bar.className = "tdh-tabbar" + (UI === "D1" ? " text" : "");
      bar.innerHTML = `<div>${TABS.map(([k, n, ic]) => `<button type="button" data-t="${k}">${ic}<span>${n}</span></button>`).join("")}</div>`;
      document.body.appendChild(bar);
      bar.querySelectorAll("button").forEach(b => b.onclick = () => show(b.dataset.t));
    }
    const sheets = ["pSheet", "shotLayer"].map(id => document.getElementById(id)).filter(Boolean);
    const sync = () => document.body.classList.toggle("tdh-sheet-open", sheets.some(el => getComputedStyle(el).display !== "none") || !!document.querySelector(".modal.on,.mg-modal"));
    // 所有搜尋欄右邊都有 ✕ 可以一鍵清除
    const decorate = () => document.querySelectorAll('input[placeholder^="搜尋"]:not([data-sx])').forEach(inp => {
      inp.dataset.sx = "1";
      if (inp.parentElement && inp.parentElement.querySelector(".mg-clr")) return;
      const w = document.createElement("span"); w.className = "tdh-sx";
      inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
      const b = document.createElement("button"); b.type = "button"; b.className = "tdh-sxc"; b.setAttribute("aria-label", "清除"); b.textContent = "✕"; w.appendChild(b);
      const syncB = () => { b.style.display = inp.value ? "" : "none"; w.style.display = inp.style.display === "none" ? "none" : ""; };
      inp.addEventListener("input", syncB); syncB();
      b.onclick = () => { inp.value = ""; inp.dispatchEvent(new Event("input", { bubbles: true })); syncB(); inp.focus(); };
    });
    let pend = false; const tick = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; sync(); decorate(); }); };
    new MutationObserver(tick).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style", "class"], childList: true });
    let first = UI === "D2" ? "home" : "find"; try { first = localStorage.getItem("tdh.tab") || first; } catch (e) {}
    const ok = UI === "C" ? ["cases", "find", "live", "close", "lists"] : UI === "D1" ? ["find", "live", "close", "cases", "crew", "venue", "troupe"] : ["home", "find", "live", "close", "cases", "crew", "venue", "troupe"];
    if (SOLO) { const i = ok.indexOf("find"); if (i >= 0) ok.splice(i, 1); document.documentElement.classList.add("tdh-solo"); }
    if (!ok.includes(first)) first = UI === "D2" ? "home" : SOLO ? "live" : "find";
    setTimeout(() => show(first), 0);
  });
})();
