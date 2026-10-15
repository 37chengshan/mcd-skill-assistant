import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const root = new URL("../docs/", import.meta.url);
const allowed = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.mjs", ["app.mjs", "text/javascript; charset=utf-8"]],
  ["/engine.mjs", ["engine.mjs", "text/javascript; charset=utf-8"]],
  ["/lab.mjs", ["lab.mjs", "text/javascript; charset=utf-8"]],
  ["/share.mjs", ["share.mjs", "text/javascript; charset=utf-8"]],
  ["/snapshot.mjs", ["snapshot.mjs", "text/javascript; charset=utf-8"]],
  ["/group.html", ["group.html", "text/html; charset=utf-8"]],
  ["/group.mjs", ["group.mjs", "text/javascript; charset=utf-8"]],
  ["/group-engine.mjs", ["group-engine.mjs", "text/javascript; charset=utf-8"]],
  ["/week.html", ["week.html", "text/html; charset=utf-8"]],
  ["/week.mjs", ["week.mjs", "text/javascript; charset=utf-8"]],
  ["/week-engine.mjs", ["week-engine.mjs", "text/javascript; charset=utf-8"]]
]);
const server = createServer(async (req, res) => {
  let pathname;
  try { pathname = new URL(req.url, "http://localhost").pathname; }
  catch { res.writeHead(400); res.end("Bad request"); return; }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return;
  }
  const item = allowed.get(pathname);
  if (!item) { res.writeHead(404); res.end("Not found"); return; }
  try {
    const data = await readFile(new URL(item[0], root));
    res.writeHead(200, {
      "Content-Type": item[1],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'",
      "Content-Length": String(data.byteLength)
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(500); res.end("Unable to load demo");
  }
});
server.listen(4173, "127.0.0.1", () =>
  console.log("本地演示已启动：http://127.0.0.1:4173 （按 Ctrl+C 停止）"));
