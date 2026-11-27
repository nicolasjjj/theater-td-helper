"""Google 模式：登入 → 自動建立資料試算表 → 管理畫面新增場館、人員、案子 → 主畫面看得到"""
import asyncio, json, threading, http.server, functools, sys, pathlib, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fake_google import FakeGoogle
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent.parent; OUT = ROOT / "tests" / "out"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8802), functools.partial(Q, directory=str(ROOT / "dist")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
CLOCK = "(()=>{const R=Date,T=new R(2026,10,24,15,0).getTime();window.Date=class extends R{constructor(...a){a.length?super(...a):super(T)} static now(){return T}};})();"
U = "http://127.0.0.1:8802/"

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
        await pg.goto(U); await pg.wait_for_timeout(800); await shot("g01_choose")
        await pg.click("#tdhPickG"); await pg.wait_for_timeout(3500); await shot("g02_ready")
        await pg.fill("#tdhTd", "李小華"); await pg.click('.tdh-chips[data-for="tdhRole"] button:has-text("SM")')
        await pg.click('.tdh-chips[data-for="tdhTeam"] button:has-text("舞台組")'); await pg.click("#tdhSave"); await pg.wait_for_timeout(3500); await shot("g03_app")
        # 管理：場館、人員、劇團、案子
        await pg.click(".mg-btn"); await pg.wait_for_timeout(1200); await shot("g04_manage")
        async def add(tab, vals):
            await pg.click(f'.mg-tabs button[data-k="{tab}"]'); await pg.wait_for_timeout(600)
            await pg.click(".mg-add"); await pg.wait_for_timeout(400)
            for k, v in vals.items():
                sel = f'[id="f_{k}"]'
                if await pg.locator(sel).evaluate("e => e.tagName") == "SELECT": await pg.select_option(sel, v)
                else: await pg.fill(sel, v)
            await pg.click("#mgSave"); await pg.wait_for_timeout(900)
        await add("venue", {"場館名稱": "水源劇場", "地區": "雙北地區", "地址": "台北市中正區思源街"})
        await add("crew", {"姓名": "陳小米", "電話": "0912345678", "時段費": "900", "居住地區": "台北"})
        await add("crew", {"姓名": "林阿哲", "時段費": "850"})
        await add("troupe", {"劇團名稱": "光點劇場", "抬頭": "光點劇場有限公司", "統編": "12345678"}); await shot("g05_troupe")
        await pg.click('.mg-tabs button[data-k="cases"]'); await pg.wait_for_timeout(600); await pg.click(".mg-add"); await pg.wait_for_timeout(600)
        print("DBG", await pg.evaluate("[...document.querySelectorAll('#c_name')].map(e=>[e.offsetParent!==null,e.disabled,e.readOnly,getComputedStyle(e).visibility, e.getBoundingClientRect().height])"))
        await pg.fill("#c_name", "午後的信"); print("P1")
        await pg.select_option("#c_troupe", label="光點劇場"); await pg.select_option("#c_venue", label="水源劇場")
        await pg.fill("#c_s", "2026-12-10"); await pg.fill("#c_e", "2026-12-12"); await pg.fill("#c_l", "2026-12-09"); print("P2")
        await pg.click('#c_need [data-tag="全程缺2"]'); await pg.click('#c_need [data-tag="裝拆缺1"]')
        print("P3"); await pg.check("#c_tourOn"); print("P4", await pg.evaluate("[document.querySelector('#c_tourOn').checked, document.querySelector('#c_tourBox').style.display, typeof document.querySelector('#c_tourOn').onchange]")); await pg.fill("#c_tour", "2026午後的信")
        await shot("g06_caseform")
        await pg.click("#mgSave"); await pg.wait_for_timeout(1200); await shot("g07_cases")
        await pg.click('.mg-it:has-text("午後的信")'); await pg.wait_for_timeout(800); await pg.evaluate("document.querySelector('#c_tbl').scrollIntoView()"); await shot("g08_table")
        await pg.click("#mgBack"); await pg.wait_for_timeout(400)
        await pg.click("#mgX"); await pg.wait_for_timeout(4000); await shot("g09_app")
        # 看表格
        btns = pg.locator(".tblBtn")
        print("tblBtn", await btns.count())
        if await btns.count(): await btns.first.click(); await pg.wait_for_timeout(2500); await shot("g10_table"); await pg.mouse.click(195, 830); await pg.wait_for_timeout(400)
        # 加入/編輯：陳小米 全程 → 寫進 Call Time 排班表
        card = pg.locator('.card:has-text("午後的信")').first
        await card.locator(".bookBar").click(); await pg.wait_for_selector('.pchip:has-text("陳小米")', timeout=15000); await pg.wait_for_timeout(500)
        await pg.click('.pchip:has-text("陳小米")'); await pg.wait_for_timeout(1200); await shot("g11_chip")
        await pg.evaluate("[...document.querySelectorAll('.psheet button.primary')].find(x=>x.offsetParent).click()"); await pg.wait_for_timeout(3000); await shot("g12_after")
        await pg.emulate_media(color_scheme="dark"); await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.click(".mg-btn"); await pg.wait_for_timeout(1500)
        await pg.click('.mg-tabs button[data-k="crew"]'); await pg.wait_for_timeout(900); await shot("g13_crew_dark")
        await pg.click('.mg-tabs button[data-k="venue"]'); await pg.wait_for_timeout(900)
        await pg.click("#mgQ"); await pg.keyboard.type("水源"); await pg.wait_for_timeout(500)
        print("focus kept:", await pg.evaluate("document.activeElement && document.activeElement.id"))
        await pg.click('.mg-tabs button[data-k="cases"]'); await pg.wait_for_timeout(900); await pg.click('.mg-it:has-text("午後的信")'); await pg.wait_for_timeout(900); await shot("g14_case_dark")
        await pg.click("#mgX"); await pg.wait_for_timeout(3000)
        await pg.click(".tdh-gear"); await pg.wait_for_timeout(1500); await shot("g16_settings_top_dark"); await pg.evaluate("document.querySelector('.tdh-ov').scrollTop=9999"); await shot("g15_settings_dark")
        await pg.emulate_media(color_scheme="light"); await pg.evaluate("document.querySelector('.tdh-ov').scrollTop=0"); await shot("g17_settings_light")
        print("errors:", errs[:10])
        ss = [k for k, v in fg.files.items() if v["name"] == "劇場幫幫資料"][0]
        for sid, sh in fg.sheets[ss].items():
            print(sh["title"], [r[:6] for r in sh["grid"][:5]])
        h = fg.sheets[ss][0]["grid"]; ci = h[0].index("內容"); ki = h[0].index("摳的人")
        print("內容:", h[2][ci][:400]); print("摳的人:", h[2][ki])
        await b.close()
try:
    asyncio.run(main())
except Exception as e:
    print("FAIL", str(e)[:200])
srv.shutdown()
