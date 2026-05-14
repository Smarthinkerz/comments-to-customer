import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve orbital.html and its assets directly
  const publicDir = path.resolve(import.meta.dirname, "..", "client", "public");
  
  app.get("/orbital.html", (_req, res) => {
    const filePath = path.join(publicDir, "orbital.html");
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("Not found");
    }
  });

  // Serve orbital CSS/JS assets
  const orbitalAssets = [
    "orbital.css", "orbital-interactive.js", "orbital-mobile.css",
    "orbital_floating_icons.css", "orbital_social_fix.css",
    "orbital_video_modal.css", "orbital_OVERRIDE.css", "orbital_FINAL_COMPLETE.css"
  ];
  for (const asset of orbitalAssets) {
    app.get(`/${asset}`, (_req, res) => {
      const filePath = path.join(publicDir, asset);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send("Not found");
      }
    });
  }

  return httpServer;
}
