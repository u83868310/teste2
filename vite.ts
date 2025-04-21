import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "vite";
import { resolve } from "path";

export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createServer({
    server: { middlewareMode: true },
    plugins: [
      {
        name: "vite-plugin-dev-server-restart-on-save",
        handleHotUpdate: () => {
          setTimeout(() => {
            log("restarting dev server on save...", "vite");
            process.exit(0);
          }, 100);
          return [];
        },
      },
    ],
    root: "./",
    resolve: {
      alias: {
        "@": resolve("./"),
        "@shared": resolve("./"),
        "@assets": resolve("./assets"),
      },
    },
  });

  app.use(vite.middlewares);

  return vite;
}

export function serveStatic(app: Express) {
  const express = require("express");
  app.use(express.static("dist/public"));
  app.get("*", (_req, res) => {
    res.sendFile(resolve("dist/public/index.html"));
  });
}
