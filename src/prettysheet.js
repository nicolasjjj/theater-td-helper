  // ---------- 劇場幫幫：時段表（Google 試算表與 Excel 共用） ----------
  // 這段程式由 build.py 插進網頁本體，可以直接用網頁裡的 SLOTS、fmtSeg、lateSeg、md、wk、ruleLines、colL、rgb、EXP_TAB、EXP_ROWS。
  // 版面：一行標題 → 深色表頭（組別色塊＋日期）→ 每人兩列（上：上下班時間，下：段數）→ 總計 → 說明。不凍結。
  function prettyPlan(s) {
    const P = { ink: "#1F1D1A", muted: "#6E685F", time: "#3F3B35", line: "#DDD8CE", head: "#2B2A27", head2: "#3A3833", white: "#FFFFFF",
      zebra: "#F6F4EF", seg: "#DDEBE3", segInk: "#24513F", totRow: "#E8E4DB", warn: "#9A5A12", red: "#B3261E" };
    const GC = { "進場": ["#3B6EA5", "#5383BA"], "裝車": ["#6B7280"], "裝台": ["#3F9A5A"], "拆台": ["#C27A1A"], "卸車": ["#7A5AA8"], "交通": ["#6B7280"] };
    const gColor = (g) => { const a = GC[g.group] || ["#6B7280"]; return a[((g.week || 1) - 1) % a.length]; };
    const FONT = "Noto Sans TC";
    const nDay = s.allCols.length;
    const C = { name: 0, rate: 1, prep: 2, day0: 3 };
    C.dEnd = C.day0 + nDay; C.total = C.dEnd; C.pay = C.dEnd + 1; C.send = C.dEnd + 2; C.note = C.dEnd + 3;
    const W = C.note + 1, row = () => Array(W).fill("");
    const CW = Array(W).fill(72);
    CW[C.name] = 118; CW[C.rate] = 64; CW[C.prep] = 104; CW[C.total] = 70; CW[C.pay] = 92; CW[C.send] = 92; CW[C.note] = 170;
    s.allCols.forEach((col, k) => { CW[C.day0 + k] = col.d.slot ? 64 : 72; });
    const expRef = `'${EXP_TAB}'!G${2 + EXP_ROWS + 1}`;
    const lead = window.TDN();

    const rows = [];
    const R = { title: 0, gap: 1, grp: 2, date: 3 };
    const t0 = row(); t0[0] = s.title; rows.push(t0);
    rows.push(row());
    const g1 = row(), g2 = row();
    g1[C.name] = "人員"; g1[C.rate] = "時段費"; g1[C.prep] = "前置";
    s.groups.forEach(g => { g1[C.day0 + g.start] = g.glabel.replace("\n", ""); });
    s.allCols.forEach((col, k) => { g2[C.day0 + k] = `${md(col.d.date)} ${wk(col.d.date)}`; });
    g1[C.total] = "時段數"; g1[C.pay] = "金額"; g1[C.send] = "匯款金額"; g1[C.note] = "備註";
    rows.push(g1, g2);

    const lines = (v) => String(v).split("\n").length;
    const personStart = rows.length, heights = [];
    s.people.forEach((p) => {
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
        a[C.day0 + k] = (x.slot ? SLOTS[x.slot] : `${x.tin || "?"}\n${x.tout || "?"}`) + (t.length ? "\n" + t.join(" ") : "");
        b[C.day0 + k] = cell.seg === "" ? "" : cell.seg;
      });
      const segFrom = colL(C.prep), segTo = colL(C.dEnd - 1);
      a[C.total] = `=SUM(${segFrom}${rb}:${segTo}${rb})`;
      a[C.pay] = p.flat !== null && p.flat !== undefined ? p.flat : `=IF(N(${colL(C.rate)}${ra})=0,"",${colL(C.total)}${ra}*${colL(C.rate)}${ra})`;
      if (p.role === "TD") {
        a[C.send] = `=IF(${colL(C.pay)}${ra}="","",${colL(C.pay)}${ra}+N(${expRef}))`;
        a[C.note] = `=IF(N(${expRef})>0,"${lead}墊款 "&TEXT(${expRef},"#,##0")&" 元"&CHAR(10)&"詳見「${EXP_TAB}」分頁","")`;
      } else a[C.send] = `=${colL(C.pay)}${ra}`;
      rows.push(a, b);
      const la = Math.max(1, ...a.map(v => typeof v === "string" && !v.startsWith("=") ? lines(v) : 1));
      heights.push(Math.max(40, la * 16 + 10), 28);
    });
    const last = rows.length;
    const ft = row(), sumCol = (c) => `=SUM(${colL(c)}${personStart + 1}:${colL(c)}${last})`;
    ft[C.name] = "總計"; ft[C.total] = sumCol(C.total); ft[C.pay] = sumCol(C.pay); ft[C.send] = sumCol(C.send);
    rows.push(ft);
    rows.push(row());
    const legR = rows.length; const lg = row(); lg[0] = "午+ 午餐　　晚+ 晚餐　　超+ 22:00 後　　空白：當天沒來或未填　　淺綠色格子是段數，改了會自動重算"; rows.push(lg);
    const ruleR = rows.length; const ru = row(); ru[0] = ruleLines(s.late).join("\n"); rows.push(ru);

    // 支出明細表
    const rows2 = [["", `${s.short}・支出明細`, "", "", "", "", "", ""], ["", "發票日期", "廠商", "內容", "單據類型", "發票號碼", "金額", "備註"]];
    for (let i = 0; i < EXP_ROWS; i++) rows2.push(["", "", "", "", "", "", "", ""]);
    rows2.push(["", "總計", "", "", "", "", `=SUM(G3:G${2 + EXP_ROWS})`, `←${lead}墊付總金額`]);

    const reqs = (SID, SID2, target = "sheets") => {
      const G = (a, b, c, d, sid = SID) => ({ sheetId: sid, startRowIndex: a, endRowIndex: b, startColumnIndex: c, endColumnIndex: d });
      const TF = (o = {}) => { const x = Object.assign({}, o); const col = x.color || P.ink; delete x.color; return Object.assign({ fontFamily: FONT, fontSize: 10, bold: false, foregroundColorStyle: { rgbColor: rgb(col) } }, x); };
      const fmt = (range, f, fields) => ({ repeatCell: { range, cell: { userEnteredFormat: f }, fields: fields.split(",").map(x => "userEnteredFormat." + x).join(",") } });
      const bg = (range, hex) => fmt(range, { backgroundColorStyle: { rgbColor: rgb(hex) } }, "backgroundColorStyle");
      const tx = (range, o, extra = {}, more = "") => fmt(range, Object.assign({ textFormat: TF(o) }, extra), "textFormat" + (more ? "," + more : ""));
      const al = (range, h) => fmt(range, { horizontalAlignment: h }, "horizontalAlignment");
      const line = (hex, style = "SOLID") => ({ style, colorStyle: { rgbColor: rgb(hex) } });
      const colW = (c0, c1, px, sid = SID) => ({ updateDimensionProperties: { range: { sheetId: sid, dimension: "COLUMNS", startIndex: c0, endIndex: c1 }, properties: { pixelSize: px }, fields: "pixelSize" } });
      const rowH = (a, b, px, sid = SID) => ({ updateDimensionProperties: { range: { sheetId: sid, dimension: "ROWS", startIndex: a, endIndex: b }, properties: { pixelSize: px }, fields: "pixelSize" } });
      const merge = (range) => ({ mergeCells: { range, mergeType: "MERGE_ALL" } });
      const out = [
        { updateSheetProperties: { properties: { sheetId: SID, gridProperties: { frozenRowCount: 0, frozenColumnCount: 0, hideGridlines: true } }, fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount,gridProperties.hideGridlines" } },
        // 全表：置中、上下置中、自動換行、白底
        fmt(G(0, rows.length, 0, W), { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE", wrapStrategy: "WRAP", backgroundColorStyle: { rgbColor: rgb(P.white) }, textFormat: TF() }, "horizontalAlignment,verticalAlignment,wrapStrategy,backgroundColorStyle,textFormat"),
        // 標題：一行
        merge(G(R.title, R.title + 1, 0, W)), al(G(R.title, R.title + 1, 0, W), "LEFT"),
        tx(G(R.title, R.title + 1, 0, W), { fontSize: 15, bold: true }),
        rowH(R.title, R.title + 1, 40), rowH(R.gap, R.gap + 1, 8),
        // 表頭：深色底白字
        bg(G(R.grp, R.date + 1, 0, W), P.head),
        bg(G(R.date, R.date + 1, C.day0, C.dEnd), P.head2),
        tx(G(R.grp, R.date + 1, 0, W), { bold: true, fontSize: 11, color: P.white }),
        ...[C.name, C.rate, C.prep, C.total, C.pay, C.send, C.note].map(c => merge(G(R.grp, R.date + 1, c, c + 1))),
        al(G(R.grp, R.date + 1, C.name, C.name + 1), "LEFT"),
        rowH(R.grp, R.grp + 1, 28), rowH(R.date, R.date + 1, 30),
        // 人員區
        fmt(G(personStart, last, C.rate, C.rate + 1), { numberFormat: { type: "NUMBER", pattern: "#,##0" } }, "numberFormat"),
        tx(G(personStart, last, C.rate, C.rate + 1), { color: P.muted }),
        fmt(G(personStart, last + 1, C.pay, C.send + 1), { numberFormat: { type: "NUMBER", pattern: "$#,##0" } }, "numberFormat"),
        tx(G(personStart, last, C.total, C.send + 1), { fontSize: 12, bold: true }),
        tx(G(personStart, last, C.send, C.send + 1), { fontSize: 12, bold: true, color: P.red }),
        tx(G(personStart, last, C.note, C.note + 1), { color: P.muted, fontSize: 9 }, { horizontalAlignment: "LEFT" }, "horizontalAlignment"),
        // 總計列
        bg(G(last, last + 1, 0, W), P.totRow),
        tx(G(last, last + 1, 0, W), { fontSize: 12, bold: true }),
        tx(G(last, last + 1, C.send, C.send + 1), { fontSize: 12, bold: true, color: P.red }),
        al(G(last, last + 1, C.name, C.name + 1), "LEFT"),
        rowH(last, last + 1, 36),
        { updateBorders: { range: G(last, last + 1, 0, W), top: line(P.ink, "SOLID_MEDIUM"), bottom: line(P.ink, "SOLID_MEDIUM") } },
        rowH(last + 1, last + 2, 10),
        // 說明
        merge(G(legR, legR + 1, 0, W)), merge(G(ruleR, ruleR + 1, 0, W)),
        fmt(G(legR, ruleR + 1, 0, W), { horizontalAlignment: "LEFT", verticalAlignment: "MIDDLE" }, "horizontalAlignment,verticalAlignment"),
        tx(G(legR, legR + 1, 0, W), { color: P.warn, fontSize: 9 }),
        tx(G(ruleR, ruleR + 1, 0, W), { color: P.muted, fontSize: 9 }),
        rowH(legR, legR + 1, 24), rowH(ruleR, ruleR + 1, ruleLines(s.late).length * 15 + 12),
        ...CW.map((px, k) => colW(k, k + 1, px)),
      ];
      // 組別：彩色色塊（表頭第一列）
      s.groups.forEach(g => {
        const c0 = C.day0 + g.start, c1 = c0 + g.n;
        if (g.n > 1) out.push(merge(G(R.grp, R.grp + 1, c0, c1)));
        out.push(bg(G(R.grp, R.grp + 1, c0, c1), gColor(g)));
      });
      // 每個人兩列：上面名字／上下班時間，下面職位／段數。底色只有一個規則：一人白、一人淺灰，交錯
      s.people.forEach((p, i) => {
        const r = personStart + i * 2, base = i % 2 ? P.zebra : P.white;
        out.push(bg(G(r, r + 2, 0, W), base));
        [C.rate, C.total, C.pay, C.send, C.note].forEach(cc => out.push(merge(G(r, r + 2, cc, cc + 1))));
        out.push(al(G(r, r + 2, C.name, C.name + 1), "LEFT"));
        out.push(tx(G(r, r + 1, C.name, C.name + 1), { fontSize: 12, bold: true }));
        out.push(tx(G(r + 1, r + 2, C.name, C.name + 1), { color: P.muted, fontSize: 9 }));
        out.push(tx(G(r, r + 1, C.prep, C.dEnd), { color: P.time, fontSize: 10 }));
        out.push(al(G(r, r + 1, C.prep, C.prep + 1), "LEFT"));
        out.push(tx(G(r + 1, r + 2, C.prep, C.dEnd), { bold: true, fontSize: 11, color: P.segInk }));
        out.push(rowH(r, r + 1, heights[i * 2]), rowH(r + 1, r + 2, heights[i * 2 + 1]));
        out.push({ updateBorders: { range: G(r + 1, r + 2, 0, W), bottom: line(P.line) } });
        if (target !== "sheets") {   // Excel：直接把有段數的格子塗淺綠
          const b = rows[r + 1];
          for (let c = C.prep; c < C.dEnd; c++) if (b[c] !== "") out.push(bg(G(r + 1, r + 2, c, c + 1), P.seg));
        }
        // 段數格子之間留一點縫，看起來一格一格
        out.push({ updateBorders: { range: G(r + 1, r + 2, C.prep, C.dEnd), innerVertical: line(base, "SOLID_THICK") } });
      });
      // 分隔線：人員｜前置與每天｜各組別｜時段數以後
      const vline = (c) => out.push({ updateBorders: { range: G(personStart, last, c, c + 1), left: line(P.ink, "SOLID_MEDIUM") } });
      vline(C.prep); s.groups.forEach(g => vline(C.day0 + g.start)); vline(C.total);
      if (target === "sheets") {    // Google 試算表：有填段數就自動變淺綠（之後改資料也會跟著變）
        const ranges = s.people.map((p, i) => G(personStart + i * 2 + 1, personStart + i * 2 + 2, C.prep, C.dEnd));
        if (ranges.length) out.push({ addConditionalFormatRule: { index: 0, rule: { ranges, booleanRule: {
          condition: { type: "NOT_BLANK" }, format: { backgroundColorStyle: { rgbColor: rgb(P.seg) } } } } } });
      }
      // 支出明細表
      const E = (a, b, c, d) => G(a, b, c, d, SID2);
      const eLast = rows2.length - 1;
      out.push(
        { updateSheetProperties: { properties: { sheetId: SID2, gridProperties: { frozenRowCount: 0, hideGridlines: true } }, fields: "gridProperties.frozenRowCount,gridProperties.hideGridlines" } },
        fmt(E(0, eLast + 1, 0, 8), { verticalAlignment: "MIDDLE", wrapStrategy: "WRAP", textFormat: TF() }, "verticalAlignment,wrapStrategy,textFormat"),
        merge(E(0, 1, 1, 8)), tx(E(0, 1, 1, 8), { fontSize: 15, bold: true }, { horizontalAlignment: "LEFT" }, "horizontalAlignment"),
        bg(E(1, 2, 1, 8), P.head), tx(E(1, 2, 1, 8), { bold: true, color: P.white }, { horizontalAlignment: "CENTER" }, "horizontalAlignment"),
        fmt(E(2, eLast, 1, 2), { horizontalAlignment: "CENTER", numberFormat: { type: "DATE", pattern: "yyyy/m/d" } }, "horizontalAlignment,numberFormat"),
        fmt(E(2, eLast + 1, 6, 7), { horizontalAlignment: "RIGHT", numberFormat: { type: "NUMBER", pattern: "$#,##0" } }, "horizontalAlignment,numberFormat"),
        bg(E(eLast, eLast + 1, 1, 8), P.totRow), tx(E(eLast, eLast + 1, 1, 8), { bold: true, fontSize: 11 }),
        merge(E(eLast, eLast + 1, 1, 6)), fmt(E(eLast, eLast + 1, 1, 6), { horizontalAlignment: "RIGHT" }, "horizontalAlignment"),
        tx(E(eLast, eLast + 1, 6, 7), { bold: true, fontSize: 11, color: P.red }),
        tx(E(eLast, eLast + 1, 7, 8), { color: P.muted, fontSize: 9 }),
        { updateBorders: { range: E(1, eLast + 1, 1, 8), innerHorizontal: line(P.line), bottom: line(P.ink, "SOLID_MEDIUM") } },
        { updateBorders: { range: E(eLast, eLast + 1, 1, 8), top: line(P.ink, "SOLID_MEDIUM") } },
        colW(0, 1, 16, SID2), colW(1, 2, 95, SID2), colW(2, 3, 150, SID2), colW(3, 4, 170, SID2), colW(4, 5, 110, SID2), colW(5, 6, 115, SID2), colW(6, 7, 90, SID2), colW(7, 8, 200, SID2),
        rowH(0, 1, 40, SID2), rowH(1, 2, 30, SID2), rowH(2, eLast, 26, SID2), rowH(eLast, eLast + 1, 32, SID2),
      );
      return out;
    };
    return { rows, rows2, reqs, W, C, last };
  }
