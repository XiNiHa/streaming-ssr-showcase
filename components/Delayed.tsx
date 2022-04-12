/**
 * Simple component that delays render of the children
 */

import React, {
  createContext,
  ReactNode,
  useContext,
  useId,
  useRef,
} from "react";

// Context for remembering that the rendering already got delayed before.
const Context = createContext<Map<string, Promise<true> | true>>(null as any);

export const DelayedProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const map = useRef(new Map());

  return <Context.Provider value={map.current}>{children}</Context.Provider>;
};

const Delayed: React.FC<{
  ms: number;
  children: ReactNode;
}> = ({ ms, children }) => {
  const map = useContext(Context);
  const id = useId();

  let cacheData = map.get(id);
  // If it's first render, create a promise and put it in the cache
  if (!cacheData) {
    map.set(
      id,
      (cacheData = new Promise((resolve) => {
        setTimeout(() => {
          map.set(id, true);
          resolve(true);
        }, ms);
      }))
    );
  }

  // If the delay is not yet finished, throw the promise
  if (cacheData !== true && typeof window == "undefined") {
    throw cacheData;
  }

  // If it's already delayed, just return the children
  return <>{children}</>;
};

export default Delayed;
