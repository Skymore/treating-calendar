import {HeroUIProvider, ToastProvider} from "@heroui/react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";

import App from "./App.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <HeroUIProvider>
      <ToastProvider />
      <AuthProvider>
        <main className="text-foreground bg-background">
          <App />
        </main>
      </AuthProvider>
    </HeroUIProvider>
  // </React.StrictMode>,
);
