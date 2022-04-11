import React, {
  createContext,
  ReactNode,
  useContext,
  useId,
  useRef
} from "react";

const Context = createContext<Map<string, Promise<true> | true>>(null as any);

export const DelayedProvider: React.FC<{ children: ReactNode }> = ({
  children
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

  if (cacheData !== true && typeof window == 'undefined') {
    throw cacheData;
  }

  return <>{children}</>;
};

export default Delayed;
