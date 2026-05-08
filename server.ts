import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
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

  // DEBUG ENDPOINT - Visit this at /api/debug to troubleshoot environment issues
  app.get("/api/debug", (req, res) => {
    const hospitals = getHospitals();
    res.json({
      status: hospitals.length > 0 ? "database_loaded" : "database_empty",
      hospitalCount: hospitals.length,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      cwd: process.cwd(),
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      rootContent: fs.readdirSync(process.cwd())
    });
  });


  // Initialize backend services (load Excel data)
  try {
    await initExcelService();
    console.log("[Server] Backend services initialized successfully");
  } catch (error: any) {
    console.error("[Server] Critical Initialization Error:", error.message);
    // On Vercel, we don't want to crash the whole worker immediately,
    // so we can see the logs. API calls will fail gracefully later.
  }

  // Mounting API routes
  app.use("/api", apiRouter);

  // Vite / Static serving logic
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  return app;
}

// Singleton app instance for Vercel/Serverless
const appPromise = startServer();

// Vercel Serverless Function Wrapper
export default async (req: any, res: any) => {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("[Vercel Handler Error]:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};

// For Local Development (running directly via tsx/node)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  appPromise.then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Local] Server running on http://localhost:${PORT}`);
    });
  });
}
