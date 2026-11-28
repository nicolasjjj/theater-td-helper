// 劇場幫幫｜在 LINE、Facebook、Instagram 等 App 內建瀏覽器打開時：先請大家改用 Safari / Chrome
(() => {
  const ua = navigator.userAgent || "";
  const inApp = /\bLine\//i.test(ua) ? "LINE" : /FBAN|FBAV|FB_IAB|Messenger/i.test(ua) ? "Facebook / Messenger" : /Instagram/i.test(ua) ? "Instagram" : /Notion/i.test(ua) ? "Notion" : /MicroMessenger/i.test(ua) ? "WeChat" : "";
  if (!inApp) return;
  // LINE 支援這個參數：會自動改用手機預設的瀏覽器打開
  if (inApp === "LINE" && !/[?&]openExternalBrowser=1/.test(location.search)) {
    const u = new URL(location.href); u.searchParams.set("openExternalBrowser", "1");
    location.replace(u.toString()); return;
  }
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const url = location.origin + "/";
  const show = () => {
    const ov = document.createElement("div"); ov.id = "tdhInApp";
    ov.innerHTML = `<style>
      #tdhInApp{position:fixed;inset:0;z-index:2147483000;background:#f4f1ea;color:#1d1b18;font-family:-apple-system,"PingFang TC","Noto Sans TC",sans-serif;overflow:auto;padding:calc(28px + env(safe-area-inset-top)) 22px 40px}
      #tdhInApp .ic{width:64px;height:64px;border-radius:15px;display:block;margin-bottom:16px}
      #tdhInApp h1{font-size:24px;margin:0 0 8px;font-weight:800}
      #tdhInApp p{font-size:15.5px;line-height:1.7;margin:0 0 14px;color:#4a453e}
      #tdhInApp .box{background:#fff;border:1.5px solid #e4ded2;border-radius:16px;padding:16px;margin:16px 0}
      #tdhInApp ol{margin:0;padding-left:22px;font-size:15.5px;line-height:1.9}
      #tdhInApp b{color:#2f5d50}
      #tdhInApp .url{font-size:14px;background:#f4f1ea;border-radius:10px;padding:10px 12px;word-break:break-all;margin:10px 0}
      #tdhInApp button{width:100%;border:0;border-radius:14px;padding:15px;font:inherit;font-size:16px;font-weight:700;background:#2f5d50;color:#fff;cursor:pointer}
      #tdhInApp .skip{background:transparent;color:#8a8378;font-weight:400;font-size:13.5px;text-decoration:underline;margin-top:10px}
    </style>
    <img class="ic" src="/icon-192.png?v=3" alt="">
    <h1>請用 ${ios ? "Safari" : "Chrome"} 打開劇場幫幫</h1>
    <p>你現在是在 <b>${inApp}</b> 裡面的瀏覽器。這裡沒辦法記住你的登入和設定，Google 登入也可能失敗。</p>
    <div class="box"><ol>
      <li>按下面的「複製網址」</li>
      <li>打開 <b>${ios ? "Safari" : "Chrome"}</b></li>
      <li>在上方網址列貼上，前往</li></ol>
      <div class="url">${url}</div>
      <button id="tdhIACopy">複製網址</button></div>
    <p style="font-size:14px">也可以按右上角或右下角的「⋯」/ 分享按鈕，選「${ios ? "在 Safari 中打開" : "用瀏覽器開啟"}」。</p>
    <button class="skip" id="tdhIASkip">我知道了，還是在這裡繼續</button>`;
    document.body.appendChild(ov);
    ov.querySelector("#tdhIACopy").onclick = async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(url); }
      catch (x) { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (y) {} t.remove(); }
      b.textContent = "已複製！到 " + (ios ? "Safari" : "Chrome") + " 貼上";
    };
    ov.querySelector("#tdhIASkip").onclick = () => ov.remove();
  };
  if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
})();
