// 劇場幫幫｜第一次打開：小教學＋幾筆【測試】資料
(() => {
  const T = window.__tdh;
  const TAG = "【測試】";
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const solo = () => T.solo && T.solo();

  // ---------- 測試資料 ----------
  async function seedSamples() {
    const st = T.store();
    const ex = (r) => /^（範例）/.test(String(r["案名"] || ""));
    const [cs, cr, vn, tr] = await Promise.all(["cases", "crew", "venue", "troupe"].map(k => st.list(k, true).catch(() => [{}])));
    if (cs.filter(r => !ex(r)).length || cr.length || vn.length || tr.length) return false;   // 已經有自己的資料就不放
    for (const r of cs.filter(ex)) { try { await st.remove("cases", r.id); } catch (e) {} }   // 換成更完整的測試資料
    const t1 = await st.create("troupe", { "劇團名稱": TAG + "光點劇團", "抬頭": "光點劇團有限公司（測試）", "統編": "12345678", "聯絡人": "王製作", "電話": "0900-000-001" });
    await st.create("troupe", { "劇團名稱": TAG + "小島劇場", "聯絡人": "李舞監" });
    const v1 = await st.create("venue", { "場館名稱": TAG + "水源劇場", "地區": "雙北地區", "地址": "台北市中正區（測試地址）" });
    await st.create("venue", { "場館名稱": TAG + "城市舞台", "地區": "雙北地區" });
    const names = ["王小明", "陳阿美", "林大偉"];
    const homes = ["台北", "新北", "桃園"];
    for (let i = 0; i < names.length; i++) await st.create("crew", { "姓名": TAG + names[i], "居住地區": homes[i], "電話": "0900-000-10" + i, "備註": "測試用，可以刪掉" });
    const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));   // 下週一
    const s = T.isoDay(d), e = new Date(d); e.setDate(e.getDate() + 2); const ee = T.isoDay(e);
    const l = new Date(d); l.setDate(l.getDate() - 1);
    const rows = T.callRows(s, ee, T.isoDay(l)).map(([a], i) => [a, i % 2 ? TAG + names[0] + "、" + TAG + names[1] : TAG + names[0]]);
    await st.create("cases", { "案名": TAG + "午後的信", "職位": "負責人", "劇團": [t1], "進場日期": { start: s, end: ee }, "裝車時間": { start: T.isoDay(l) }, "裝車地點": "測試倉庫", "進場地點": [v1],
      "人力分配": "測試用：全程 2 人、裝拆 1 人", "Crew 狀態": ["全程缺1", "裝拆缺1"] }, { notes: ["抬頭：", "統編："], table: rows });
    return true;
  }
  async function removeSamples(onStep) {
    const st = T.store(), tf = { cases: "案名", crew: "姓名", venue: "場館名稱", troupe: "劇團名稱" };
    let n = 0;
    for (const k of ["cases", "crew", "venue", "troupe"]) {
      const rows = (await st.list(k, true)).filter(r => String(r[tf[k]] || "").startsWith(TAG));
      // Google 試算表刪列會讓後面的列往上移：從最後一筆往前刪
      for (const r of rows.reverse()) { await st.remove(k, r.id); n++; if (onStep) onStep(n); }
    }
    return n;
  }
  T.removeSamples = removeSamples; T.seedSamples = seedSamples;

  // ---------- 小教學 ----------
  const ICON = {
    hi: '<path d="M7 11.5V6.8a1.6 1.6 0 0 1 3.2 0V11m0-1.5V5.2a1.6 1.6 0 0 1 3.2 0V10m0-.5V6a1.6 1.6 0 0 1 3.2 0v6.5c0 4.2-2.6 7.5-6.6 7.5-2.4 0-3.9-1-5.3-3.2L3.6 14a1.6 1.6 0 0 1 2.6-1.9L7 13"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    find: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19c.8-3.4 3.4-5.2 6.5-5.2 1.4 0 2.7.4 3.8 1.1"/><path d="M18 14v6M15 17h6"/>',
    live: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.8h5"/>',
    close: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M9 9v11"/>',
  };
  const steps = () => solo() ? [
    ["hi", "歡迎使用劇場幫幫", "你選了「個人打卡」模式：每天記自己的上下班，結案時直接拿到自己的時段明細。"],
    ["menu", "先建一個案子", "點左上角 ☰ →「＋ 新增案子」，填案名和進場日期就可以開始。之前建過的都在「我的案子」。"],
    ["live", "每天打卡", "進場那幾天，點上班、下班的時間，段數會自動算好。誤餐、超時點「>」展開來記。"],
    ["close", "我的明細", "結束後到「我的明細」，填上時段費，就能截圖或複製文字傳給製作方。"],
  ] : [
    ["hi", "歡迎使用劇場幫幫", "給劇場人的工作小幫手：找人、每天打卡、結案算時段表。我們先放了幾筆名字有「【測試】」的資料讓你試玩，之後到「設定」可以一鍵刪掉。"],
    ["menu", "左上角 ☰ 是選單", "「＋ 新增案子」：確定接了就建一筆。\n「我的案子」：每一檔的資料和 Call Time。\n「資料庫」：劇團、Crew、場館。"],
    ["find", "找人", "選好案子，點要問的 Crew 就能複製邀請訊息，直接貼到 LINE。對方答應了，按「＋ Crew」記下來。"],
    ["live", "打卡", "進場時每天記上下班時間，段數自動算；誤餐、超時、沒上班也能記。"],
    ["close", "結案", "算好每個人的段數和費用，一鍵產生時段表，存到你的 Google 雲端硬碟。"],
  ];
  function showTour(onDone) {
    if (document.querySelector(".tdh-tour")) return;
    const S = steps(); let i = 0;
    const el = document.createElement("div"); el.className = "tdh-tour";
    el.innerHTML = `<div class="tt-card"><button class="tt-skip" type="button">跳過</button><div class="tt-ic"></div><h2></h2><p></p>
      <div class="tt-dots">${S.map(() => "<i></i>").join("")}</div>
      <div class="tt-btns"><button type="button" class="tt-prev">上一步</button><button type="button" class="tt-next">下一步</button></div></div>`;
    document.body.appendChild(el);
    const draw = (dir) => {
      const [ic, h, p] = S[i], card = el.querySelector(".tt-card");
      el.querySelector(".tt-ic").innerHTML = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[ic]}</svg>`;
      el.querySelector("h2").textContent = h; el.querySelector("p").textContent = p;
      el.querySelectorAll(".tt-dots i").forEach((d, k) => d.classList.toggle("on", k === i));
      el.querySelector(".tt-prev").style.visibility = i ? "" : "hidden";
      el.querySelector(".tt-next").textContent = i === S.length - 1 ? "開始使用" : "下一步";
      if (dir) { card.classList.remove("l", "r"); void card.offsetWidth; card.classList.add(dir); }
    };
    const done = () => { ls("tdh.tour", "1"); el.classList.remove("in"); setTimeout(() => el.remove(), 250); if (onDone) onDone(); };
    el.querySelector(".tt-next").onclick = () => { if (i < S.length - 1) { i++; draw("r"); } else done(); };
    el.querySelector(".tt-prev").onclick = () => { if (i) { i--; draw("l"); } };
    el.querySelector(".tt-skip").onclick = done;
    draw(); requestAnimationFrame(() => el.classList.add("in"));
  }
  T.showTour = showTour;

  const css = document.createElement("style");
  css.textContent = `
  .tdh-tour{position:fixed;inset:0;z-index:9800;background:rgba(0,0,0,0);display:flex;align-items:flex-end;justify-content:center;padding:16px 14px calc(18px + env(safe-area-inset-bottom));transition:background .25s}
  .tdh-tour.in{background:rgba(0,0,0,.45)}
  .tt-card{position:relative;width:100%;max-width:440px;background:var(--card,#fff);color:var(--ink,#1d1b18);border-radius:24px;padding:28px 22px 18px;box-shadow:0 20px 50px -20px rgba(0,0,0,.5);transform:translateY(40px);opacity:0;transition:transform .4s cubic-bezier(.2,.9,.25,1.05),opacity .25s}
  .tdh-tour.in .tt-card{transform:none;opacity:1}
  .tt-card.r{animation:ttR .32s cubic-bezier(.2,.8,.2,1)}.tt-card.l{animation:ttL .32s cubic-bezier(.2,.8,.2,1)}
  @keyframes ttR{from{transform:translateX(18px);opacity:.4}}@keyframes ttL{from{transform:translateX(-18px);opacity:.4}}
  .tt-skip{position:absolute;right:14px;top:12px;border:0;background:transparent;color:var(--muted,#8a8378);font:inherit;font-size:14px;padding:6px 8px;cursor:pointer}
  .tt-ic{width:64px;height:64px;border-radius:20px;background:color-mix(in srgb,var(--accent,#2f5d50) 14%,transparent);color:var(--accent,#2f5d50);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .tt-card h2{font-size:21px;font-weight:800;margin:0 0 8px}
  .tt-card p{font-size:15px;line-height:1.75;color:var(--muted,#6e685f);margin:0;white-space:pre-line;min-height:5.2em}
  .tt-dots{display:flex;gap:6px;margin:18px 0 14px}.tt-dots i{width:7px;height:7px;border-radius:4px;background:var(--line,#ddd);transition:width .3s,background .3s}.tt-dots i.on{width:22px;background:var(--accent,#2f5d50)}
  .tt-btns{display:flex;gap:10px}.tt-btns button{flex:1;border-radius:14px;padding:13px;font:inherit;font-weight:700;font-size:15.5px;cursor:pointer;border:1.5px solid var(--line,#ddd);background:transparent;color:inherit}
  .tt-btns .tt-next{background:var(--accent,#2f5d50);border-color:transparent;color:var(--accent-ink,#fff)}`;
  document.head.appendChild(css);

  // 設定完成、第一次進到主畫面：放測試資料＋小教學
  document.addEventListener("DOMContentLoaded", () => setTimeout(async () => {
    if (document.querySelector(".tdh-ov,#tdhInApp") || !T.cfg.named || !T.cfg.mode) return;
    let seeding = null;
    if (!ls("tdh.seeded")) { ls("tdh.seeded", "1"); seeding = seedSamples().catch(e => { console.warn("測試資料沒放成功", e); return false; }); }
    const after = async () => { if (seeding && await seeding && T.refreshNow) T.refreshNow(); };
    if (!ls("tdh.tour")) showTour(after); else after();
  }, 900));
})();
