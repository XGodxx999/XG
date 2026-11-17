'use strict';

const http = require('node:http');

const PORT = Number(process.env.PORT || 10000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://xgodxx999.github.io';
const API_KEY = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
const MODEL = (process.env.AI_MODEL || 'gemini-3.5-flash-lite').trim();
const BASE_URL = (process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
const DAILY_LIMIT = Math.max(1, Number.parseInt(process.env.AI_DAILY_LIMIT || '20', 10) || 20);
const MAX_BODY_BYTES = 48_000;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 6_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

let daily = { date: new Date().toISOString().slice(0, 10), count: 0 };
const clients = new Map();

function json(res, status, data, headers = {}) {
  if (res.headersSent) return res.end();
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Vary': 'Origin',
    ...headers
  });
  res.end(JSON.stringify(data));
}

function consumeDailyLimit() {
  const today = new Date().toISOString().slice(0, 10);
  if (daily.date !== today) daily = { date: today, count: 0 };
  if (daily.count >= DAILY_LIMIT) return false;
  daily.count += 1;
  return true;
}

function isRateLimited(ip) {
  const now = Date.now();
  let item = clients.get(ip);
  if (!item || now - item.start >= RATE_WINDOW_MS) {
    item = { start: now, count: 0 };
    clients.set(ip, item);
  }
  item.count += 1;
  if (clients.size > 4000) {
    for (const [key, value] of clients) {
      if (now - value.start >= RATE_WINDOW_MS) clients.delete(key);
    }
  }
  return item.count > RATE_LIMIT;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Invalid JSON');
    error.status = 400;
    throw error;
  }
}

function normalizeMessages(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_MESSAGES) {
    throw Object.assign(new Error('Invalid messages'), { status: 400 });
  }
  const messages = input.map(item => ({
    role: ['system', 'user', 'assistant'].includes(item?.role) ? item.role : 'user',
    content: typeof item?.content === 'string' ? item.content.slice(0, MAX_MESSAGE_CHARS).trim() : ''
  })).filter(item => item.content);

  if (!messages.some(item => item.role === 'user')) {
    throw Object.assign(new Error('A user message is required'), { status: 400 });
  }
  return messages;
}

function toGeminiContents(messages) {
  const contents = [];
  for (const item of messages.filter(message => message.role !== 'system')) {
    const role = item.role === 'assistant' ? 'model' : 'user';
    const previous = contents[contents.length - 1];
    if (previous?.role === role) previous.parts[0].text += '\n\n' + item.content;
    else contents.push({ role, parts: [{ text: item.content }] });
  }
  while (contents[0]?.role === 'model') contents.shift();
  return contents;
}

function sendSse(res, payload) {
  return res.write('data: ' + JSON.stringify(payload) + '\n\n');
}

async function handleGemini(req, res, input, messages) {
  const systemText = messages.filter(item => item.role === 'system').map(item => item.content).join('\n\n');
  const contents = toGeminiContents(messages);
  if (!contents.length) return json(res, 400, { error: 'A user message is required' });

  const streaming = input.stream === true;
  const endpoint = BASE_URL + '/models/' + encodeURIComponent(MODEL) + ':' +
    (streaming ? 'streamGenerateContent?alt=sse' : 'generateContent');
  const temperature = Number(input.temperature);
  const body = {
    contents,
    generationConfig: {
      temperature: Number.isFinite(temperature) ? Math.min(1, Math.max(0, temperature)) : 0.7,
      maxOutputTokens: 1200
    }
  };
  if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: { 'x-goog-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000)
  });

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 2500);
    return json(res, upstream.status, { error: 'Gemini API: ' + detail });
  }

  if (!streaming) {
    const data = await upstream.json();
    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map(part => typeof part.text === 'string' ? part.text : '').join('');
    if (!answer) return json(res, 502, { error: 'Gemini returned no text content' });
    return json(res, 200, {
      choices: [{ message: { role: 'assistant', content: answer }, finish_reason: 'stop' }]
    });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Vary': 'Origin'
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let clientClosed = false;
  res.on('close', () => { clientClosed = true; reader.cancel().catch(() => {}); });

  function emitEvent(event) {
    const line = event.split(/\r?\n/).find(value => value.startsWith('data:'));
    if (!line) return;
    const raw = line.slice(5).trim();
    if (!raw || raw === '[DONE]') return;
    try {
      const packet = JSON.parse(raw);
      const text = (packet.candidates?.[0]?.content?.parts || [])
        .map(part => typeof part.text === 'string' ? part.text : '').join('');
      if (text) sendSse(res, { choices: [{ index: 0, delta: { content: text } }] });
    } catch { /* Ignore malformed provider event; continue reading the stream. */ }
  }

  while (!clientClosed) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || '';
    for (const event of events) emitEvent(event);
  }
  buffer += decoder.decode();
  if (buffer.trim()) emitEvent(buffer);
  if (!clientClosed) {
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (origin && origin !== ALLOWED_ORIGIN) return json(res, 403, { error: 'Origin not allowed' });

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Vary': 'Origin' });
    return res.end();
  }

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
    return json(res, 200, {
      ok: true,
      service: 'XG Prime AI Gateway',
      provider: 'gemini',
      model: MODEL,
      configured: Boolean(API_KEY && MODEL)
    });
  }

  if (req.method === 'GET' && (pathname === '/diagnostics' || pathname === '/diagnostics-v2')) {
    if (!API_KEY) return json(res, 200, { configured: false, provider: 'gemini', message: 'AI_API_KEY is missing' });
    try {
      const response = await fetch(BASE_URL + '/models?pageSize=1', {
        headers: { 'x-goog-api-key': API_KEY },
        signal: AbortSignal.timeout(15_000)
      });
      return json(res, 200, {
        configured: true,
        provider: 'gemini',
        tokenSource: process.env.AI_API_KEY ? 'AI_API_KEY' : 'GEMINI_API_KEY',
        keyLength: API_KEY.length,
        tokenValid: response.ok,
        tokenStatus: response.status,
        model: MODEL,
        modelConfigured: Boolean(MODEL),
        note: response.ok ? 'Gemini accepted the server-side API key. Continue with a model inference test.' : 'Gemini rejected the server-side API key.'
      });
    } catch (error) {
      return json(res, 200, {
        configured: true,
        provider: 'gemini',
        diagnosticError: error?.name === 'TimeoutError' ? 'Provider identity check timed out' : 'Could not reach provider identity service'
      });
    }
  }

  if (req.method !== 'POST' || pathname !== '/api/ai') {
    return json(res, 404, { error: 'Not found' });
  }
  if (!API_KEY || !MODEL) return json(res, 503, { error: 'AI service is not configured' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) return json(res, 429, { error: 'Too many requests. Please wait one minute.' });

  let input, messages;
  try {
    input = await readJson(req);
    messages = normalizeMessages(input.messages);
  } catch (error) {
    return json(res, error.status || 400, { error: error.message || 'Invalid request' });
  }

  if (!consumeDailyLimit()) return json(res, 429, { error: 'XG daily AI limit reached. Please try again tomorrow.' });

  try {
    await handleGemini(req, res, input, messages);
  } catch (error) {
    if (!res.headersSent) {
      const timeout = error?.name === 'TimeoutError';
      json(res, timeout ? 504 : 502, { error: timeout ? 'AI provider timed out' : 'AI provider unavailable' });
    } else {
      res.end();
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('XG Prime Gemini gateway listening on port ' + PORT);
});
