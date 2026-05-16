// NFA Image Upload — Netlify Serverless Function
// Receives a base64-encoded image, stores it in GitHub repo under nfa-admin/thumbs/
// Returns the raw GitHub CDN URL for use as thumbnail

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'NoFilterAmerica/nofilteramerica-website';
const GITHUB_API = 'https://api.github.com';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!GITHUB_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GITHUB_TOKEN not set' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { filename, data } = body; // data = base64 string (no prefix)

    if (!filename || !data) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing filename or data' }) };
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `nfa-admin/thumbs/${timestamp}_${safeName}`;

    // Check if file already exists (need SHA to overwrite)
    let sha = undefined;
    const checkRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }

    // Upload to GitHub
    const uploadBody = {
      message: `Upload thumbnail: ${safeName}`,
      content: data,
    };
    if (sha) uploadBody.sha = sha;

    const uploadRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadBody)
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`GitHub upload failed: ${uploadRes.status} - ${err}`);
    }

    const result = await uploadRes.json();
    const rawUrl = result.content.download_url;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, url: rawUrl })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
