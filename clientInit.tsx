/**
 * Client initialization script
 */

import ReactDOMClient from "react-dom/client";

declare global {
  interface Window {
    BOOT?: () => void;
    LOADED?: boolean;
  }
}

// Common init fuction that accepts a function that returns a React element
export default function init(el: () => JSX.Element) {
  // Declare the BOOT function
  window.BOOT = function () {
    const root = document.getElementById("root");
    if (root) {
      ReactDOMClient.hydrateRoot(root, el());
    }
  };

  // If the LOADED flag is set (DOM already streamed), then call BOOT function right away
  if (window.LOADED) window.BOOT();
}
