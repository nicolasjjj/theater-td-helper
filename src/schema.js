// 劇場幫幫｜資料欄位（Notion 和 Google 試算表共用）
// 欄位型別：title 標題、text 文字、number 數字、select 單選、multi 多選、rel:xxx 關聯、date 日期（可有結束日）、url 網址、checkbox 勾選、content 內文
(() => {
  const NEED_KINDS = [["全程", 4, "blue"], ["裝拆", 9, "yellow"], ["裝台", 4, "green"], ["拆台", 5, "orange"], ["裝車", 4, "gray"], ["卸車", 3, "purple"]];
  const STATUS = [["尚未開始", "gray"], ["等待製作確認", "gray"], ["全部完成", "default"]];
  NEED_KINDS.forEach(([k, n, c]) => { for (let i = 1; i <= n; i++) STATUS.push([`${k}缺${i}`, c]); });
  const AREAS = ["雙北地區", "桃竹苗地區", "中部地區", "南部地區", "東部地區", "海外地區"];
  const HOMES = ["台北", "新北", "桃園", "台中", "台南", "高雄", "其他"];
  const SCHEMA = {
    cases: { db: "劇場の案子", tab: "案子", label: "案子", icon: "🎪", fields: [
      ["案名", "title"], ["職位", "select", ["負責人", "Crew"]], ["劇團", "rel:troupe"], ["進場日期", "date"], ["進場地點", "rel:venue"],
      ["裝車時間", "date"], ["裝車地點", "text"], ["人力分配", "text"], ["Crew 狀態", "multi", STATUS.map(x => x[0])],
      ["問過的人", "rel:crew"], ["摳的人", "rel:crew"], ["負責人姓名", "text"], ["負責人時段費", "number"], ["負責人整筆費用", "number"],
      ["Crew時段費", "number"], ["前置", "text"], ["前置段數", "number"], ["打卡", "text"], ["時段表資料夾", "url"], ["巡演", "select", []],
      ["封存", "checkbox"], ["內容", "content"]] },
    crew: { db: "劇場のCrew", tab: "人員", label: "人員", icon: "👷", fields: [
      ["姓名", "title"], ["電話", "text"], ["時段費", "number"], ["居住地區", "select", HOMES], ["車號", "text"], ["時段費紀錄", "text"], ["備註", "text"]] },
    venue: { db: "劇場の場館", tab: "場館", label: "場館", icon: "🏛️", fields: [
      ["場館名稱", "title"], ["地區", "select", AREAS], ["地址", "text"], ["官方網站", "url"], ["技術資料與圖面", "url"]] },
    troupe: { db: "劇場の劇團", tab: "劇團", label: "劇團", icon: "🎭", fields: [
      ["劇團名稱", "title"], ["抬頭", "text"], ["統編", "text"], ["聯絡人", "text"], ["電話", "text"]] },
  };
  // 網頁本體用舊名稱（TD姓名…）；資料庫用新名稱
  const ALIAS = { "負責人姓名": "TD姓名", "負責人時段費": "TD時段費", "負責人整筆費用": "TD整筆費用" };
  const BACK = Object.fromEntries(Object.entries(ALIAS).map(([a, b]) => [b, a]));
  const LEAD = ["TD", "負責人"];
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const WK = "日一二三四五六";
  // 新案子的 Call Time 表格：裝車、每一天、卸車
  function callRows(start, end, load) {
    const rows = [];
    if (load) rows.push(["裝車", ""]);
    if (start) {
      const d = new Date(start + "T00:00:00"), e = new Date((end || start) + "T00:00:00");
      for (let g = 0; d <= e && g < 60; g++, d.setDate(d.getDate() + 1)) rows.push([`${d.getMonth() + 1}/${d.getDate()} (${WK[d.getDay()]})`, ""]);
    }
    if (load) rows.push(["卸車", ""]);
    return rows;
  }
  const hex32 = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
  window.__tdh = window.__tdh || {};
  Object.assign(window.__tdh, { SCHEMA, ALIAS, BACK, LEAD, STATUS, NEED_KINDS, isoDay, callRows, hex32 });
})();
