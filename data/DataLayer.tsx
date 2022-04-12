/**
 * Mocked data layer that simulates network requests
 */

import React, {
  createContext,
  ReactNode,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";

// Context for providing the data cache
const Context = createContext<Map<string, DataState>>(null as any);

// Root global cache
const globalCache = new Map<string, DataState>();

// Cache provider component
export const CacheProvider: React.FC<{
  cache?: Map<string, DataState>;
  children: ReactNode;
}> = ({ cache, children }) => {
  const _cache =
    cache ?? // Use the cache provided from props if it exists
    (typeof window !== "undefined"
      ? globalCache // Or use the global cache if it's a browser
      : new Map<string, DataState>()); // Or create a new cache if it's server

  return <Context.Provider value={_cache}>{children}</Context.Provider>;
};

// Type for representing the state of the (simulated) data fetching
export type DataState =
  | {
      state: "pending";
      promise: Promise<string>;
    }
  | {
      state: "fulfilled";
      value: string;
    };

declare global {
  interface Window {
    globalCache?: Map<string, DataState>;
    dataCaches?: { key: string; value: string }[];
    putCache?: (key: string, value: string) => void;
  }
}

// Declare globals if it's browser
if (typeof window !== "undefined") {
  window.globalCache = globalCache;
  // Fill cache if there's any data that are already provided from the DOM content
  if (window.dataCaches) {
    for (const { key, value } of window.dataCaches) {
      globalCache.set(key, { state: "fulfilled", value });
    }
  }
  // Declare a global way to put content in the cache
  window.putCache = (k, v) => {
    globalCache.set(k, { state: "fulfilled", value: v });
  };
  delete window.dataCaches;
}

// Hook for loading the data in React components
export const loadData = (id: string) => {
  const cache = useContext(Context);
  const [initialRender, setInitialRender] = useState(true);
  let cacheData = cache.get(id);

  // Initialize cache if there's no state with the id
  if (!cacheData) {
    cache.set(
      id,
      (cacheData = {
        state: "pending",
        // Simulated network request
        promise: new Promise((resolve) =>
          setTimeout(() => {
            const value = id.split("").reverse().join("") + Date.now(); // Appending Date.now() makes hydration mismatch noticeable if client refetched the data
            cache.set(id, {
              state: "fulfilled",
              value,
            });
            resolve(value);
          }, 2000)
        ),
      })
    );
  }

  // Throw if it's still pending
  if (cacheData.state === "pending") {
    throw cacheData.promise;
  }

  useEffect(() => {
    startTransition(() => setInitialRender(false));
  }, [setInitialRender]);

  return {
    // Return the value
    value: cacheData.value,
    // And a load script that injects the data that it depends to the global cache on browser
    loadScript: initialRender ? (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.putCache ? window.putCache("${id}", "${cacheData.value}") : (window.dataCaches = [...(window.dataCaches ?? []), { key: "${id}", value: "${cacheData.value}" }])
          `,
        }}
      />
    ) : null,
  };
};
