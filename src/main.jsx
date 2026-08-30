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

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ErrorProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ErrorProvider>
    </React.StrictMode>
);
