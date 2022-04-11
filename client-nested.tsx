import React from "react";
import ReactDOMClient from "react-dom/client";
import NestedApp from "./routes/Nested";

declare global {
  interface Window {
    BOOT?: () => void
    LOADED?: boolean
  }
}

window.BOOT = function() {
  const root = document.getElementById("root");
  if (root) {
    ReactDOMClient.hydrateRoot(root, <div className="bg-red-200"><NestedApp /></div>);
  }
}

if (window.LOADED) window.BOOT()
