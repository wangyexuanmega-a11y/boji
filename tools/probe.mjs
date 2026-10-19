/**
 * CDP 探针：批量截多页全图 + 布局体检
 * 用法: node tools/probe.mjs <baseUrl> <outDir> <width> <height> <hash1,hash2,...> [evalJs]
 */
import fs from "node:fs";
import { spawn } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:8765/";
const OUTDIR = process.argv[3] || "C:/Users/lenovo/Desktop/暑假项目/薄肌/.shots";
const VW = Number(process.argv[4] || 390);
const VH = Number(process.argv[5] || 844);
const HASHES = (process.argv[6] || "today").split(",").filter(Boolean);
const EVAL_ARG = process.argv[7] || "";
const EVAL_JS = EVAL_ARG.startsWith("@") ? fs.readFileSync(EVAL_ARG.slice(1), "utf8") : EVAL_ARG;
const PORT = 9333;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUTDIR, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, `--window-size=${VW},${VH}`, "about:blank",
], { stdio: "ignore" });

let wsUrl = null;
for (let i = 0; i < 40; i++) {
  await sleep(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page?.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
  } catch { /* wait */ }
}
if (!wsUrl) { console.error("CDP 连接失败"); chrome.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id;
  pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: VW, height: VH, deviceScaleFactor: 2, mobile: true });

await send("Page.navigate", { url: BASE });
await sleep(1400);

if (EVAL_JS) {
  const r = await send("Runtime.evaluate", { expression: EVAL_JS, awaitPromise: true, returnByValue: true });
  console.log("eval:", JSON.stringify(r.result?.value ?? r.result?.description ?? null));
  await sleep(500);
}

const probe = `(() => {
  const de = document.documentElement;
  const bad = [];
  document.querySelectorAll("*").forEach(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.display === "none") return;
    if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)) {
      bad.push(el.tagName.toLowerCase() + "." + String(el.className).slice(0,40) + " [" + Math.round(r.left) + "," + Math.round(r.right) + "]");
    }
  });
  const errs = window.__errs || [];
  return JSON.stringify({ w: de.clientWidth, scroll: de.scrollWidth, overflow: bad.slice(0,8), errs });
})()`;

for (const h of HASHES) {
  await send("Runtime.evaluate", { expression: `location.hash = ${JSON.stringify("#" + h)}` });
  await sleep(600);
  const pr = await send("Runtime.evaluate", { expression: probe, returnByValue: true });
  console.log(h, "→", pr.result.value);

  const metrics = await send("Page.getLayoutMetrics");
  const fullH = Math.min(Math.ceil(metrics.cssContentSize.height), 9000);
  await send("Emulation.setDeviceMetricsOverride", { width: VW, height: fullH, deviceScaleFactor: 2, mobile: true });
  await sleep(350);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(`${OUTDIR}/${h}.png`, Buffer.from(shot.data, "base64"));
  console.log("  saved", h + ".png", fullH + "px");
  await send("Emulation.setDeviceMetricsOverride", { width: VW, height: VH, deviceScaleFactor: 2, mobile: true });
  await sleep(200);
}

ws.close();
chrome.kill();
process.exit(0);
