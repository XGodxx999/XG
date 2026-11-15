const http = require("node:http");

const PORT = Number(process.env.PORT || 10000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://xgodxx999.github.io";
const AI_PROVIDER = (process.env.AI_PROVIDER || "huggingface").toLowerCase();
const AI_BASE_URL = (process.env.AI_BASE_URL || "https://router.huggingface.co/v1/chat/completions").replace(/\/+$/, "");
const AI_API_KEY_SOURCE = process.env.AI_API_KEY ? "AI_API_KEY" : process.env.OPENROUTER_API_KEY ? "OPENROUTER_API_KEY" : process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : "none";
const AI_API_KEY = (process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "").trim();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === "huggingface" ? "swiss-ai/Apertus-70B-Instruct-2509:publicai" : "");
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_BODY_BYTES = 48_000;
const MAX_DAILY_REQUESTS = Math.max(1, Number(process.env.AI_DAILY_LIMIT || 20));
let dailyCounter = { day: new Date().toISOString().slice(0, 10), count: 0 };
const requests = new Map();

function send(res, status, body, extraHeaders = {}) {
  if (res.headersSent) return res.end();
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Vary": "Origin",
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
}

function dailyLimited() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCounter.day !== today) dailyCounter = { day: today, count: 0 };
  if (dailyCounter.count >= MAX_DAILY_REQUESTS) return true;
  dailyCounter.count += 1;
  return false;
}

function rateLimited(ip) {
  const now = Date.now();
  let entry = requests.get(ip);
  if (!entry || now - entry.start >= WINDOW_MS) {
    entry = { start: now, count: 0 };
    requests.set(ip, entry);
  }
  entry.count += 1;
  if (requests.size > 5000) {
    for (const [key, value] of requests) if (now - value.start >= WINDOW_MS) requests.delete(key);
  }
  return entry.count > MAX_REQUESTS;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Request too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch {
    const error = new Error("Invalid JSON");
    error.status = 400;
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (origin && origin !== ALLOWED_ORIGIN) return send(res, 403, { error: "Origin not allowed" });

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": ALLOWED_ORIGIN, "Vary": "Origin" });
    return res.end();
  }
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  if (req.method === "GET" && (pathname === "/" || pathname === "/health")) {
    return send(res, 200, {
      ok: true,
      service: "XG Prime AI Gateway",
      provider: AI_PROVIDER,
      configured: Boolean(AI_API_KEY && AI_MODEL)
    });
  }
  if (req.method === "GET" && pathname === "/diagnostics") {
    if (!AI_API_KEY) return send(res, 200, { configured: false, message: "AI_API_KEY is missing" });
    try {
      const identity = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: { Authorization: "Bearer " + AI_API_KEY },
        signal: AbortSignal.timeout(15000)
      });
      return send(res, 200, {
        configured: true,
        tokenSource: AI_API_KEY_SOURCE,
        tokenLength: AI_API_KEY.length,
        tokenPrefixValid: AI_API_KEY.startsWith("hf_"),
        tokenValid: identity.ok,
        tokenStatus: identity.status,
        modelConfigured: Boolean(AI_MODEL),
        note: identity.ok
          ? "Hugging Face accepted the token. Continue with a model inference test."
          : "Hugging Face rejected the credential selected from Render environment variables. Check tokenSource and replace that variable with the complete active hf_ token."
      });
    } catch (error) {
      return send(res, 200, {
        configured: true,
        diagnosticError: error && error.name === "TimeoutError" ? "Hugging Face identity check timed out" : "Could not reach Hugging Face identity service"
      });
    }
  }
  if (req.method !== "POST" || pathname !== "/api/ai") {
    return send(res, 404, { error: "Not found" });
  }
  if (!AI_API_KEY || !AI_MODEL) {
    return send(res, 503, { error: "AI service is not configured. Add AI_API_KEY and AI_MODEL in Render Environment." });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: "Too many requests. Please wait one minute." });

  let input;
  try { input = await readJson(req); }
  catch (error) { return send(res, error.status || 400, { error: error.message || "Invalid request" }); }

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

  if (dailyLimited()) return send(res, 429, { error: "XG daily AI limit reached. Please try again tomorrow." });

  try {
    const headers = {
      Authorization: "Bearer " + AI_API_KEY,
      "Content-Type": "application/json"
    };
    if (AI_PROVIDER === "openrouter") {
      headers["HTTP-Referer"] = process.env.AI_SITE_URL || "https://xgodxx999.github.io/XG/";
      headers["X-OpenRouter-Title"] = "XG Prime";
    }
    const upstream = await fetch(AI_BASE_URL, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        stream: input.stream === true,
        temperature: Number.isFinite(Number(input.temperature)) ? Math.min(1, Math.max(0, Number(input.temperature))) : 0.7,
        max_tokens: 1000
      })
    });

    if (!upstream.ok || input.stream !== true) {
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Vary": "Origin"
      });
      return res.end(body);
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
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
    if (!res.headersSent) {
      const timedOut = error && error.name === "TimeoutError";
      send(res, timedOut ? 504 : 502, { error: timedOut ? "AI provider timed out" : "AI provider unavailable" });
    } else {
      res.end();
    }
  }
});

server.listen(PORT, "0.0.0.0", () => console.log("XG AI Gateway listening on " + PORT));
