"""假的 Google 雲端硬碟＋試算表 API（只做劇場幫幫會用到的部分）"""
import json, re, urllib.parse, itertools

def col_idx(s):
    n = 0
    for ch in s: n = n * 26 + ord(ch) - 64
    return n - 1

def parse_range(r):
    r = urllib.parse.unquote(r)
    m = re.match(r"^'?(.*?)'?!(.*)$", r)
    tab, ref = m.group(1), m.group(2)
    m2 = re.match(r"^([A-Z]*)(\d*)(?::([A-Z]*)(\d*))?$", ref)
    c0, r0, c1, r1 = m2.groups()
    return tab, (col_idx(c0) if c0 else 0), (int(r0) - 1 if r0 else 0), (col_idx(c1) if c1 else None), (int(r1) - 1 if r1 else None)

class FakeGoogle:
    def __init__(self):
        self.files = {}      # id -> {name, mimeType, parents, trashed}
        self.sheets = {}     # ssid -> {sheetId: {title, grid: [[...]]}}
        self.ids = itertools.count(1)
        self.calls = []

    def new_id(self, p="f"): return f"{p}{next(self.ids):06d}xyzABCDEFGHIJ"

    def handle(self, method, url, body):
        self.calls.append((method, url))
        u = urllib.parse.urlparse(url); q = urllib.parse.parse_qs(u.query); path = u.path
        if u.netloc == "www.googleapis.com":
            m = re.match(r"^/drive/v3/files(?:/([^/]+))?(/permissions)?$", path)
            fid, perm = m.group(1), m.group(2)
            if perm: return 200, {"id": "p1"}
            if fid and method == "GET":
                f = self.files.get(fid)
                return (200, {"id": fid, "trashed": f["trashed"]}) if f else (404, {"error": {"message": "not found"}})
            if method == "GET":
                qq = q.get("q", [""])[0]
                name = re.search(r"name = '(.*?)'", qq).group(1)
                mt = re.search(r"mimeType = '(.*?)'", qq).group(1)
                par = re.search(r"'([^']+)' in parents", qq)
                res = [{"id": k, "name": v["name"]} for k, v in self.files.items() if v["name"] == name and v["mimeType"] == mt and not v["trashed"] and (not par or par.group(1) in v["parents"])]
                return 200, {"files": res}
            if method == "POST":
                fid = self.new_id()
                self.files[fid] = {"name": body["name"], "mimeType": body["mimeType"], "parents": body.get("parents", []), "trashed": False}
                if body["mimeType"].endswith("spreadsheet"): self.sheets[fid] = {0: {"title": "工作表1", "grid": []}}
                return 200, {"id": fid}
        if u.netloc == "sheets.googleapis.com":
            m = re.match(r"^/v4/spreadsheets/([^/:]+)(?::(batchUpdate))?(?:/values(?::(batchGet|batchUpdate)|/([^:]+):append))?$", path)
            ss, bu, vop, app = m.groups()
            book = self.sheets[ss]
            by_title = {v["title"]: v for v in book.values()}
            if bu:
                for rq in body["requests"]:
                    k = next(iter(rq)); v = rq[k]
                    if k == "updateSheetProperties":
                        p = v["properties"]
                        if "title" in p: book[p["sheetId"]]["title"] = p["title"]
                    elif k == "addSheet":
                        p = v["properties"]; book[p["sheetId"]] = {"title": p["title"], "grid": []}
                    elif k == "deleteDimension":
                        r = v["range"]; g = book[r["sheetId"]]["grid"]; del g[r["startIndex"]:r["endIndex"]]
                return 200, {}
            if vop == "batchGet":
                out = []
                for r in q.get("ranges", []):
                    tab, c0, r0, c1, r1 = parse_range(r)
                    g = by_title[tab]["grid"]
                    rows = g[r0:(r1 + 1 if r1 is not None else None)]
                    out.append({"range": r, "values": [row[:] for row in rows] if rows else []})
                    if r1 == 0: out[-1]["values"] = [g[0][:]] if g else []
                return 200, {"valueRanges": out}
            if vop == "batchUpdate":
                for d in body["data"]:
                    tab, c0, r0, _, _ = parse_range(d["range"])
                    g = by_title[tab]["grid"]
                    for i, row in enumerate(d["values"]):
                        while len(g) <= r0 + i: g.append([])
                        rr = g[r0 + i]
                        for j, val in enumerate(row):
                            while len(rr) <= c0 + j: rr.append("")
                            rr[c0 + j] = val
                return 200, {}
            if app:
                tab, *_ = parse_range(app)
                g = by_title[tab]["grid"]
                g.append(list(body["values"][0]))
                n = len(g)
                return 200, {"updates": {"updatedRange": f"'{tab}'!A{n}:Z{n}"}}
            if method == "GET":
                return 200, {"sheets": [{"properties": {"sheetId": sid, "title": v["title"]}} for sid, v in book.items()]}
        return 404, {"error": {"message": "unknown " + url}}
