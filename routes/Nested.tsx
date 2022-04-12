import React, { Suspense, useState } from "react";
import Delayed, { DelayedProvider } from "../components/Delayed";

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

const NestedApp = () => {
  return (
    <article className="flex w-[100vw]">
      <aside>
        <h1>This is a sidebar</h1>
        <p>
          Try clicking the counter even when the main content is still loading!
        </p>
        <Counter />
      </aside>
      <main className="p-4 flex-1">
        <Suspense fallback={"Loading..."}>
          <DelayedProvider>
            <Delayed ms={3000}>
              <p>
                3000ms delayed content
                <br />
                Try clicking the counter even when the other Suspense is still
                loading!
                <br />
                <Counter />
              </p>
              <Suspense fallback={"Nested Loading..."}>
                <Delayed ms={1500}>
                  <p>
                    3000ms + 1500ms delayed content
                    <Counter />
                  </p>
                </Delayed>
              </Suspense>
            </Delayed>
          </DelayedProvider>
        </Suspense>
      </main>
    </article>
  );
};

export default NestedApp;
