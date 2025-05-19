/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const WebSocket = require("ws");

const wss = new WebSocket.Server({ server });

// Store clients by id
const clients = new Map();

app.use(express.json());

// Route for WebSocket upgrade (handled by ws)
app.get("/", (req, res) => {
  res.send("WebSocket server is running.");
});

// Route to send data to a specific client
app.post("/send", (req, res) => {
  const { clientId, payload } = req.body;
  const ws = clients.get(clientId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Client not connected" });
  }
});

wss.on("connection", function connection(ws) {
  console.log("Client connected");
  ws.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));

  ws.on("message", function incoming(message) {
    try {
      const data = JSON.parse(message);
      if (data.type === "identify" && data.clientId) {
        clients.set(data.clientId, ws);
        ws.clientId = data.clientId;
        console.log("Client identified:", data.clientId);
        return;
      }
    } catch (e) {
      // Not JSON or not identify
    }
    ws.send(
      JSON.stringify({
        message: `Server received: ${message}`,
      })
    );
  });

  ws.on("close", () => {
    if (ws.clientId) {
      clients.delete(ws.clientId);
    }
    console.log("Client disconnected");
  });
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`WebSocket/Express server running on http://localhost:${PORT}`);
});
