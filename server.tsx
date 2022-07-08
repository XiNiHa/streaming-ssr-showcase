/**
 * Server entry point using h3 (like express).
 */

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

// A route object that contains the JSX element, the path of the client entry file, and optionally a global cache.
type Route = {
  el: JSX.Element;
  source: string;
  cache?: Map<string, DataState>;
};

// Route definitions
const routes: Record<string, () => Route> = {
  "/basic": () => ({
    el: <BasicApp />,
    source: "client-basic.js",
  }),
  "/nested": () => ({
    el: <NestedApp />,
    source: "client-nested.js",
  }),
  "/basic-data": () => ({
    el: <BasicDataApp />,
    source: "client-basic-data.js",
  }),
  "/nested-data": () => ({
    el: <NestedDataApp />,
    source: "client-nested-data.js",
  }),
  "/non-streamed-nested-data": () => {
    // This example uses a global cache.
    const cache = new Map<string, DataState>();

    return {
      el: <NonStreamedNestedDataApp cache={cache} />,
      cache,
      source: "client-non-streamed-nested-data.js",
    } as const;
  },
};

// The front part of the HTML. it'll be streamed before the ReactDOMServer render result.
const frontHTML = (headAppend: string) => `
<!DOCTYPE HTML>
<html>
<head>
<script src="https://cdn.tailwindcss.com"></script>
${headAppend}
</head>
<body>
<div id="root">`;
// The back part of the HTML. it'll be streamed after the ReactDOMServer render result.
const backHTML = `</div>
</body>
</html>`;

// Abort delay. The stream will be aborted if it didn't end after the delay.
const ABORT_DELAY = 10000;

// Serve client static JS files
app.use(serveStatic("dist-client"));

// Landing page, provides links to the routes
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

// Main SSR handler.
app.use((req, res, next) => {
  // Bit of front checks
  if (req.method !== "GET") return next();
  if (req.url == null) return next(new Error("url is null"));
  if (!(req.url in routes)) return next();

  const url = req.url as keyof typeof routes;
  console.log(url);
  // Get the route. Since routes are functions, they are newly generated each request.
  const route = routes[url]();

  let didError = false;
  // Simple stream wrapper for writing `backHTML` before closing the stream.
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
          `<script>
          const data =[${data.join(",")}];
          window.putCache
            ? data.map(([k, v]) => window.putCache(k, v))
            : (window.dataCaches = [
              ...(window.dataCaches ?? []),
              data.map(([key, value]) => ({key,value}))
            ])
          </script>`
        );
      }
      res.end(backHTML);
    },
  });

  // Render the React app.
  const { pipe, abort } = ReactDOMServer.renderToPipeableStream(route.el, {
    // This script will either trigger hydration or mark hydration to be triggered after the client entry gets loaded.
    bootstrapScriptContent: `window.BOOT ? BOOT() : (window.LOADED = true)`,
    // Executed when the shell (Non-Suspense parts of the React app) is ready
    onShellReady() {
      console.log("shell ready");
      res.statusCode = didError ? 500 : 200;
      // Set headers for streaming
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      // Write front HTML
      res.write(frontHTML(`<script async src="${route.source}"></script>`));
      // Pipe React app render result
      pipe(stream);
    },
    // Executed when everything is complete
    onAllReady() {
      console.log("all ready");
    },
    // Executed when the shell render resulted in error
    onError(x) {
      didError = true;
      console.error(x);
    },
  });

  // Abort when the stream takes too long.
  setTimeout(() => abort(), ABORT_DELAY);
});

createServer(app).listen(8080, () => {
  console.log("Listening on http://localhost:8080");
});
