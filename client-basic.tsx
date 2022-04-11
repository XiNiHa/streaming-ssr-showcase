import React from "react";
import ReactDOMClient from "react-dom/client";
import BasicApp from "./routes/Basic";

declare global {
  interface Window {
    BOOT?: () => void
    LOADED?: boolean
  }
}

window.BOOT = function() {
  const root = document.getElementById("root");
  if (root) {
    ReactDOMClient.hydrateRoot(root, <div className="bg-red-200"><BasicApp /></div>);
  }
}

if (window.LOADED) window.BOOT()
