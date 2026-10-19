export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Missing GEMINI_API_KEY environment variable on Vercel.' });
  }

  try {
    const { contents, systemInstruction, generationConfig } = req.body;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({ contents, systemInstruction, generationConfig })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini upstream error' });
    }

    return res.status(200).json({ ok: true, source: 'gemini', data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal serverless error processing AI request.' });
  }
}