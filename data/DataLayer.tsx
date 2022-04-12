import React, { createContext, ReactNode, useContext } from "react";

const Context = createContext<Map<string, DataState>>(null as any);

const globalCache = new Map<string, DataState>();

export const CacheProvider: React.FC<{
  cache?: Map<string, DataState>;
  children: ReactNode;
}> = ({ cache, children }) => {
  const _cache =
    cache ??
    (typeof window !== "undefined"
      ? globalCache
      : new Map<string, DataState>());

  return <Context.Provider value={_cache}>{children}</Context.Provider>;
};

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

if (typeof window !== "undefined") {
  window.globalCache = globalCache;
  if (window.dataCaches) {
    for (const { key, value } of window.dataCaches) {
      globalCache.set(key, { state: "fulfilled", value });
    }
  }
  window.putCache = (k, v) => {
    globalCache.set(k, { state: "fulfilled", value: v });
  };
  delete window.dataCaches;
}

export const loadData = (id: string) => {
  const cache = useContext(Context);
  let cacheData = cache.get(id);

  if (!cacheData) {
    cache.set(
      id,
      (cacheData = {
        state: "pending",
        promise: new Promise((resolve) =>
          setTimeout(() => {
            const value = id.split("").reverse().join("") + Date.now(); //Appending Date.now() makes hydration mismatch if client refetched the data
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

  if (cacheData.state === "pending") {
    throw cacheData.promise;
  }

  return {
    value: cacheData.value,
    loadScript: (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.putCache ? window.putCache("${id}", "${cacheData.value}") : (window.dataCaches = [...(window.dataCaches ?? []), { key: "${id}", value: "${cacheData.value}" }])
          `,
        }}
      />
    ),
  };
};
