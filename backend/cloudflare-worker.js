const corsHeaders = origin => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
});

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://xgodxx999.github.io";
    if (origin && origin !== allowedOrigin) {
      return json({ error: "Origin not allowed" }, 403);
    }
    const cors = corsHeaders(allowedOrigin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "XG AI Gateway" }, 200, cors);
    }
    if (url.pathname !== "/api/ai" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, cors);
    }
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
      return json({ error: "AI service is not configured" }, 503, cors);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > 64000) return json({ error: "Request too large" }, 413, cors);

    let input;
    try {
      const raw = await request.text();
      if (raw.length > 64000) return json({ error: "Request too large" }, 413, cors);
      input = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    if (!Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 40) {
      return json({ error: "Invalid messages" }, 400, cors);
    }
    const messages = input.messages.map(item => ({
      role: ["system", "user", "assistant"].includes(item?.role) ? item.role : "user",
      content: typeof item?.content === "string" ? item.content.slice(0, 12000) : ""
    })).filter(item => item.content);

    if (!messages.length || !messages.some(item => item.role === "user")) {
      return json({ error: "A user message is required" }, 400, cors);
    }

    const payload = {
      model: env.OPENAI_MODEL,
      messages,
      stream: input.stream === true,
      temperature: Number.isFinite(Number(input.temperature))
        ? Math.min(1, Math.max(0, Number(input.temperature)))
        : 0.7,
      max_tokens: 1200
    };

    try {
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const headers = new Headers(cors);
      headers.set("Cache-Control", "no-store");
      if (payload.stream && upstream.ok) {
        headers.set("Content-Type", "text/event-stream; charset=utf-8");
        headers.set("X-Accel-Buffering", "no");
        return new Response(upstream.body, { status: upstream.status, headers });
      }

      const text = await upstream.text();
      headers.set("Content-Type", "application/json; charset=utf-8");
      return new Response(text, { status: upstream.status, headers });
    } catch {
      return json({ error: "Upstream AI service unavailable" }, 502, cors);
    }
  }
};
