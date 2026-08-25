import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const indexCss = document.createElement("link");
indexCss.rel = "stylesheet";
indexCss.href = new URL("./index.css", import.meta.url).href;
document.head.appendChild(indexCss);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
