import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtime from "@replit/vite-plugin-runtime-error-modal";
import cartographer from "@replit/vite-plugin-cartographer";
import shadowTheme from "@replit/vite-plugin-shadcn-theme-json";
import { join, resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    runtime(),
    cartographer({
      rootpath: resolve("./"),
    }),
    shadowTheme({ themeFilePath: resolve("./theme.json") }),
  ],
  resolve: {
    alias: {
      "@": resolve("./"),
      "@shared": resolve("./"),
      "@assets": resolve("./assets"),
    },
  },
  build: {
    outDir: "dist/public",
  },
  root: "./",
});
