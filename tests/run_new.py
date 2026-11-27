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
        await pg.goto("http://127.0.0.1:8801/"); await pg.wait_for_timeout(800)
        await pg.fill("#tdhTok", "ntn_new"); await pg.click("#tdhGo"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(OUT / "n1_pages.png"))
        await pg.click("#tdhPages button"); await pg.wait_for_timeout(9000)
        await pg.screenshot(path=str(OUT / "n2_created.png"))
        await pg.fill("#tdhTd", "新朋友"); await pg.click("#tdhSave"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=str(OUT / "n3_app.png"))
        await pg.click(".tblBtn"); await pg.wait_for_timeout(4000); await pg.screenshot(path=str(OUT / "n4_table.png"))
        print("dbs:", [(plain_t := "".join(x["plain_text"] for x in d["title"]), sorted(d["properties"].keys())) for d in fk.dbs.values()])
        print("errors:", errs)
        await b.close()
asyncio.run(main()); srv.shutdown()
