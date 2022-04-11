import React from "react";
import ReactDOMClient from "react-dom/client";
import BasicDataApp from "./routes/BasicData";

declare global {
  interface Window {
    BOOT?: () => void
    LOADED?: boolean
  }
}

window.BOOT = function() {
  const root = document.getElementById("root");
  if (root) {
    ReactDOMClient.hydrateRoot(root, <div className="bg-red-200"><BasicDataApp /></div>);
  }
}

if (window.LOADED) window.BOOT()
