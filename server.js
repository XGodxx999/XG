const http = require("node:http");

const PORT = Number(process.env.PORT || 10000);
const ORIGIN = process.env.ALLOWED_ORIGIN || "https://xgodxx999.github.io";
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const requests = new Map();

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": ORIGIN,
    "Vary": "Origin",
    ...headers
  });
  res.end(JSON.stringify(body));
}

function rateLimited(ip) {
  const now = Date.now();
  const entry = requests.get(ip) || { start: now, count: 0 };
  if (now - entry.start > WINDOW_MS) {
    entry.start = now;
    entry.count = 0;
  }
  entry.count++;
  requests.set(ip, entry);
  return entry.count > MAX_REQUESTS;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (origin && origin !== ORIGIN) return send(res, 403, { error: "Origin not allowed" });
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin" });
    return res.end();
  }
  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true, service: "XG Prime AI Gateway" });
  }
  if (req.method !== "POST" || req.url !== "/api/ai") {
    return send(res, 404, { error: "Not found" });
  }
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    return send(res, 503, { error: "AI service is not configured" });
  }

  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: "Too many requests. Please wait one minute." });

  let raw = "";
  req.on("data", chunk => {
    raw += chunk;
    if (raw.length > 48_000) {
      send(res, 413, { error: "Request too large" });
      req.destroy();
    }
  });
  req.on("end", async () => {
    let input;
    try { input = JSON.parse(raw || "{}"); }
    catch { return send(res, 400, { error: "Invalid JSON" }); }

    if (!Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 24) {
      return send(res, 400, { error: "Invalid messages" });
    }
    const messages = input.messages.map(item => ({
      role: ["system", "user", "assistant"].includes(item && item.role) ? item.role : "user",
      content: typeof (item && item.content) === "string" ? item.content.slice(0, 6000) : ""
    })).filter(item => item.content);
    if (!messages.length || !messages.some(item => item.role === "user")) {
      return send(res, 400, { error: "A user message is required" });
    }

    try {
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL,
          messages,
          stream: input.stream === true,
          temperature: Number.isFinite(Number(input.temperature)) ? Math.min(1, Math.max(0, Number(input.temperature))) : 0.7,
          max_tokens: 1000
        })
      });

      if (!upstream.ok || input.stream !== true) {
        const body = await upstream.text();
        res.writeHead(upstream.status, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": ORIGIN,
          "Vary": "Origin"
        });
        return res.end(body);
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": ORIGIN,
        "Vary": "Origin"
      });
      const reader = upstream.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!res.write(Buffer.from(value))) await new Promise(resolve => res.once("drain", resolve));
      }
      res.end();
    } catch (error) {
      if (!res.headersSent) send(res, 502, { error: "AI upstream unavailable" });
      else res.end();
    }
  });
});

server.listen(PORT, "0.0.0.0", () => console.log("XG AI Gateway listening on " + PORT));
