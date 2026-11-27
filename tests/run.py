import asyncio, json, threading, http.server, functools, sys, pathlib, os
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fake_notion import Fake
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent.parent
OUT = ROOT / "tests" / "out"; OUT.mkdir(exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / "dist"))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8800), functools.partial(Q, directory=str(ROOT / "dist")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
CLOCK = "(()=>{const R=Date,T=new R(2026,10,24,15,0).getTime();window.Date=class extends R{constructor(...a){a.length?super(...a):super(T)} static now(){return T}};})();"

async def main():
    fk = Fake()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, accept_downloads=True)
        await ctx.add_init_script(CLOCK)
        pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console:" + m.text) if m.type == "error" else None)
        async def api(route):
            r = route.request
            body = json.loads(r.post_data) if r.post_data else None
            assert r.headers.get("authorization") == "Bearer ntn_test", r.headers.get("authorization")
            st, js = fk.handle(r.method, r.url.split("/api", 1)[1], body)
            await route.fulfill(status=st, content_type="application/json", body=json.dumps(js))
        await pg.route("**/api/v1/**", api)
        async def shot(n): await pg.wait_for_timeout(600); await pg.screenshot(path=str(OUT / f"{n}.png"))
        U = "http://127.0.0.1:8800/"
        await pg.goto(U); await pg.wait_for_timeout(800); await shot("01_setup"); await pg.click("#tdhPickN"); await pg.wait_for_timeout(300)
        await pg.fill("#tdhTok", "ntn_test"); await pg.click("#tdhGo"); await pg.wait_for_timeout(1500); await shot("02_found")
        await pg.fill("#tdhTd", "王大明"); await pg.click("#tdhSave"); await pg.wait_for_timeout(4000); await shot("03_find")
        # 看表格
        await pg.click(".tblBtn"); await pg.wait_for_timeout(2500); await shot("04_table"); await pg.mouse.click(195, 830); await pg.wait_for_timeout(400)
        # 加入/編輯 → 陳小米 只有某幾天 → Day1, Day2
        await pg.click(".bookBar"); await pg.wait_for_selector('.pchip:has-text("陳小米")', timeout=15000); await pg.wait_for_timeout(500)
        await shot("045_book")
        await pg.click('.pchip:has-text("陳小米")'); await pg.wait_for_timeout(1500); await shot("046_chip")
        await pg.evaluate("[...document.querySelectorAll('.psheet button')].find(x=>x.offsetParent&&x.textContent.includes('只有某幾天可')).click()"); await pg.wait_for_timeout(400)
        rows = pg.locator(".cf-row"); await rows.nth(1).click(); await rows.nth(2).click(); await shot("05_confirm")
        n0 = len(fk.log)
        await pg.evaluate("[...document.querySelectorAll('.psheet button.primary')].find(x=>x.offsetParent).click()"); await pg.wait_for_timeout(4000)
        await shot("06_after_write")
        writes = [x for x in fk.log[n0:] if x[0] == "PATCH"]
        print("writes:", [(m, p.split('/')[-2] if 'blocks' in p else p.split('/')[1], (json.dumps(b, ensure_ascii=False)[:140])) for m, p, b in writes])
        # 進場中：打卡 11/25
        await pg.goto(U); await pg.wait_for_timeout(3000)
        await pg.click('.tdh-tabbar [data-t="live"]'); await pg.wait_for_timeout(3500); await shot("07_live")
        n0 = len(fk.log)
        await pg.evaluate("document.querySelector('.day[data-i=\"10\"]').scrollIntoView({block:'center'})")
        await pg.click('.day[data-i="10"] .qin[data-t="0900"]'); await pg.wait_for_timeout(300)
        await pg.click('.day[data-i="10"] .qout[data-t="2200"]'); await pg.wait_for_timeout(3000); await shot("08_punch")
        print("punch writes:", [json.dumps(b, ensure_ascii=False)[:200] for m, p, b in fk.log[n0:] if m == "PATCH"])
        # 截圖
        await pg.evaluate("window.scrollTo(0,0)"); await pg.click('.ptabs button[data-t="shot"]'); await pg.wait_for_timeout(1500)
        await pg.click("#shotTax"); await shot("09_tax"); await pg.mouse.click(195, 830); await pg.wait_for_timeout(300)
        await pg.click("#shotCrew"); await shot("10_crew"); await pg.mouse.click(195, 830); await pg.wait_for_timeout(300)
        # 結案：下載 Excel
        await pg.click('.tdh-tabbar [data-t="close"]'); await pg.wait_for_timeout(1500)
        await pg.click('.ptabs button[data-t="sheet"]'); await pg.wait_for_timeout(2000); await shot("11_sheet")
        async with pg.expect_download() as dl:
            await pg.click("#tsXlsx")
        d = await dl.value; await d.save_as(str(OUT / "timesheet.xlsx")); print("download:", d.suggested_filename)
        await shot("12_after_dl")
        # Google 試算表（假的 Google API，檢查送出的請求）
        gcalls = []
        async def gapi(route):
            rq = route.request; body = rq.post_data or ""
            gcalls.append((rq.method, rq.url, body))
            u = rq.url
            if "/api/google/config" in u: return await route.fulfill(json={"clientId": "x", "ready": True})
            if "/api/google/refresh" in u: return await route.fulfill(json={"access_token": "at", "expires_in": 3600})
            if "drive/v3/files" in u and rq.method == "GET": return await route.fulfill(json={"files": []})
            if "drive/v3/files" in u and "permissions" not in u: return await route.fulfill(json={"id": "F" + str(len(gcalls))})
            if "fields=sheets" in u: return await route.fulfill(json={"sheets": [{"properties": {"sheetId": 0}}]})
            return await route.fulfill(json={})
        await pg.route("**/api/google/**", gapi); await pg.route("https://www.googleapis.com/**", gapi); await pg.route("https://sheets.googleapis.com/**", gapi)
        await pg.evaluate("window.__tdh.setCfg({gRefresh:'r',gEmail:'a@b.c'})")
        await pg.click("#tsMake"); await pg.wait_for_timeout(2500); await shot("13_gsheet")
        import json as _j
        for m_, u_, b_ in gcalls: print("G", m_, u_[:90], len(b_))
        fmtreq = [y for x, u, y in gcalls if u.endswith(":batchUpdate") and "addConditionalFormatRule" in y]
        (OUT / "gsheet_reqs.json").write_text(fmtreq[0] if fmtreq else "")
        vals = [y for x, u, y in gcalls if "values:batchUpdate" in u]
        (OUT / "gsheet_vals.json").write_text(vals[0] if vals else "")
        print("errors:", errs[:10])
        await b.close()
asyncio.run(main())
srv.shutdown()
