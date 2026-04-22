// Vercel serverless proxy for Anthropic API calls.
// Pattern matches Ray. All browser-side AI calls in Quill must route here.
// Requires env var ANTHROPIC_API_KEY set in Vercel project settings.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
    return;
  }

  try {
    var body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || !body.messages) {
      res.status(400).json({ error: 'Missing messages in request body' });
      return;
    }

    var payload = {
      model: body.model || 'claude-sonnet-4-5',
      max_tokens: body.max_tokens || 1200,
      messages: body.messages
    };
    if (body.system) payload.system = body.system;
    if (body.temperature !== undefined) payload.temperature = body.temperature;

    var r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    var data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
