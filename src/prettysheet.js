  // ---------- 劇場幫幫：仿照 App 預覽的時段表（Google 試算表與 Excel 共用） ----------
  // 這段程式由 build.py 插進網頁本體，可以直接用網頁裡的 SLOTS、fmtSeg、lateSeg、md、wk、ruleLines、colL、rgb、EXP_TAB、EXP_ROWS。
  function prettyPlan(s) {
    const P = { ink: "#1F1D1A", muted: "#7A746B", line: "#E6E1D8", accent: "#2F5D50", sel: "#EEF4F1", even: "#F9F8F5", tot: "#F4F8F6", totRow: "#E4EEE9", warn: "#B25D00", white: "#FFFFFF", red: "#B3261E" };
    const GC = { "進場": ["#3B6EA5", "#5383BA"], "裝車": ["#6B7280"], "裝台": ["#3F9A5A"], "拆台": ["#C27A1A"], "卸車": ["#7A5AA8"] };
    const gColor = (g) => { const a = GC[g.group] || ["#6B7280"]; return a[((g.week || 1) - 1) % a.length]; };
    const FONT = "Noto Sans TC";
    const nDay = s.allCols.length;
    // 手機上方便看：時段數、金額放在名字旁邊；後面才是前置與每天的段數
    const C = { name: 0, rate: 1, total: 2, pay: 3, prep: 4, day0: 5 };
    C.dEnd = C.day0 + nDay; C.send = C.dEnd; C.note = C.dEnd + 1;
    const W = C.note + 1, row = () => Array(W).fill("");
    const CW = Array(W).fill(66);
    CW[C.name] = 120; CW[C.rate] = 58; CW[C.prep] = 112; CW[C.total] = 62; CW[C.pay] = 92; CW[C.send] = 92; CW[C.note] = 170;
    s.allCols.forEach((col, k) => { CW[C.day0 + k] = col.d.slot ? 62 : 76; });
    const venues = [...new Set(s.weeks.map(w => w.venue).filter(Boolean))];
    const expRef = `'${EXP_TAB}'!G${2 + EXP_ROWS + 1}`;
    const lead = window.TDN();

    const rows = [];
    const R = { kick: 0, title: 1, venue: 2, chips: 3, gap: 4, grp: 5, date: 6 };
    const r0 = row(); r0[0] = "舞台技術人員時段統計表"; rows.push(r0);
    const r1 = row(); r1[0] = s.short || s.title; rows.push(r1);
    const r2 = row(); r2[0] = venues.length ? "@" + venues.join("、") : ""; rows.push(r2);
    rows.push(row());   // chips：等總計列位置確定後再填公式
    rows.push(row());
    const g1 = row(), g2 = row();
    g1[C.name] = "人員"; g1[C.rate] = "時段費"; g1[C.prep] = "前置";
    s.groups.forEach(g => { g1[C.day0 + g.start] = g.glabel.replace("\n", ""); });
    s.allCols.forEach((col, k) => { g2[C.day0 + k] = `${md(col.d.date)}\n${wk(col.d.date)}`; });
    g1[C.total] = "時段數"; g1[C.pay] = "金額"; g1[C.send] = "匯款金額"; g1[C.note] = "備註";
    rows.push(g1, g2);

    const wrapN = (txt, px) => String(txt).split("\n").reduce((n, l) => n + Math.max(1, Math.ceil([...l].reduce((w, ch) => w + (/[\x00-\x7f]/.test(ch) ? 7 : 12.5), 0) / Math.max(20, px - 10))), 0);
    const personStart = rows.length, heights = [], segCells = [];
    const titleH = Math.max(30, wrapN(rows[R.title][0], CW[C.name] * 0.82) * 22 + 8), venueH = Math.max(20, wrapN(rows[R.venue][0], CW[C.name]) * 15 + 6);
    s.people.forEach((p, i) => {
      const a = row(), b = row(), ra = rows.length + 1, rb = ra + 1;
      a[C.name] = p.name;
      b[C.name] = p.roleText.replace(/\n/g, " ");
      a[C.rate] = p.flat ? "整筆" : (p.rate || "");
      a[C.prep] = p.prep || "";
      b[C.prep] = p.prepSeg === "" ? "" : p.prepSeg;
      p.cells.forEach((cell, k) => {
        const x = cell.raw;
        if (!cell.text || !x) return;
        const t = [];
        if (x.lunch) t.push(`午+${fmtSeg(x.lunch)}`);
        if (x.dinner) t.push(`晚+${fmtSeg(x.dinner)}`);
        const ls = x.adj === null || x.adj === undefined ? lateSeg(x.tin, x.tout) : 0;
        if (ls) t.push(`超+${fmtSeg(ls)}`);
        (x.note || []).forEach(n => t.push(n));
        a[C.day0 + k] = (x.slot ? SLOTS[x.slot] : `${x.tin || "?"}–${x.tout || "?"}`) + (t.length ? "\n" + t.join(" ") : "");
        b[C.day0 + k] = cell.seg === "" ? "" : cell.seg;
      });
      a[C.total] = `=SUM(${colL(C.prep)}${rb}:${colL(C.day0 + nDay - 1)}${rb})`;
      a[C.pay] = p.flat !== null && p.flat !== undefined ? p.flat : `=IF(N(${colL(C.rate)}${ra})=0,"",${colL(C.total)}${ra}*${colL(C.rate)}${ra})`;
      if (p.role === "TD") {
        a[C.send] = `=IF(${colL(C.pay)}${ra}="","",${colL(C.pay)}${ra}+N(${expRef}))`;
        a[C.note] = `=IF(N(${expRef})>0,"${lead}墊款 "&TEXT(${expRef},"#,##0")&" 元"&CHAR(10)&"詳見「${EXP_TAB}」分頁","")`;
      } else a[C.send] = `=${colL(C.pay)}${ra}`;
      rows.push(a, b);
      const ha = Math.max(1, ...a.map((v, k) => String(v).startsWith("=") || typeof v === "number" ? 1 : wrapN(v, CW[k])));
      const hb = Math.max(1, wrapN(b[C.name], CW[C.name]));
      heights.push(Math.max(34, ha * 16 + 12), Math.max(30, hb * 15 + 10));
    });
    const last = rows.length;
    const ft = row(), ftR = last + 1;
    ft[C.name] = "總計";
    ft[C.total] = `=SUM(${colL(C.total)}${personStart + 1}:${colL(C.total)}${last})`;
    ft[C.pay] = `=SUM(${colL(C.pay)}${personStart + 1}:${colL(C.pay)}${last})`;
    ft[C.send] = `=SUM(${colL(C.send)}${personStart + 1}:${colL(C.send)}${last})`;
    rows.push(ft);
    rows[R.chips][0] = `="${s.people.length} 人・"&${colL(C.total)}${ftR}&" 段"&CHAR(10)&"$"&TEXT(${colL(C.pay)}${ftR},"#,##0")`;
    rows.push(row());
    const legR = rows.length; const lg = row(); lg[0] = "午+ 午餐　　晚+ 晚餐　　超+ 22:00 後　　空白：當天沒來或未填　　綠色格子是段數，改了會自動重算"; rows.push(lg);
    const ruleR = rows.length; const ru = row(); ru[0] = ruleLines(s.late).join("\n"); rows.push(ru);

    // 支出明細表
    const rows2 = [["", `${s.short}・支出明細`, "", "", "", "", "", ""], ["", "發票日期", "廠商", "內容", "單據類型", "發票號碼", "金額", "備註"]];
    for (let i = 0; i < EXP_ROWS; i++) rows2.push(["", "", "", "", "", "", "", ""]);
    rows2.push(["", "總計", "", "", "", "", `=SUM(G3:G${2 + EXP_ROWS})`, `←${lead}墊付總金額`]);

    const reqs = (SID, SID2, target = "sheets") => {
      const G = (a, b, c, d, sid = SID) => ({ sheetId: sid, startRowIndex: a, endRowIndex: b, startColumnIndex: c, endColumnIndex: d });
      const TF = (o = {}) => Object.assign({ fontFamily: FONT, fontSize: 10, bold: false, foregroundColorStyle: { rgbColor: rgb(o.color || P.ink) } }, o.color ? (() => { const x = Object.assign({}, o); delete x.color; return x; })() : o);
      const fmt = (range, f, fields) => ({ repeatCell: { range, cell: { userEnteredFormat: f }, fields: fields.split(",").map(x => "userEnteredFormat." + x).join(",") } });
      const bg = (range, hex) => fmt(range, { backgroundColorStyle: { rgbColor: rgb(hex) } }, "backgroundColorStyle");
      const tx = (range, o, extra = {}, more = "") => fmt(range, Object.assign({ textFormat: TF(o) }, extra), "textFormat" + (more ? "," + more : ""));
      const line = (hex, style = "SOLID") => ({ style, colorStyle: { rgbColor: rgb(hex) } });
      const none = { style: "NONE" };
      const colW = (c0, c1, px, sid = SID) => ({ updateDimensionProperties: { range: { sheetId: sid, dimension: "COLUMNS", startIndex: c0, endIndex: c1 }, properties: { pixelSize: px }, fields: "pixelSize" } });
      const rowH = (a, b, px, sid = SID) => ({ updateDimensionProperties: { range: { sheetId: sid, dimension: "ROWS", startIndex: a, endIndex: b }, properties: { pixelSize: px }, fields: "pixelSize" } });
      const merge = (range) => ({ mergeCells: { range, mergeType: "MERGE_ALL" } });
      const out = [
        { updateSheetProperties: { properties: { sheetId: SID, gridProperties: { frozenRowCount: R.date + 1, frozenColumnCount: 1, hideGridlines: true } }, fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount,gridProperties.hideGridlines" } },
        fmt(G(0, rows.length, 0, W), { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE", wrapStrategy: "WRAP", backgroundColorStyle: { rgbColor: rgb(P.white) }, textFormat: TF() }, "horizontalAlignment,verticalAlignment,wrapStrategy,backgroundColorStyle,textFormat"),
        // 抬頭區（淡綠底）
        // 第一欄凍結，凍結線不能跨欄 → 抬頭全部寫在 A 欄裡，自動換行
        bg(G(0, R.chips + 1, 0, W), P.sel),
        fmt(G(0, R.chips + 1, 0, 1), { horizontalAlignment: "LEFT", verticalAlignment: "BOTTOM", wrapStrategy: "WRAP" }, "horizontalAlignment,verticalAlignment,wrapStrategy"),
        tx(G(R.kick, R.kick + 1, 0, W), { color: P.muted, fontSize: 9 }),
        tx(G(R.title, R.title + 1, 0, W), { fontSize: 15, bold: true }),
        tx(G(R.venue, R.venue + 1, 0, W), { color: P.muted, fontSize: 10 }),
        tx(G(R.chips, R.chips + 1, 0, W), { fontSize: 11, bold: true }, { verticalAlignment: "MIDDLE" }, "verticalAlignment"),
        rowH(R.kick, R.kick + 1, 26), rowH(R.title, R.title + 1, titleH), rowH(R.venue, R.venue + 1, venues.length ? venueH : 6), rowH(R.chips, R.chips + 1, 44), rowH(R.gap, R.gap + 1, 8),
        // 表頭
        tx(G(R.grp, R.date + 1, 0, W), { bold: true, fontSize: 11 }),
        merge(G(R.grp, R.date + 1, C.name, C.name + 1)), merge(G(R.grp, R.date + 1, C.rate, C.rate + 1)), merge(G(R.grp, R.date + 1, C.prep, C.prep + 1)),
        ...[C.total, C.pay, C.send, C.note].map(c => merge(G(R.grp, R.date + 1, c, c + 1))),
        fmt(G(R.grp, R.date + 1, C.name, C.name + 1), { horizontalAlignment: "LEFT" }, "horizontalAlignment"),
        bg(G(R.grp, R.date + 1, C.total, C.pay + 1), P.tot), bg(G(R.grp, R.date + 1, C.send, W), P.tot),
        rowH(R.grp, R.grp + 1, 26), rowH(R.date, R.date + 1, 46),
        { updateBorders: { range: G(R.date, R.date + 1, 0, W), bottom: line(P.ink, "SOLID_MEDIUM") } },
        // 人員區
        fmt(G(personStart, last, C.rate, C.rate + 1), { numberFormat: { type: "NUMBER", pattern: "#,##0" } }, "numberFormat"),
        tx(G(personStart, last, C.rate, C.rate + 1), { color: P.muted }),
        fmt(G(personStart, last + 1, C.pay, C.pay + 1), { numberFormat: { type: "NUMBER", pattern: "$#,##0" } }, "numberFormat"),
        fmt(G(personStart, last + 1, C.send, C.send + 1), { numberFormat: { type: "NUMBER", pattern: "$#,##0" } }, "numberFormat"),
        tx(G(personStart, last, C.total, C.pay + 1), { fontSize: 12, bold: true }), tx(G(personStart, last, C.send, C.send + 1), { fontSize: 12, bold: true }),
        tx(G(personStart, last, C.send, C.send + 1), { fontSize: 12, bold: true, color: P.red }),
        tx(G(personStart, last, C.note, C.note + 1), { color: P.muted, fontSize: 9 }, { horizontalAlignment: "LEFT" }, "horizontalAlignment"),
        // 總計列
        bg(G(last, last + 1, 0, W), P.totRow),
        tx(G(last, last + 1, 0, W), { fontSize: 12, bold: true }),
        tx(G(last, last + 1, C.send, C.send + 1), { fontSize: 12, bold: true, color: P.red }),
        fmt(G(last, last + 1, C.name, C.name + 1), { horizontalAlignment: "LEFT" }, "horizontalAlignment"),
        rowH(last, last + 1, 34),
        { updateBorders: { range: G(last, last + 1, 0, W), top: line(P.ink, "SOLID_MEDIUM"), bottom: line(P.ink, "SOLID_MEDIUM") } },
        rowH(last + 1, last + 2, 10),
        // 說明
        fmt(G(legR, ruleR + 1, 0, W), { horizontalAlignment: "LEFT", verticalAlignment: "TOP", wrapStrategy: "OVERFLOW_CELL" }, "horizontalAlignment,verticalAlignment,wrapStrategy"),
        tx(G(legR, legR + 1, 0, W), { color: P.warn, fontSize: 9 }),
        tx(G(ruleR, ruleR + 1, 0, W), { color: P.muted, fontSize: 9 }),
        rowH(legR, legR + 1, 22), rowH(ruleR, ruleR + 1, ruleLines(s.late).length * 15 + 12),
        ...CW.map((px, k) => colW(k, k + 1, px)),
      ];
      // 日期欄：組別色塊、日期上緣色條、組別分隔線
      s.groups.forEach(g => {
        const c0 = C.day0 + g.start, c1 = c0 + g.n, col = gColor(g);
        if (g.n > 1) out.push(merge(G(R.grp, R.grp + 1, c0, c1)));
        out.push(bg(G(R.grp, R.grp + 1, c0, c1), col), tx(G(R.grp, R.grp + 1, c0, c1), { color: P.white, bold: true, fontSize: 9 }));
        out.push({ updateBorders: { range: G(R.date, R.date + 1, c0, c1), top: line(col, "SOLID_THICK"), bottom: line(P.ink, "SOLID_MEDIUM") } });
        out.push({ updateBorders: { range: G(R.grp, last, c0, c1), left: line(P.ink, "SOLID_MEDIUM") } });
      });
      out.push({ updateBorders: { range: G(R.grp, last + 1, C.prep, C.prep + 1), left: line(P.ink, "SOLID_MEDIUM") } });
      out.push({ updateBorders: { range: G(R.grp, last + 1, C.send, C.send + 1), left: line(P.ink, "SOLID_MEDIUM") } });
      out.push({ updateBorders: { range: G(R.grp, last + 1, C.total, C.total + 1), left: line(P.line) } });
      out.push({ updateBorders: { range: G(R.grp, last + 1, C.name, C.name + 1), right: line(P.line) } });
      // 每個人兩列：上面名字／時間，下面職位／段數
      s.people.forEach((p, i) => {
        const r = personStart + i * 2, isLead = p.role === "TD";
        const base = isLead ? P.sel : i % 2 ? P.even : P.white;
        out.push(bg(G(r, r + 2, 0, W), base), bg(G(r, r + 2, C.total, C.pay + 1), P.tot), bg(G(r, r + 2, C.send, W), P.tot));
        [C.rate, C.total, C.pay, C.send, C.note].forEach(cc => out.push(merge(G(r, r + 2, cc, cc + 1))));
        out.push(fmt(G(r, r + 2, C.name, C.name + 1), { horizontalAlignment: "LEFT" }, "horizontalAlignment"));
        out.push(tx(G(r, r + 1, C.name, C.name + 1), { fontSize: 13, bold: true }, { verticalAlignment: "BOTTOM" }, "verticalAlignment"));
        out.push(tx(G(r + 1, r + 2, C.name, C.name + 1), { color: P.muted, fontSize: 10 }, { verticalAlignment: "TOP" }, "verticalAlignment"));
        out.push(tx(G(r, r + 1, C.prep, C.dEnd), { color: "#57524A", fontSize: 10 }, { verticalAlignment: "BOTTOM" }, "verticalAlignment"));
        out.push(fmt(G(r, r + 1, C.prep, C.prep + 1), { horizontalAlignment: "LEFT" }, "horizontalAlignment"));
        out.push(tx(G(r + 1, r + 2, C.prep, C.dEnd), { bold: true, fontSize: 12 }, { verticalAlignment: "TOP" }, "verticalAlignment"));
        out.push(rowH(r, r + 1, heights[i * 2]), rowH(r + 1, r + 2, heights[i * 2 + 1]));
        out.push({ updateBorders: { range: G(r + 1, r + 2, 0, W), bottom: line(P.line) } });
        out.push({ updateBorders: { range: G(r + 1, r + 2, C.prep, C.dEnd), innerVertical: line(P.white, "SOLID_THICK") } });   // 段數格子之間留白，看起來像一顆顆膠囊
        if (target !== "sheets") {   // Excel：直接把有段數的格子塗成綠色膠囊
          const b = rows[r + 1];
          for (let c = C.prep; c < C.dEnd; c++) if (b[c] !== "") out.push(bg(G(r + 1, r + 2, c, c + 1), P.accent), tx(G(r + 1, r + 2, c, c + 1), { bold: true, fontSize: 11, color: P.white }));
        }
      });
      s.groups.forEach(g => out.push({ updateBorders: { range: G(R.grp, last, C.day0 + g.start, C.day0 + g.start + 1), left: line(P.ink, "SOLID_MEDIUM") } }));
      if (target !== "sheets") [R.kick, R.title, R.venue, R.chips, legR, ruleR].forEach(r => out.push(merge(G(r, r + 1, 0, W)), fmt(G(r, r + 1, 0, W), { wrapStrategy: "WRAP" }, "wrapStrategy")));   // Excel 可以跨凍結欄合併
      if (target === "sheets") {    // Google 試算表：有填段數就自動變綠色（之後改資料也會跟著變）
        const ranges = s.people.map((p, i) => G(personStart + i * 2 + 1, personStart + i * 2 + 2, C.prep, C.dEnd));
        if (ranges.length) out.push({ addConditionalFormatRule: { index: 0, rule: { ranges, booleanRule: {
          condition: { type: "NOT_BLANK" },
          format: { backgroundColorStyle: { rgbColor: rgb(P.accent) }, textFormat: { bold: true, foregroundColorStyle: { rgbColor: rgb(P.white) } } } } } } });
      }
      // 支出明細表
      const E = (a, b, c, d) => G(a, b, c, d, SID2);
      const eLast = rows2.length - 1;
      out.push(
        { updateSheetProperties: { properties: { sheetId: SID2, gridProperties: { frozenRowCount: 2, hideGridlines: true } }, fields: "gridProperties.frozenRowCount,gridProperties.hideGridlines" } },
        fmt(E(0, eLast + 1, 0, 8), { verticalAlignment: "MIDDLE", wrapStrategy: "WRAP", textFormat: TF() }, "verticalAlignment,wrapStrategy,textFormat"),
        merge(E(0, 1, 1, 8)), bg(E(0, 1, 0, 8), P.sel),
        tx(E(0, 1, 1, 8), { fontSize: 16, bold: true }, { horizontalAlignment: "LEFT" }, "horizontalAlignment"),
        bg(E(1, 2, 1, 8), P.accent), tx(E(1, 2, 1, 8), { bold: true, color: P.white }, { horizontalAlignment: "CENTER" }, "horizontalAlignment"),
        fmt(E(2, eLast, 1, 2), { horizontalAlignment: "CENTER", numberFormat: { type: "DATE", pattern: "yyyy/m/d" } }, "horizontalAlignment,numberFormat"),
        fmt(E(2, eLast + 1, 6, 7), { horizontalAlignment: "RIGHT", numberFormat: { type: "NUMBER", pattern: "$#,##0" } }, "horizontalAlignment,numberFormat"),
        bg(E(eLast, eLast + 1, 1, 8), P.totRow), tx(E(eLast, eLast + 1, 1, 8), { bold: true, fontSize: 11 }),
        merge(E(eLast, eLast + 1, 1, 6)), fmt(E(eLast, eLast + 1, 1, 6), { horizontalAlignment: "RIGHT" }, "horizontalAlignment"),
        tx(E(eLast, eLast + 1, 6, 7), { bold: true, fontSize: 11, color: P.red }),
        tx(E(eLast, eLast + 1, 7, 8), { color: P.muted, fontSize: 9 }),
        { updateBorders: { range: E(1, eLast + 1, 1, 8), innerHorizontal: line(P.line), bottom: line(P.ink, "SOLID_MEDIUM") } },
        { updateBorders: { range: E(eLast, eLast + 1, 1, 8), top: line(P.ink, "SOLID_MEDIUM") } },
        colW(0, 1, 16, SID2), colW(1, 2, 95, SID2), colW(2, 3, 150, SID2), colW(3, 4, 170, SID2), colW(4, 5, 110, SID2), colW(5, 6, 115, SID2), colW(6, 7, 90, SID2), colW(7, 8, 200, SID2),
        rowH(0, 1, 44, SID2), rowH(1, 2, 30, SID2), rowH(2, eLast, 26, SID2), rowH(eLast, eLast + 1, 32, SID2),
      );
      return out;
    };
    return { rows, rows2, reqs, W, C, last };
  }
