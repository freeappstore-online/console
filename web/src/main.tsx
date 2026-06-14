import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Restore font size preference
const savedSize = localStorage.getItem("fas_text_size");
if (savedSize === "large") document.documentElement.style.fontSize = "18px";
else if (savedSize === "small") document.documentElement.style.fontSize = "14px";

const root = document.getElementById("root")!;
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
