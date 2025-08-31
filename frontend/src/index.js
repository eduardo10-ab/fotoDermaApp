import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Aquí debe estar Tailwind importado
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
