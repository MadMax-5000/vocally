import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { handleMediaStream } from "./websocket/twilio-stream";

const dev = process.env.NODE_ENV !== "production";

process.env.NEXT_PRIVATE_STANDALONE = "true";

const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);
const WS_PATH = "/ws/media-streams";

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ server, path: WS_PATH });

  wss.on("connection", (ws, req) => {
    handleMediaStream(ws, req);
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Media Streams WS on ws://localhost:${PORT}${WS_PATH}`);
  });
});
