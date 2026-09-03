import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";
import "./components/loaders/Loaders.css";
import "./desktop.css";
import "./features/confessions/confessions.css";
import "./features/chats/chats.css";
import "./features/search/search.css";
import "./features/profile/profile.css";
import "./features/auth/auth.css";
import "./theme-typography.css";
import { ErrorProvider } from "./context/ErrorContext.jsx";

const queryClient = new QueryClient();

// Suppress benign browser media AbortError caused by rapid navigation or pause interrupting play()
if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
        const err = event && event.reason;
        if (err && (err.name === "AbortError" || String(err.message || "").includes("play() request was interrupted"))) {
            event.preventDefault();
        }
    });
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ErrorProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ErrorProvider>
    </React.StrictMode>
);
