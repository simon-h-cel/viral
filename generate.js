export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, user } = req.body;
  if (!system || !user) return res.status(400).json({ error: 'Missing system or user' });

  const KEY = process.env.GROK_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'GROK_API_KEY not set in Vercel env' });

  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify({
        model: 'grok-3',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error.message || 'Grok error');
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    return res.status(200).json({ text });
  } catch(e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
