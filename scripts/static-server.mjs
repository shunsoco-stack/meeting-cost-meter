import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = /^\/result\/[^/]+\/?$/.test(pathname)
      ? "/result/view.html"
      : pathname.replace(/\/(__next\.[^/]+)\.__PAGE__\.txt$/, "/$1/__PAGE__.txt");
    const candidate = resolve(root, "." + relative);
    if (!candidate.startsWith(root + sep) && candidate !== root) {
      response.writeHead(403).end();
      return;
    }
    for (const file of [candidate, candidate + ".html", resolve(candidate, "index.html")]) {
      if (
        await stat(file)
          .then((info) => info.isFile())
          .catch(() => false)
      ) {
        response.writeHead(200, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
        });
        response.end(await readFile(file));
        return;
      }
    }
    response.writeHead(404).end("Not found");
  } catch {
    response.writeHead(400).end("Bad request");
  }
}).listen(3100, "127.0.0.1", () =>
  console.log("Static export verification: http://localhost:3100"),
);
