import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ data: {}, lastUpdated: 0 }));
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // Presence tracking
  const connectedUsers = new Map<string, { id: string, name: string, photo: string, role: string }>();

  wss.on("connection", (ws) => {
    let userId: string | null = null;

    console.log(`New connection. Total: ${wss.clients.size}`);
    
    // Broadcast function
    const broadcastPresence = () => {
      const users = Array.from(connectedUsers.values());
      const admins = users.filter(u => u.role === 'admin');
      const message = JSON.stringify({ 
        type: "presence", 
        count: wss.clients.size,
        users: users,
        admins: admins
      });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    };

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "identify") {
          userId = message.user.id || Math.random().toString(36).substr(2, 9);
          connectedUsers.set(ws.toString(), { ...message.user, id: userId });
          console.log(`User identified: ${message.user.name} (${message.user.role})`);
          broadcastPresence();
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    });

    ws.on("close", () => {
      connectedUsers.delete(ws.toString());
      console.log(`User disconnected. Total: ${wss.clients.size}`);
      broadcastPresence();
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now(), connectedUsers });
  });

  app.get("/api/last-updated", (req, res) => {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      if (!data) return res.json({ lastUpdated: 0 });
      const parsed = JSON.parse(data);
      res.json({ lastUpdated: parsed.lastUpdated || 0 });
    } catch (error) {
      console.error("Failed to read last updated:", error);
      res.json({ lastUpdated: 0 }); // Return 0 instead of 500 to keep the client working
    }
  });

  app.get("/api/data", (req, res) => {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      if (!data) return res.json({ data: {}, lastUpdated: 0 });
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Failed to read data:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/data", (req, res) => {
    try {
      const newData = req.body;
      console.log(`Saving data. Keys: ${Object.keys(newData).join(', ')}`);
      const payload = {
        data: newData,
        lastUpdated: Date.now()
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
      res.json({ success: true, lastUpdated: payload.lastUpdated });
    } catch (error) {
      console.error("Failed to save data:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
