"""模擬 Notion 官方 API（只做網頁用到的部分），用示範資料測試獨立版。"""
import json, uuid, re, datetime

def nid(): return str(uuid.uuid4())
def rt(s, bold=False): return [{"type": "text", "plain_text": s, "text": {"content": s}, "annotations": {"bold": bold}}] if s else []
def plain(r): return "".join(x.get("plain_text") or x.get("text", {}).get("content", "") for x in r)

class Fake:
    def __init__(self, empty=False):
        self.dbs, self.pages, self.blocks, self.children = {}, {}, {}, {}
        self.log = []
        if empty:
            i = nid(); self.pages[i] = {"object": "page", "id": i, "url": "", "parent": {"type": "workspace"}, "properties": {"title": {"type": "title", "title": rt("劇場管理")}}}; self.children[i] = []
        else: self._build()

    def add_blocks(self, parent, blocks):
        for b in blocks or []:
            t = b["type"]; data = dict(b[t]); kids = data.pop("children", None)
            if t == "table_row": data = {"cells": [[dict(x, plain_text=x["text"]["content"]) for x in c] for c in data["cells"]]}
            if "rich_text" in data: data["rich_text"] = [dict(x, plain_text=x["text"]["content"]) for x in data["rich_text"]]
            i = nid(); self.blocks[i] = {"object": "block", "id": i, "type": t, t: data, "has_children": bool(kids)}
            self.children.setdefault(parent, []).append(i); self.children[i] = []
            self.add_blocks(i, kids)

    # ---------- data ----------
    def db(self, key, title, props):
        i = nid(); self.dbs[i] = {"object": "database", "id": i, "title": rt(title), "properties": {k: {"type": t, "name": k} for k, t in props.items()}}; return i
    def page(self, db, props):
        i = nid(); self.pages[i] = {"object": "page", "id": i, "url": f"https://www.notion.so/x-{i.replace('-', '')}", "parent": {"type": "database_id", "database_id": db}, "properties": props}; self.children[i] = []; return i
    def block(self, parent, typ, data, kids=None):
        i = nid(); b = {"object": "block", "id": i, "type": typ, typ: data, "has_children": bool(kids)}
        self.blocks[i] = b; self.children.setdefault(parent, []).append(i); self.children[i] = []
        for k in kids or []: k(i)
        return i

    def _build(self):
        V = self.db("venue", "劇場の場館", {"場館名稱": "title", "地區": "select"})
        T = self.db("troupe", "劇場の劇團", {"劇團名稱": "title", "抬頭": "rich_text", "統編": "rich_text"})
        C = self.db("crew", "劇場のCrew", {"姓名": "title", "時段費": "number", "時段費紀錄": "rich_text"})
        K = self.db("cases", "劇場の案子", {"案名": "title", "職位": "select", "劇團": "relation", "進場日期": "date", "進場地點": "relation", "裝車時間": "date",
                                            "裝車地點": "rich_text", "人力分配": "rich_text", "Crew 狀態": "multi_select", "問過的人": "relation", "摳的人": "relation",
                                            "TD姓名": "rich_text", "TD時段費": "number", "TD整筆費用": "number", "Crew時段費": "number", "前置": "rich_text", "前置段數": "number",
                                            "打卡": "rich_text", "時段表資料夾": "url", "巡演": "select"})
        self.ids = dict(venue=V, troupe=T, crew=C, cases=K)
        T_ = lambda s: {"type": "title", "title": rt(s)}
        R_ = lambda s: {"type": "rich_text", "rich_text": rt(s)}
        N_ = lambda v: {"type": "number", "number": v}
        S_ = lambda v: {"type": "select", "select": {"name": v} if v else None}
        M_ = lambda vs: {"type": "multi_select", "multi_select": [{"name": v} for v in vs]}
        D_ = lambda a, b=None: {"type": "date", "date": {"start": a, "end": b} if a else None}
        L_ = lambda ids: {"type": "relation", "relation": [{"id": i} for i in ids]}
        v1 = self.page(V, {"場館名稱": T_("水源劇場"), "地區": S_("雙北地區")})
        v2 = self.page(V, {"場館名稱": T_("台北表演藝術中心"), "地區": S_("雙北地區")})
        t1 = self.page(T, {"劇團名稱": T_("光點劇場"), "抬頭": R_("光點劇場有限公司"), "統編": R_("12345678")})
        t2 = self.page(T, {"劇團名稱": T_("微光劇團"), "抬頭": R_("微光劇團"), "統編": R_("87654321")})
        self.crew = {}
        for n in ["王小安", "林阿哲", "陳小米", "張大寶", "黃小樹", "吳阿光"]:
            self.crew[n] = self.page(C, {"姓名": T_(n), "時段費": N_(None), "時段費紀錄": R_("")})
        punch = ["11/15 裝車 晚"] + [f"11/{d} 進場 0900-2200" for d in range(16, 22)] + ["11/22 進場 休"] + [f"11/{d} 進場 0900-2200" for d in range(23, 25)]
        punch += ["$王小安 900", "$林阿哲 900", "$陳小米 850"]
        self.live = self.page(K, {"案名": T_("午後的信"), "職位": S_("TD"), "劇團": L_([t1]), "進場日期": D_("2026-11-16", "2026-11-29"), "進場地點": L_([v1]),
                                   "裝車時間": D_("2026-11-15"), "人力分配": R_("全程3、裝拆2"), "Crew 狀態": M_(["全部完成"]), "TD時段費": N_(1400), "Crew時段費": N_(850),
                                   "前置": R_("技術協調2\n繪製燈圖4"), "前置段數": N_(6), "打卡": R_("\n".join(punch)), "摳的人": L_([self.crew["王小安"], self.crew["林阿哲"]])})
        self.find = self.page(K, {"案名": T_("夏夜的排練場"), "職位": S_("TD"), "劇團": L_([t2]), "進場日期": D_("2026-12-14", "2026-12-20"), "進場地點": L_([v2]),
                                   "裝車時間": D_("2026-12-13"), "人力分配": R_("全程3、裝拆2"), "Crew 狀態": M_(["全程缺1", "裝拆缺1"]), "TD時段費": N_(1400), "Crew時段費": N_(900), "打卡": R_("")})
        self.page(K, {"案名": T_("別人的案子"), "職位": S_("Crew"), "進場日期": D_("2026-12-01", "2026-12-03")})
        self.page(K, {"案名": T_("去年的案子"), "職位": S_("TD"), "進場日期": D_("2025-10-01", "2025-10-05")})
        # 案子頁面內容：兩欄、callout、Call Time 表格
        wd = "日一二三四五六"
        def lab(m, d): return f"{m}/{d} ({wd[datetime.date(2026, m, d).isoweekday() % 7]})"
        def content(pid, rows):
            def table(p):
                self.block(p, "table", {"table_width": 2, "has_column_header": False}, [
                    (lambda l, n: (lambda tp: self.block(tp, "table_row", {"cells": [rt(l, True), rt(n)]})))(l, n) for l, n in rows])
            def col1(p): self.block(p, "callout", {"rich_text": rt("抬頭：\n統編：")})
            def col2(p):
                self.block(p, "callout", {"rich_text": rt("舞台組人員 Call Time")})
                table(p)
            self.block(pid, "column_list", {}, [lambda p: self.block(p, "column", {}, [col1]), lambda p: self.block(p, "column", {}, [col2])])
        rows = [("裝車", "王小安、張大寶")] + [(lab(11, d), "王小安、林阿哲、陳小米" if d < 23 else "王小安、林阿哲、黃小樹") for d in range(16, 29) if d != 22] + [(lab(11, 29) + " 拆台", "王小安、林阿哲、陳小米、張大寶"), ("卸車", "王小安、張大寶")]
        content(self.live, rows)
        content(self.find, [("裝車", "王小安")] + [(f"Day {i}", "王小安、林阿哲" if i < 3 else "") for i in range(1, 8)] + [("拆台", ""), ("卸車", "")])

    # ---------- api ----------
    def handle(self, method, path, body):
        self.log.append((method, path, body))
        p = path.split("?")[0]
        m = re.match(r"^/v1/(.*)$", p); p = m.group(1)
        if p == "search":
            if (body or {}).get("filter", {}).get("value") == "page": return 200, {"results": [x for x in self.pages.values() if x["parent"]["type"] != "database_id"], "has_more": False}
            return 200, {"results": list(self.dbs.values()), "has_more": False}
        if p == "databases" and method == "POST":
            i = nid(); props = {}
            for k, v in body["properties"].items():
                t = [x for x in v.keys()][0]; props[k] = {"type": t, "name": k, "id": nid()[:4], t: v[t]}
                if t == "relation":
                    tgt = self.dbs[v["relation"]["database_id"]]; sid = nid()[:4]; nm = "Related to " + plain(body["title"])
                    tgt["properties"][nm + sid] = {"type": "relation", "name": nm, "id": sid}
                    props[k]["relation"] = dict(v["relation"], dual_property={"synced_property_id": sid, "synced_property_name": nm})
            self.dbs[i] = {"object": "database", "id": i, "title": [dict(x, plain_text=x["text"]["content"]) for x in body["title"]], "properties": props}
            return 200, self.dbs[i]
        if p == "pages" and method == "POST":
            db = body["parent"]["database_id"]; props = {}
            for k, v in body["properties"].items():
                t = self.dbs[db]["properties"][k]["type"]; props[k] = dict(v, type=t)
                for kk in ("title", "rich_text"):
                    if kk in v: props[k][kk] = [dict(x, plain_text=x["text"]["content"]) for x in v[kk]]
            i = self.page(db, props); self.add_blocks(i, body.get("children")); return 200, self.pages[i]
        m = re.match(r"^databases/([\w-]+)$", p)
        if m and method == "PATCH":
            d = self.dbs[m.group(1)]
            for k, v in body["properties"].items():
                for pk, pv in list(d["properties"].items()):
                    if pv.get("id") == k: d["properties"][v["name"]] = dict(pv, name=v["name"]); del d["properties"][pk]
            return 200, d
        if m: return (200, self.dbs[m.group(1)]) if m.group(1) in self.dbs else (404, {"message": "no db"})
        m = re.match(r"^databases/([\w-]+)/query$", p)
        if m: return 200, self.query(m.group(1), body or {})
        m = re.match(r"^pages/([\w-]+)$", p)
        if m:
            pg = self.pages.get(m.group(1))
            if not pg: return 404, {"message": "no page"}
            if method == "PATCH":
                for k, v in (body.get("properties") or {}).items():
                    t = self.dbs[pg["parent"]["database_id"]]["properties"][k]["type"]
                    pg["properties"][k] = dict(v, type=t)
                    if t == "rich_text": pg["properties"][k]["rich_text"] = [dict(x, plain_text=x["text"]["content"]) for x in v["rich_text"]]
            return 200, pg
        m = re.match(r"^blocks/([\w-]+)/children$", p)
        if m: return 200, {"results": [self.blocks[i] for i in self.children.get(m.group(1), [])], "has_more": False}
        m = re.match(r"^blocks/([\w-]+)$", p)
        if m and method == "PATCH":
            b = self.blocks[m.group(1)]
            b["table_row"]["cells"] = [[dict(x, plain_text=x["text"]["content"]) for x in c] for c in body["table_row"]["cells"]]
            return 200, b
        return 404, {"message": "unknown " + p}

    def query(self, db, body):
        rows = [pg for pg in self.pages.values() if pg["parent"].get("database_id") == db]
        def ok(pg, f):
            if "and" in f: return all(ok(pg, x) for x in f["and"])
            pr = pg["properties"].get(f["property"]) or {}
            if "select" in f: return (pr.get("select") or {}).get("name") == f["select"]["equals"]
            if "multi_select" in f: return f["multi_select"]["does_not_contain"] not in [x["name"] for x in pr.get("multi_select") or []]
            if "date" in f:
                d = (pr.get("date") or {}).get("start")
                if not d: return False
                if "on_or_after" in f["date"]: return d >= f["date"]["on_or_after"]
                if "on_or_before" in f["date"]: return d <= f["date"]["on_or_before"]
            return True
        if body.get("filter"): rows = [r for r in rows if ok(r, body["filter"])]
        return {"results": rows, "has_more": False, "next_cursor": None}
