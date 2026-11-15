const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://xgodxx999.github.io";

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";

  if (origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET" && req.url === "/api/ai/health") {
    return res.status(200).json({ ok: true, service: "XG Prime AI Gateway" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    return res.status(503).json({ error: "AI service is not configured" });
  }

  const input = req.body || {};
  if (!Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 30) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  const messages = input.messages.map(item => ({
    role: ["system", "user", "assistant"].includes(item && item.role) ? item.role : "user",
    content: typeof (item && item.content) === "string" ? item.content.slice(0, 8000) : ""
  })).filter(item => item.content);

  if (!messages.length || !messages.some(item => item.role === "user")) {
    return res.status(400).json({ error: "A user message is required" });
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        messages,
        stream: input.stream === true,
        temperature: Number.isFinite(Number(input.temperature))
          ? Math.min(1, Math.max(0, Number(input.temperature)))
          : 0.7,
        max_tokens: 1000
      })
    });

    if (!upstream.ok || !input.stream) {
      const body = await upstream.text();
      res.status(upstream.status);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(body);
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const reader = upstream.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise(resolve => res.once("drain", resolve));
      }
    }
    return res.end();
  } catch (error) {
    if (!res.headersSent) return res.status(502).json({ error: "AI upstream unavailable" });
    return res.end();
  }
};
