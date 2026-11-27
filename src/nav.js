// 劇場幫幫｜下方分頁列：案子・找人・打卡・結案・名單
// 找人／打卡／結案 是原本的三個模式；案子、名單 是資料庫畫面（嵌在頁面裡，不是彈出）
(() => {
  const T = window.__tdh;
  const I = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const TABS = [
    ["cases", "案子", I('<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>')],
    ["find", "找人", I('<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19c.8-3.4 3.4-5.2 6.5-5.2 1.4 0 2.7.4 3.8 1.1"/><path d="M18 14v6M15 17h6"/>')],
    ["live", "打卡", I('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.8h5"/>')],
    ["close", "結案", I('<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M9 9v11"/>')],
    ["lists", "名單", I('<path d="M16 19v-1.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 17.8V19"/><circle cx="10" cy="7.5" r="3.5"/><path d="M20 19v-1.2a3.8 3.8 0 0 0-2.8-3.6M15.5 4.2a3.6 3.6 0 0 1 0 6.6"/>')],
  ];
  const css = `
  :root{--tab-h:58px}
  .tdh-toprow{display:none!important}
  .wrap{padding-bottom:calc(170px + var(--tab-h))!important}
  .bar{bottom:calc(var(--tab-h) + env(safe-area-inset-bottom))!important;padding-bottom:10px!important;z-index:13}
  .tdh-tabbar{position:fixed;left:0;right:0;bottom:0;z-index:15;background:color-mix(in srgb,var(--card) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
  .tdh-tabbar>div{max-width:560px;margin:0 auto;display:flex;height:var(--tab-h)}
  .tdh-tabbar button{flex:1;border:0;background:transparent;color:var(--muted);font:inherit;font-family:"Noto Sans TC",-apple-system,sans-serif;font-size:11px;font-weight:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .tdh-tabbar button.on{color:var(--accent);font-weight:700}
  .tdh-tabbar button.on svg{stroke-width:2.3}
  body.tdh-sheet-open .tdh-tabbar{display:none}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  let cur = null;
  function show(tab, opt = {}) {
    if (!TABS.some(t => t[0] === tab)) tab = "find";
    cur = tab;
    try { localStorage.setItem("tdh.tab", tab); } catch (e) {}
    document.querySelectorAll(".tdh-tabbar button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
    if (tab === "cases" || tab === "lists") { const fb = document.getElementById("findBar"); if (fb) fb.hidden = true; T.openManage({ embed: true, section: tab, caseId: opt.caseId }); return; }
    if (T.closeManage && T.closeManage(tab)) return;   // 資料有改過 → 重新載入（會回到這個分頁）
    const m = document.querySelector(`.mode[data-m="${tab}"]`);
    if (m) m.click();
    if (opt.caseId) setTimeout(function pick(n = 0) {   // 從案子頁跳過來：選到那個案子
      const sel = document.getElementById("caseSel");
      const o = sel && [...sel.options].find(x => x.value.replace(/-/g, "").includes(opt.caseId));
      if (o) { sel.value = o.value; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      else if (n < 30) setTimeout(() => pick(n + 1), 200);
    }, 50);
    window.scrollTo(0, 0);
  }
  T.showTab = show;
  T.currentTab = () => cur;

  document.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("nav"); bar.className = "tdh-tabbar";
    bar.innerHTML = `<div>${TABS.map(([k, n, ic]) => `<button type="button" data-t="${k}">${ic}<span>${n}</span></button>`).join("")}</div>`;
    document.body.appendChild(bar);
    bar.querySelectorAll("button").forEach(b => b.onclick = () => show(b.dataset.t));
    // 底部彈出視窗打開時，把分頁列藏起來
    const sheets = ["pSheet", "shotLayer"].map(id => document.getElementById(id)).filter(Boolean);
    const sync = () => document.body.classList.toggle("tdh-sheet-open", sheets.some(el => getComputedStyle(el).display !== "none") || !!document.querySelector(".modal.on,.modal[style*='flex'],.mg-modal"));
    let pend = false; const later = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; sync(); }); };
    new MutationObserver(later).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style", "class"], childList: true });
    let first = "find"; try { first = localStorage.getItem("tdh.tab") || "find"; } catch (e) {}
    setTimeout(() => show(first), 0);
  });
})();
