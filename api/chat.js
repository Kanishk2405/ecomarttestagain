export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, errorCode: "METHOD_NOT_ALLOWED", message: "Use POST /api/chat" });
  
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GeminiAPIKey || "").trim();
  if (!apiKey) return res.status(503).json({ ok: false, errorCode: "MISSING_API_KEY", message: "GEMINI_API_KEY is not set in Vercel Environment Variables." });
  
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  
  // Updated to gemini-3.5-flash-lite as requested by Google API
  const model = body.model || "gemini-3.5-flash-lite";
  
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
  
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: body.contents, systemInstruction: body.systemInstruction, generationConfig: body.generationConfig })
  });
  
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(r.status).json({ ok: false, errorCode: "UPSTREAM_" + r.status, message: data?.error?.message || ("Gemini HTTP " + r.status) });
  
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || "";
  return res.status(200).json({ ok: true, source: "gemini", model, text, candidates: data.candidates });
}
