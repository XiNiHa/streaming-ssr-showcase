import { createServer } from "node:http";
import { Writable } from "node:stream";
import { createApp } from "h3";
import serveStatic from "serve-static";
import React from "react";
import ReactDOMServer from "react-dom/server";
import BasicApp from "./routes/Basic";
import NestedApp from "./routes/Nested";
import BasicDataApp from "./routes/BasicData";
import NestedDataApp from "./routes/NestedData";

const app = createApp({
  onError(err) {
    console.error(err);
  },
});

const routes = {
  "/basic": {
    el: () => (
      <div className="bg-red-200">
        <BasicApp />
      </div>
    ),
    source: "client-basic.js",
  },
  "/nested": {
    el: () => (
      <div className="bg-red-200">
        <NestedApp />
      </div>
    ),
    source: "client-nested.js",
  },
  "/basic-data": {
    el: () => (
      <div className="bg-red-200">
        <BasicDataApp />
      </div>
    ),
    source: "client-basic-data.js",
  },
  "/nested-data": {
    el: () => (
      <div className="bg-red-200">
        <NestedDataApp />
      </div>
    ),
    source: "client-nested-data.js",
  },
};

const frontHTML = (headAppend: string) => `
<!DOCTYPE HTML>
<html>
<head>
<script src="https://cdn.tailwindcss.com"></script>
${headAppend}
</head>
<body>
<div id="root">`;
const backHTML = `</div>
</body>
</html>`;

const ABORT_DELAY = 10000;

app.use(serveStatic("dist-client"));
app.use("/", (req, _, next) => {
  if (req.url !== "/") return next();

  return `
    <ol>
      <li><a href="/basic">Basic Suspense Streaming SSR Example</a></li>
      <li><a href="/nested">Nested Suspense Streaming SSR Example</a></li>
      <li><a href="/basic-data">Basic Suspense Streaming SSR Example With Data Dependency</a></li>
      <li><a href="/nested-data">Nested Suspense Streaming SSR Example With Data Dependency</a></li>
    </ol>
  `;
});
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.url == null) return next(new Error("url is null"));
  if (!(req.url in routes)) return next();

  let didError = false;
  const stream = new Writable({
    write(chunk, _encoding, cb) {
      res.write(chunk, cb);
    },
    final() {
      res.end(backHTML);
    },
  });
  const url = req.url as keyof typeof routes;

  console.log(url || "url unknown");
  const { pipe, abort } = ReactDOMServer.renderToPipeableStream(
    routes[url].el(),
    {
      bootstrapScriptContent: `window.BOOT ? BOOT() : (window.LOADED = true)`,
      onShellReady() {
        console.log("shell ready");
        res.statusCode = didError ? 500 : 200;
        res.setHeader("Connection", "Transfer-Encoding");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.write(
          frontHTML(`<script async src="${routes[url].source}"></script>`)
        );
        pipe(stream);
      },
      onAllReady() {
        console.log("all ready");
      },
      onError(x) {
        didError = true;
        console.error(x);
      },
    }
  );

  setTimeout(() => abort(), ABORT_DELAY);
});

createServer(app).listen(8080, () => {
  console.log("Listening on http://localhost:8080");
});
