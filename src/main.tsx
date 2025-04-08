import {HeroUIProvider, ToastProvider} from "@heroui/react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <HeroUIProvider>
      <ToastProvider />
      <main className="text-foreground bg-background">
        <App />
      </main>
    </HeroUIProvider>
  // </React.StrictMode>,
);
