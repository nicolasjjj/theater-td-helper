"""Google 模式：登入 → 自動建立資料試算表 → 管理畫面新增場館、人員、案子 → 主畫面看得到"""
import asyncio, json, threading, http.server, functools, sys, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fake_google import FakeGoogle
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent.parent; OUT = ROOT / "tests" / "out"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8803), functools.partial(Q, directory=str(ROOT / "dist")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
CLOCK = "try{localStorage.setItem('tdh.tour','1');localStorage.setItem('tdh.seeded','1')}catch(e){};(()=>{const R=Date,T=new R(2026,10,24,15,0).getTime();window.Date=class extends R{constructor(...a){a.length?super(...a):super(T)} static now(){return T}};})();"
U = "http://127.0.0.1:8803/"

async def main():
    fg = FakeGoogle()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await ctx.add_init_script(CLOCK); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: (errs.append(str(e)), print("PAGEERR", e)))
        pg.on("console", lambda m: errs.append("console:" + m.text) if m.type == "error" else None)
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        async def gapi(route):
            r = route.request; u = r.url
            if "/api/google/config" in u: return await route.fulfill(json={"clientId": "cid", "ready": True})
            if "/api/google/token" in u: return await route.fulfill(json={"access_token": "at", "expires_in": 3600, "refresh_token": "rt", "email": "friend@gmail.com"})
            if "/api/google/refresh" in u: return await route.fulfill(json={"access_token": "at", "expires_in": 3600})
            if "accounts.google.com" in u:
                st = urllib.parse.parse_qs(urllib.parse.urlparse(u).query)["state"][0]
                return await route.fulfill(status=302, headers={"Location": U + "?code=abc&state=" + st})
            assert r.headers.get("authorization") == "Bearer at"
            body = json.loads(r.post_data) if r.post_data else None
            st, js = fg.handle(r.method, u, body)
            if st != 200: print("FAKE", st, r.method, u, js)
            await route.fulfill(status=st, json=js)
        for pat in ["**/api/google/**", "https://accounts.google.com/**", "https://www.googleapis.com/**", "https://sheets.googleapis.com/**"]: await pg.route(pat, gapi)
        async def shot(n): await pg.wait_for_timeout(500); await pg.screenshot(path=str(OUT / f"{n}.png"))
        await pg.goto(U + "?ui=D1"); await pg.wait_for_timeout(800)
        await pg.click("#tdhPickG"); await pg.wait_for_timeout(3500)
        await pg.fill("#tdhTd", "李小華"); await pg.click('.tdh-chips[data-for="tdhRole"] button:has-text("SM")')
        await pg.click("#tdhSave"); await pg.wait_for_timeout(3500); await shot("d1_find")
        await pg.click("#findView .tdh-menu"); await pg.wait_for_timeout(600); await shot("d1_drawer")
        await pg.click('.tdh-drawer [data-new]'); await pg.wait_for_timeout(1500)
        await pg.fill("#c_name", "午後的信"); await pg.fill("#c_s", "2026-11-23"); await pg.fill("#c_e", "2026-11-27")
        await pg.click('#c_need [data-tag="全程缺1"]'); await pg.click("#mgSave"); await pg.wait_for_timeout(1500); await shot("d1_cases")
        await pg.click('.mg-it:has-text("午後的信")'); await pg.wait_for_timeout(1500); await shot("d1_board")
        await pg.click("#mgHAct"); await pg.wait_for_timeout(1200); await shot("d1_edit")
        await pg.evaluate("document.querySelector('#mgDel').scrollIntoView()"); await shot("d1_edit_bottom")
        await pg.click("#mgCancel"); await pg.wait_for_timeout(1200); await pg.click("#mgHBack"); await pg.wait_for_timeout(800)
        await pg.click(".mg .tdh-menu"); await pg.wait_for_timeout(500); await pg.click("#dbTog"); await pg.wait_for_timeout(300); await shot("d1_drawer2")
        await pg.click(".tdh-drawer [data-set]"); await pg.wait_for_timeout(1200); await pg.click("#tdhDone"); await pg.wait_for_timeout(800); await shot("d1_after_settings")
        await pg.click("#rcTog"); await pg.wait_for_timeout(300); await shot("d1_recent")
        await pg.click('.tdh-drawer [data-v="crew"]'); await pg.wait_for_timeout(1200); await shot("d1_crew")
        await pg.click(".mg-add"); await pg.wait_for_timeout(600); await pg.fill('[id="f_姓名"]', "陳小米"); await pg.fill('[id="f_電話"]', "0912345678"); await pg.click("#mgSave"); await pg.wait_for_timeout(1200)
        await pg.click('.mg-it:has-text("陳小米")'); await pg.wait_for_timeout(1200); await shot("d1_crewboard")
        await pg.click('.tdh-tabbar [data-t="find"]'); await pg.wait_for_timeout(3000); await shot("d1_find2")
        await pg.click('.card:has-text("午後的信") .tblBtn'); await pg.wait_for_timeout(3000); await shot("d1_detail")
        await pg.click('.tdh-tabbar [data-t="close"]'); await pg.wait_for_timeout(4000); await shot("d1_close")
        # D2
        await pg.goto(U + "?ui=D2"); await pg.wait_for_timeout(4500); await shot("d2_home")
        await pg.click('.cd:has-text("午後的信") [data-go="live"]'); await pg.wait_for_timeout(4000); await shot("d2_live")
        await pg.click("#punchView .tdh-menu"); await pg.wait_for_timeout(600); await shot("d2_drawer")
        await pg.click('.tdh-drawer [data-v="home"]'); await pg.wait_for_timeout(2500)
        await pg.click('.cd:has-text("範例") [data-go="find"]'); await pg.wait_for_timeout(3500); await shot("d2_find")
        # 個人打卡模式
        await pg.evaluate("window.__tdh.setCfg({use:'solo'})"); await pg.goto(U + "?ui=D1"); await pg.wait_for_timeout(4500)
        assert await pg.locator('.tdh-tabbar [data-t="find"]').count() == 0
        await pg.click('.tdh-tabbar [data-t="live"]'); await pg.wait_for_timeout(3000); await shot("s1_live")
        await pg.click(".sum.tap"); await pg.wait_for_timeout(900); await shot("s2_mine_pop"); await pg.click("#shotLayer"); await pg.wait_for_timeout(400)
        await pg.click('.tdh-tabbar [data-t="close"]'); await pg.wait_for_timeout(3000); await shot("s3_close")
        if await pg.locator("#mineCopy").count(): await pg.click("#mineCopy"); await pg.wait_for_timeout(500)
        await pg.locator(".tdh-menu:visible").first.click(); await pg.wait_for_timeout(700); await shot("s4_drawer"); await pg.click(".tdh-drawer .sh", position={"x":380,"y":400})
        await pg.evaluate("window.__tdh.openSettings()"); await pg.wait_for_timeout(800); await pg.click(".tdh-q >> nth=0"); await pg.wait_for_timeout(500); await shot("s5_help")
        print("errors:", errs[:10])
        await b.close()
try:
    asyncio.run(main())
except Exception as e:
    print("FAIL", str(e)[:200])
srv.shutdown()
