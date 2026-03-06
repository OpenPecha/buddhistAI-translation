import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const target_url = env.VITE_SERVER_URL || "http://localhost:9000";
  const agent_url = env.VITE_AGENT_URL;
  const pecha_api_url = env.VITE_PECHA_API_URL;
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      exclude: ["react-icons"],
    },
    server: {
      port: 3000,
      allowedHosts: true,
      proxy: {
        "/agent": {
          target: agent_url,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/agent/, ""),
        },
        "/api": {
          target: target_url,
          changeOrigin: true,
          secure: false,
        },
        "/projects": {
          target: target_url,
          changeOrigin: true,
          secure: false,
        },
        "/users": {
          target: target_url,
          changeOrigin: true,
          secure: false,
        },
        "/comments": {
          target: target_url,
          changeOrigin: true,
          secure: false,
        },
        "/versions": {
          target: target_url,
          changeOrigin: true,
          secure: false,
        },
        "/pecha": {
          target: pecha_api_url,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/pecha/, ""),
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
