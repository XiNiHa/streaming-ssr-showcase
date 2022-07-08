import React, { Suspense, useState } from "react";
import Safari from "../components/Safari";
import { CacheProvider, DataState, loadData } from "../data/DataLayer";

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
  const { value } = loadData(id);

  return <>{children(value)}</>;
};

const NonStreamedNestedDataApp: React.FC<{ cache: Map<string, DataState> }> = ({
  cache,
}) => {
  return (
    <>
      <Safari />
      <article className="flex w-[100vw]">
        <aside>
          <h1>This is a sidebar</h1>
          <Counter />
        </aside>
        <main className="p-4 flex-1">
          <CacheProvider cache={cache}>
            <Suspense fallback={"Loading..."}>
              <DataConsumer id="foobar">
                {(data) => (
                  <>
                    <p>
                      Watch the numeric part of the following data changing
                      after hydration...
                      <br />
                      (It's because the data cache is not streamed in this
                      example, but passed at the end of the body)
                    </p>
                    <p>
                      Data: {data}
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

export default NonStreamedNestedDataApp;
