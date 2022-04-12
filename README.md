# streaming-ssr-showcase

This repository contains 5 examples that show the usage of Streaming SSR API that got added in React 18.
Feel free to ask any questions through Issues!

## `/basic`: Basic Suspense Streaming SSR Example

This example shows how React Streaming SSR works.

The UI is constructed in two parts: static, synchronous sidebar, and asynchronous, suspended container.
Both parts contain a simple counter for checking whether each part is hydrated or not.

### Points to learn

- The streaming starts right after the synchronous parts (also known as shells) are rendered.
- Each streamed part gets hydrated and becomes interactive as soon as they arrive at the client.
- Each suspended part is streamed as soon as it resumes.
- Page load ends when the last suspended part gets streamed.

## `/nested`: Nested Suspense Streaming SSR Example

This example shows how Streaming SSR works when the app has nested Suspense boundaries.

### Points to learn

- Each Suspense boundary gets streamed as soon as it resumes, even when any of its children are suspended.
- Each Suspense boundary gets hydrated as soon as they arrive at the client.

## `/basic-data`: Basic Suspense Streaming SSR Example With Data Dependency

This example shows how data fetching with Suspense should be implemented when used with Streaming SSR.

The primary concern is: how to stream the data before parts that require the data to hydrate? This example solves the problem by injecting an inline script that fills the global cache. Then when the component gets hydrated, it'll pull the data from the global cache. Therefore there will be no hydration mismatch.

### Points to learn

- It's possible to implement data fetching with Suspense even though React doesn't provide any primitives for them, although it looks a bit dirty and hacky.
- Without streaming the data with the suspended part that depends on the data, hydration will fail, and React will fallback to client-side render.
- Streaming data can be done by using an inline script that fills the global cache.

## `/nested-data`: Nested Suspense Streaming SSR Example With Data Dependency

This example shows how well-implemented data fetching with Suspense works with Streaming SSR even when there are nested data dependencies with Suspense boundaries.

### Points to learn

- If done right, data fetching with Suspense works without any problem even when there are nested data dependencies with Suspense boundaries since the data each part use gets streamed along with the parts.

## `/non-streamed-nested-data`: Nested Suspense Streaming SSR Example With Data Dependency, Without Data Streaming (Intended to be broken)

This example shows how nested data dependencies with Suspense boundaries can break data fetching with Suspense when using Streaming SSR if it's not implemented in the right way.

Once the first suspended part resumes, it renders the HTML received from the server. However, while hydrating it, hydration mismatch occurs since the data don't match between server-rendered HTML and client-rendered VDOM (the data contains `Date.now()` to intentionally break the hydration, but that doesn't change the result actually, as the client-rendered component will always suspend if the cache is empty), therefore it fallbacks to client rendering. You can check that the component got client-rendered by checking the counter is not interactive for a few secs, and then the numeric part of the data changes when the loading ends.

### Points to learn

- If done wrongly, data fetching with Suspense breaks very easily when there are nested data dependencies with Suspense boundaries since the data each part use gets streamed at the end of the stream, which makes the cache empty (which results in hydration mismatch) while steaming is ongoing.
