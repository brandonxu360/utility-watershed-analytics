import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer, Zoom } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme, lightTheme } from "./utils/theme.ts";
import { ColorModeContext } from "./contexts/ColorModeContext.tsx";
import App from "./App.tsx";
import "./index.css";

// Create a Tanstack query client
const queryClient = new QueryClient();

/* eslint-disable react-refresh/only-export-components */
const Root = () => {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("color-mode");
      return stored === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          try {
            localStorage.setItem("color-mode", newMode);
          } catch {
            // ignore localStorage errors
          }
          return newMode;
        });
      },
      mode,
    }),
    [mode],
  );

  const theme = mode === "light" ? lightTheme : darkTheme;

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          pauseOnHover
          theme={mode}
          transition={Zoom}
        />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
