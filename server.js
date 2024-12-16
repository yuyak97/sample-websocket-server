const https = require("https");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

// Read SSL certificates
const server = https.createServer({
  cert: fs.readFileSync("./server.crt"),
  key: fs.readFileSync("./server.key"),
});

// Initialize WebSocket Server
const wss = new WebSocket.Server({ server });

// Message Handlers
const messageHandlers = {
  /**
   * Repeats a message to the client multiple times with an interval.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {string} payload - The message payload to repeat.
   */
  repeat: (ws, payload) => {
    let count = 0;
    const intervalId = setInterval(() => {
      if (count < 10) {
        console.log(`Sending message ${count + 1}: ${payload}`);
        ws.send(`Message ${count + 1}: ${payload}`);
        count++;
      } else {
        clearInterval(intervalId);
      }
    }, 1000);
  },

  /**
   * Sends a sample image from the server's filesystem to the client.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {string} imageName - The name of the image file to send.
   */
  getSampleImage: (ws, imageName) => {
    const imagePath = path.join(__dirname, imageName);

    fs.readFile(imagePath, (err, data) => {
      if (err) {
        console.error("Failed to read image:", err);
        ws.send("Error: Image not found");
        return;
      }

      console.log("Sending image:", imageName);
      ws.send(data);
    });
  },

  /**
   * Default handler for any unspecified topics.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {string} payload - The message payload.
   */
  default: (ws, payload) => {
    console.log(`Default handler invoked with payload: ${payload}`);
    ws.send(`Received: ${payload}`);
  },
};

// WebSocket connection setup
wss.on("connection", (ws, request) => {
  console.log("Client connected");

  // Check the headers of the incoming request
  const headers = request.headers;
  console.log("Received headers:", headers);

  // Set up a regular status message
  const statusIntervalId = setInterval(() => {
    const statusMessage = JSON.stringify({ topic: "status", payload: "Server is running" });
    console.log("Sending status message");
    ws.send(statusMessage);
  }, 5000); // Send every 5 seconds

  ws.on("message", (message) => {
    console.log("Received message:", message.toString());

    try {
      const parsedMessage = JSON.parse(message.toString());
      const topic = parsedMessage.topic || "default";
      const handler = messageHandlers[topic] || messageHandlers.default;
      handler(ws, parsedMessage.payload);
    } catch (error) {
      console.log("Binary data received or failed to parse JSON");
      messageHandlers.upload(ws, message);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(statusIntervalId); // Clear the interval when the client disconnects
  });
});

// Start the HTTPS server with WebSocket
const PORT = 8443;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on wss://localhost:${PORT}`);
});
