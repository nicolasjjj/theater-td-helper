// 劇場幫幫｜把時段表直接做成 Excel 檔（.xlsx），不需要任何外部套件。
// 輸入：sheets = [{name, rows}]（值可以是文字、數字、或以 = 開頭的公式），reqs = Google 試算表格式指令（網頁原本就會產生）。
(() => {
  // ---------- 小型 zip（不壓縮） ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const [name, text] of files) {
      const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, nb.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nb, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nb);
      off += 30 + nb.length + data.length;
    }
    const csize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  const X = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const colL = (n) => { let s = ""; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const argb = (c) => { if (!c) return null; const h = (v) => Math.round((v || 0) * 255).toString(16).padStart(2, "0").toUpperCase(); return "FF" + h(c.red) + h(c.green) + h(c.blue); };
  const colorOf = (cs) => cs && (cs.rgbColor || cs);

  function build(sheetsIn, reqs) {
    // 每張表：cells[r][c] = {v, st:{...}}
    const sheets = sheetsIn.map((s, i) => ({ name: s.name, id: i, rows: s.rows, st: {}, merges: [], cols: {}, rowsH: {}, freeze: 0, fcol: 0, grid: true }));
    const byId = (id) => sheets[id] || sheets[0];
    const cellSt = (sh, r, c) => { const k = r + "," + c; return sh.st[k] || (sh.st[k] = {}); };
    const each = (rg, fn) => { const sh = byId(rg.sheetId); for (let r = rg.startRowIndex; r < rg.endRowIndex; r++) for (let c = rg.startColumnIndex; c < rg.endColumnIndex; c++) fn(cellSt(sh, r, c), r, c, sh); };
    for (const q of reqs || []) {
      if (q.repeatCell) {
        const f = (q.repeatCell.cell || {}).userEnteredFormat || {}, fields = q.repeatCell.fields.split(",").map(x => x.replace("userEnteredFormat.", ""));
        each(q.repeatCell.range, (st) => {
          for (const fd of fields) {
            if (fd === "horizontalAlignment") st.h = f.horizontalAlignment;
            else if (fd === "verticalAlignment") st.v = f.verticalAlignment;
            else if (fd === "wrapStrategy") st.wrap = f.wrapStrategy === "WRAP";
            else if (fd === "backgroundColorStyle" || fd === "backgroundColor") st.bg = argb(colorOf(f.backgroundColorStyle || f.backgroundColor));
            else if (fd === "numberFormat") st.num = f.numberFormat && f.numberFormat.pattern;
            else if (fd.startsWith("textFormat")) { const t = f.textFormat || {}; st.font = { b: !!t.bold, sz: t.fontSize || 11, name: t.fontFamily || "Arial", color: argb(colorOf(t.foregroundColorStyle || t.foregroundColor)) }; }
          }
        });
      } else if (q.mergeCells) {
        const rg = q.mergeCells.range; byId(rg.sheetId).merges.push(rg);
      } else if (q.updateBorders) {
        const b = q.updateBorders, rg = b.range;
        const kind = (x) => x && (x.style === "NONE" ? null : (x.style === "SOLID_MEDIUM" ? "medium" : x.style === "SOLID_THICK" ? "thick" : "thin") + "|" + (argb(colorOf(x.colorStyle || x.color)) || "FF000000"));
        each(rg, (st, r, c, sh) => {
          st.bd = st.bd || {};
          const set = (side, x) => { if (x) st.bd[side] = kind(x); };
          if (r === rg.startRowIndex) set("top", b.top); else set("top", b.innerHorizontal);
          if (r === rg.endRowIndex - 1) set("bottom", b.bottom); else set("bottom", b.innerHorizontal);
          if (c === rg.startColumnIndex) set("left", b.left); else set("left", b.innerVertical);
          if (c === rg.endColumnIndex - 1) set("right", b.right); else set("right", b.innerVertical);
          // 讓相鄰格子的那一邊也一致
          if (r === rg.startRowIndex && b.top && r > 0) { const o = cellSt(sh, r - 1, c); o.bd = o.bd || {}; o.bd.bottom = kind(b.top); }
          if (r === rg.endRowIndex - 1 && b.bottom) { const o = cellSt(sh, r + 1, c); o.bd = o.bd || {}; o.bd.top = kind(b.bottom); }
          if (c === rg.startColumnIndex && b.left && c > 0) { const o = cellSt(sh, r, c - 1); o.bd = o.bd || {}; o.bd.right = kind(b.left); }
        });
      } else if (q.updateDimensionProperties) {
        const d = q.updateDimensionProperties, rg = d.range, sh = byId(rg.sheetId), px = d.properties.pixelSize;
        for (let i = rg.startIndex; i < rg.endIndex; i++) { if (rg.dimension === "COLUMNS") sh.cols[i] = px; else sh.rowsH[i] = px; }
      } else if (q.updateSheetProperties) {
        const p = q.updateSheetProperties.properties, sh = byId(p.sheetId), g = p.gridProperties || {};
        if (g.frozenRowCount !== undefined) sh.freeze = g.frozenRowCount;
        if (g.frozenColumnCount !== undefined) sh.fcol = g.frozenColumnCount;
        if (g.hideGridlines !== undefined) sh.grid = !g.hideGridlines;
      }
    }

    // ---------- styles ----------
    const fonts = ['<font><sz val="11"/><name val="Arial"/></font>'], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'], numFmts = [], xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
    const idx = (arr, s) => { let i = arr.indexOf(s); if (i < 0) { arr.push(s); i = arr.length - 1; } return i; };
    const xfMap = {};
    function xfOf(st) {
      const key = JSON.stringify(st); if (xfMap[key] !== undefined) return xfMap[key];
      const f = st.font || { b: false, sz: 11, name: "Arial" };
      const fontId = idx(fonts, `<font>${f.b ? "<b/>" : ""}<sz val="${f.sz}"/>${f.color ? `<color rgb="${f.color}"/>` : ""}<name val="${X(f.name)}"/></font>`);
      const fillId = st.bg ? idx(fills, `<fill><patternFill patternType="solid"><fgColor rgb="${st.bg}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
      const bd = st.bd || {}, side = (s) => bd[s] ? `<${s} style="${bd[s].split("|")[0]}"><color rgb="${bd[s].split("|")[1] || "FF000000"}"/></${s}>` : `<${s}/>`;
      const borderId = idx(borders, `<border>${side("left")}${side("right")}${side("top")}${side("bottom")}<diagonal/></border>`);
      let numFmtId = 0;
      if (st.num) { const builtin = { "0.00": 2, "#,##0": 3, "0": 1 }[st.num]; numFmtId = builtin ?? (164 + idx(numFmts, st.num)); }
      const H = { LEFT: "left", CENTER: "center", RIGHT: "right" }[st.h], V = { TOP: "top", MIDDLE: "center", BOTTOM: "bottom" }[st.v];
      const al = (H || V || st.wrap) ? `<alignment${H ? ` horizontal="${H}"` : ""}${V ? ` vertical="${V}"` : ""}${st.wrap ? ' wrapText="1"' : ""}/>` : "";
      const xf = `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"${numFmtId ? ' applyNumberFormat="1"' : ""}${al ? ' applyAlignment="1">' + al + "</xf>" : "/>"}`;
      xfMap[key] = idx(xfs, xf); return xfMap[key];
    }

    const sheetXml = sheets.map(sh => {
      let maxR = sh.rows.length, maxC = Math.max(1, ...sh.rows.map(r => r.length));
      for (const k of Object.keys(sh.st)) { const [r, c] = k.split(",").map(Number); maxR = Math.max(maxR, r + 1); maxC = Math.max(maxC, c + 1); }
      const cols = Object.keys(sh.cols).length ? "<cols>" + Object.entries(sh.cols).sort((a, b) => a[0] - b[0]).map(([i, px]) => `<col min="${+i + 1}" max="${+i + 1}" width="${Math.max(1, (px - 5) / 7).toFixed(2)}" customWidth="1"/>`).join("") + "</cols>" : "";
      let data = "";
      for (let r = 0; r < maxR; r++) {
        const row = sh.rows[r] || [];
        let cells = "";
        for (let c = 0; c < maxC; c++) {
          const v = row[c], st = sh.st[r + "," + c];
          if ((v === undefined || v === null || v === "") && !st) continue;
          const ref = colL(c) + (r + 1), s = st ? ` s="${xfOf(st)}"` : "";
          if (v === undefined || v === null || v === "") cells += `<c r="${ref}"${s}/>`;
          else if (typeof v === "number" && isFinite(v)) cells += `<c r="${ref}"${s}><v>${v}</v></c>`;
          else if (typeof v === "string" && v.startsWith("=")) cells += `<c r="${ref}"${s}><f>${X(v.slice(1))}</f></c>`;
          else if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()) && v.trim().length < 15) cells += `<c r="${ref}"${s}><v>${Number(v)}</v></c>`;
          else cells += `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${X(v)}</t></is></c>`;
        }
        const ht = sh.rowsH[r] ? ` ht="${(sh.rowsH[r] * 0.75).toFixed(2)}" customHeight="1"` : "";
        if (cells || ht) data += `<row r="${r + 1}"${ht}>${cells}</row>`;
      }
      const merges = sh.merges.length ? `<mergeCells count="${sh.merges.length}">` + sh.merges.map(m => `<mergeCell ref="${colL(m.startColumnIndex)}${m.startRowIndex + 1}:${colL(m.endColumnIndex - 1)}${m.endRowIndex}"/>`).join("") + "</mergeCells>" : "";
      const pane = sh.freeze && sh.fcol ? `<pane xSplit="${sh.fcol}" ySplit="${sh.freeze}" topLeftCell="${colL(sh.fcol)}${sh.freeze + 1}" activePane="bottomRight" state="frozen"/><selection pane="bottomRight"/>`
        : sh.freeze ? `<pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>` : "";
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"${sh.grid ? "" : ' showGridLines="0"'}${sh.id === 0 ? ' tabSelected="1"' : ""}>${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${data}</sheetData>${merges}<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>`;
    });

    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${numFmts.length ? `<numFmts count="${numFmts.length}">` + numFmts.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${X(f)}"/>`).join("") + "</numFmts>" : ""}<fonts count="${fonts.length}">${fonts.join("")}</fonts><fills count="${fills.length}">${fills.join("")}</fills><borders count="${borders.length}">${borders.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s, i) => `<sheet name="${X(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`;
    const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    return zip([["[Content_Types].xml", ct], ["_rels/.rels", rels], ["xl/workbook.xml", wb], ["xl/_rels/workbook.xml.rels", wbRels], ["xl/styles.xml", styles], ...sheetXml.map((x, i) => [`xl/worksheets/sheet${i + 1}.xml`, x])]);
  }

  async function save(blob, filename) {
    const file = new File([blob], filename, { type: blob.type });
    // 手機：優先用分享選單（可以存到檔案、傳 LINE）
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      try { await navigator.share({ files: [file], title: filename }); return "shared"; } catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    return "downloaded";
  }

  window.__tdh = window.__tdh || {};
  window.__tdh.xlsx = (sheets, reqs) => build(sheets, reqs);
  window.__tdh.saveFile = save;
})();
