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
import { DataState } from "./data/DataLayer";
import NonStreamedNestedDataApp from "./routes/NonStreamedNestedData";

const app = createApp({
  onError(err) {
    console.error(err);
  },
});

type Route = {
  el: () => JSX.Element;
  source: string;
  cache?: Map<string, DataState>;
};

const routes: Record<string, () => Route> = {
  "/basic": () => ({
    el: () => (
      <div className="bg-red-200">
        <BasicApp />
      </div>
    ),
    source: "client-basic.js",
  }),
  "/nested": () => ({
    el: () => (
      <div className="bg-red-200">
        <NestedApp />
      </div>
    ),
    source: "client-nested.js",
  }),
  "/basic-data": () => ({
    el: () => (
      <div className="bg-red-200">
        <BasicDataApp />
      </div>
    ),
    source: "client-basic-data.js",
  }),
  "/nested-data": () => ({
    el: () => (
      <div className="bg-red-200">
        <NestedDataApp />
      </div>
    ),
    source: "client-nested-data.js",
  }),
  "/non-streamed-nested-data": () => {
    const cache = new Map<string, DataState>();

    return {
      el: () => (
        <div className="bg-red-200">
          <NonStreamedNestedDataApp cache={cache} />
        </div>
      ),
      cache,
      source: "client-non-streamed-nested-data.js",
    } as const;
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
      <li><a href="/non-streamed-nested-data">Nested Suspense Streaming SSR Example With Data Dependency, Without Data Streaming (Intended to be broken)</a></li>
    </ol>
  `;
});
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.url == null) return next(new Error("url is null"));
  if (!(req.url in routes)) return next();

  const url = req.url as keyof typeof routes;
  console.log(url || "url unknown");
  const route = routes[url]();

  let didError = false;
  const stream = new Writable({
    write(chunk, _encoding, cb) {
      res.write(chunk, cb);
    },
    final() {
      if (route.cache) {
        const data = Array.from(route.cache.entries())
          .map(([k, v]) => "value" in v && JSON.stringify([k, v.value]))
          .filter(Boolean);

        res.write(
          `<script>let data=[${data.join(",")}];window.putCache?data.map(([k,v])=>window.putCache(k,v)):(window.dataCaches=[...(window.dataCaches??[]),data.map(([key,value])=>({key,value}))])</script>`
        );
      }
      res.end(backHTML);
    },
  });

  const { pipe, abort } = ReactDOMServer.renderToPipeableStream(route.el(), {
    bootstrapScriptContent: `window.BOOT ? BOOT() : (window.LOADED = true)`,
    onShellReady() {
      console.log("shell ready");
      res.statusCode = didError ? 500 : 200;
      res.setHeader("Connection", "Transfer-Encoding");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.write(frontHTML(`<script async src="${route.source}"></script>`));
      pipe(stream);
    },
    onAllReady() {
      console.log("all ready");
    },
    onError(x) {
      didError = true;
      console.error(x);
    },
  });

  setTimeout(() => abort(), ABORT_DELAY);
});

createServer(app).listen(8080, () => {
  console.log("Listening on http://localhost:8080");
});
