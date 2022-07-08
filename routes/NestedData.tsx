import React, { Suspense, useState } from "react";
import Safari from "../components/Safari";
import { CacheProvider, loadData } from "../data/DataLayer";

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button
      className="px-10 py-2 bg-gray-100"
      onClick={() => setCount((i) => i + 1)}
    >
      {count}
    </button>
  );
};

const DataConsumer: React.FC<{
  id: string;
  children: (data: string) => JSX.Element;
}> = ({ id, children }) => {
  const { value, loadScript } = loadData(id);

  return (
    <>
      {loadScript}
      {children(value)}
    </>
  );
};

const NestedDataApp = () => {
  return (
    <>
      <Safari />
      <article className="flex w-[100vw]">
        <aside>
          <h1>This is a sidebar</h1>
          <p>
            Try clicking the counter even when the main content is still
            loading!
          </p>
          <Counter />
        </aside>
        <main className="p-4 flex-1">
          <CacheProvider>
            <Suspense fallback={"Loading..."}>
              <DataConsumer id="foobar">
                {(data) => (
                  <>
                    <p>
                      Data: {data}
                      <br />
                      Try clicking the counter even when the other Suspense is
                      still loading!
                      <br />
                      <Counter />
                    </p>
                    <Suspense fallback={"Nested Loading..."}>
                      <DataConsumer id="fizzbuzz">
                        {(data) => (
                          <>
                            <p>
                              Nested Data: {data}
                              <Counter />
                            </p>
                          </>
                        )}
                      </DataConsumer>
                    </Suspense>
                  </>
                )}
              </DataConsumer>
            </Suspense>
          </CacheProvider>
        </main>
      </article>
    </>
  );
};

export default NestedDataApp;
