console.log("[HEALTH] API script starting...");
console.log("[HEALTH] MONGODB_URI exists:", !!process.env.MONGODB_URI);

import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initExcelService, getHospitals } from "./server/dbService.js";
import apiRouter from "./server/routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // DEBUG ENDPOINT
  app.get("/api/debug", (req, res) => {
    try {
      const hospitals = getHospitals();
      res.json({
        status: hospitals.length > 0 ? "database_loaded" : "database_empty",
        hospitalCount: hospitals.length,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        mongodb_uri_exists: !!process.env.MONGODB_URI,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Debug failed", message: err.message, stack: err.stack });
    }
  });

  // Initialize backend services
  try {
    console.log("[Server] Calling initExcelService...");
    await initExcelService();
    console.log("[Server] Backend services initialized successfully");
  } catch (error: any) {
    console.error("[Server] FATAL INITIALIZATION ERROR:", error.message);
  }

  app.use("/api", apiRouter);

  // Serve static files from dist if in production
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  return app;
}

let cachedApp: any = null;

export default async (req: any, res: any) => {
  console.log(`[Vercel] Incoming request: ${req.method} ${req.url}`);
  try {

    if (!cachedApp) {
      cachedApp = await startServer();
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error("[Vercel Handler Error]:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: err.stack 
    });
  }
};
