export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { 
    try { body = JSON.parse(body); } catch(e) { return res.status(400).json({ error: 'Invalid JSON body' }); }
  }

  const system = body && body.system;
  const user = body && body.user;
  if (!system || !user) return res.status(400).json({ error: 'Missing system or user' });

  const KEY = process.env.GROK_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'GROK_API_KEY not configured in Vercel env' });

  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + KEY
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        max_tokens: 1500,
        temperature: 0.9,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user   }
        ]
      })
    });

    const raw = await r.text();

    let data;
    try { data = JSON.parse(raw); }
    catch(e) { return res.status(500).json({ error: 'Grok returned invalid JSON: ' + raw.substring(0,200) }); }

    if (data.error) return res.status(500).json({ error: data.error.message || JSON.stringify(data.error) });
    if (!data.choices || !data.choices[0]) return res.status(500).json({ error: 'No choices in Grok response' });

    const text = data.choices[0].message.content || '';
    return res.status(200).json({ text });

  } catch(e) {
    return res.status(500).json({ error: 'Fetch failed: ' + (e.message || String(e)) });
  }
}
