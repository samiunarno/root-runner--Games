import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import authRouter from "./src/server/auth";
import usersRouter from "./src/server/users";
import settingsRouter from "./src/server/settings";
import { setupSocket } from "./src/server/game";

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Modular Routes
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/settings", settingsRouter);

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Setup Real-time Game Sockets
  setupSocket(io);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Modular Server running on http://localhost:${PORT}`);
  });
}

startServer();
