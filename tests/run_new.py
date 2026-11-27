import asyncio, json, threading, http.server, functools, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fake_notion import Fake
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent.parent; OUT = ROOT / "tests" / "out"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8801), functools.partial(Q, directory=str(ROOT / "dist")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
CLOCK = "(()=>{const R=Date,T=new R(2026,10,24,15,0).getTime();window.Date=class extends R{constructor(...a){a.length?super(...a):super(T)} static now(){return T}};})();"
async def main():
    fk = Fake(empty=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await ctx.add_init_script(CLOCK); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        async def api(route):
            r = route.request; body = json.loads(r.post_data) if r.post_data else None
            st, js = fk.handle(r.method, r.url.split("/api", 1)[1], body)
            await route.fulfill(status=st, content_type="application/json", body=json.dumps(js))
        await pg.route("**/api/v1/**", api)
        await pg.goto("http://127.0.0.1:8801/"); await pg.wait_for_timeout(800); await pg.click("#tdhPickN"); await pg.wait_for_timeout(300)
        await pg.fill("#tdhTok", "ntn_new"); await pg.click("#tdhGo"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(OUT / "n1_pages.png"))
        await pg.click("#tdhPages button"); await pg.wait_for_timeout(9000)
        await pg.screenshot(path=str(OUT / "n2_created.png"))
        await pg.fill("#tdhTd", "新朋友"); await pg.click("#tdhSave"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=str(OUT / "n3_app.png"))
        await pg.click(".tblBtn"); await pg.wait_for_timeout(4000); await pg.screenshot(path=str(OUT / "n4_table.png"))
        await pg.mouse.click(195, 830); await pg.wait_for_timeout(400)
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await pg.click(".mg-btn"); await pg.wait_for_timeout(1500)
        await pg.click('.mg-tabs button[data-k="crew"]'); await pg.wait_for_timeout(800); await pg.click(".mg-add"); await pg.wait_for_timeout(400)
        await pg.fill('[id="f_姓名"]', "陳小米"); await pg.fill('[id="f_時段費"]', "900"); await pg.click("#mgSave"); await pg.wait_for_timeout(1500)
        await pg.click('.mg-tabs button[data-k="cases"]'); await pg.wait_for_timeout(800); await pg.click(".mg-add"); await pg.wait_for_timeout(600)
        await pg.fill("#c_name", "新的戲"); await pg.fill("#c_s", "2026-12-20"); await pg.fill("#c_e", "2026-12-21")
        await pg.click('#c_need button[data-n="全程"][data-d="1"]'); await pg.click("#mgSave"); await pg.wait_for_timeout(2500)
        await pg.click('.mg-it:has-text("範例")'); await pg.wait_for_timeout(800); await pg.click("#mgArc"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(OUT / "n5_manage.png"))
        await pg.click("#mgX"); await pg.wait_for_timeout(5000); await pg.screenshot(path=str(OUT / "n6_app.png"))
        cases_db = [d for d in fk.dbs.values() if d["title"][0]["plain_text"] == "劇場の案子"][0]["id"]
        for pid, pgx in fk.pages.items():
            if pgx["parent"].get("database_id") == cases_db:
                pr = pgx["properties"]; print("case:", "".join(x["plain_text"] for x in pr["案名"]["title"]), (pr.get("封存") or {}).get("checkbox"), [x["name"] for x in (pr.get("Crew 狀態") or {}).get("multi_select", [])], len(fk.children.get(pid, [])))
        print("dbs:", [(plain_t := "".join(x["plain_text"] for x in d["title"]), sorted(d["properties"].keys())) for d in fk.dbs.values()])
        print("errors:", errs)
        await b.close()
asyncio.run(main()); srv.shutdown()
