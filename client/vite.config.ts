import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    proxy: {
      // Proxy parquet file requests to wepp.cloud to avoid CORS issues
      "/weppcloud": {
        target: "https://wepp.cloud",
        changeOrigin: true,
      },
    },
  },
});
