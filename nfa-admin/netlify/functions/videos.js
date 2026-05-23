// NFA Video + Investigations Management — Netlify Serverless Function
// Uses GitHub repo file as persistent storage (no npm packages needed)
// Set GITHUB_TOKEN and GITHUB_REPO in Netlify environment variables

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'NoFilterAmerica/nofilteramerica-website';
const DATA_FILE_PATH = 'nfa-admin/videos-data.json';
const GITHUB_API = 'https://api.github.com';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFileFromGitHub() {
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${DATA_FILE_PATH}`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: json.sha };
}

async function saveFileToGitHub(data, sha) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${DATA_FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update NFA data',
      content,
      sha,
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed: ${res.status} - ${err}`);
  }
  return await res.json();
}

// Upload a binary file (image/PDF) to GitHub
async function uploadFileToGitHub(filePath, base64Content, mimeType) {
  // Check if file exists to get sha for update
  let sha = undefined;
  const checkRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filePath}`, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  const body = { message: `Upload NFA investigation file: ${filePath}`, content: base64Content };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub file upload failed: ${res.status} - ${err}`);
  }
  const result = await res.json();
  return result.content.download_url;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!GITHUB_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GITHUB_TOKEN not set in Netlify environment' }) };
  }

  try {
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const action = params.action;

    // ─── GET: list ───────────────────────────────────────────────
    if (method === 'GET' && action === 'list') {
      const { data } = await getFileFromGitHub();
      const section = params.section;
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ ok: true, data: section ? (data[section] || []) : data })
      };
    }

    // ─── GET: single investigation by id ─────────────────────────
    if (method === 'GET' && action === 'get') {
      const { data } = await getFileFromGitHub();
      const id = params.id;
      const inv = (data.investigations || []).find(i => i.id === id);
      if (!inv) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, data: inv }) };
    }

    // ─── POST: save a video slot ──────────────────────────────────
    if (method === 'POST' && action === 'save') {
      const body = JSON.parse(event.body || '{}');
      const { section, slot, title, description, story_line, video_url, thumbnail_url } = body;
      const { data, sha } = await getFileFromGitHub();

      if (!data[section]) data[section] = [];
      const idx = data[section].findIndex(v => v.slot === Number(slot));
      const record = { slot: Number(slot), title, description, story_line: story_line || '', video_url, thumbnail_url: thumbnail_url || '', updated: new Date().toISOString() };
      if (idx >= 0) {
        data[section][idx] = record;
      } else {
        data[section].push(record);
        data[section].sort((a, b) => a.slot - b.slot);
      }

      await saveFileToGitHub(data, sha);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, record }) };
    }

    // ─── POST: save investigation ─────────────────────────────────
    if (method === 'POST' && action === 'save_investigation') {
      const body = JSON.parse(event.body || '{}');
      const { data, sha } = await getFileFromGitHub();
      if (!data.investigations) data.investigations = [];

      const now = new Date().toISOString();
      const inv = body;

      if (inv.id) {
        // Update existing
        const idx = data.investigations.findIndex(i => i.id === inv.id);
        if (idx >= 0) {
          data.investigations[idx] = { ...data.investigations[idx], ...inv, updated: now };
        } else {
          data.investigations.push({ ...inv, created: now, updated: now });
        }
      } else {
        // Create new
        inv.id = 'inv_' + Date.now();
        inv.created = now;
        inv.updated = now;
        data.investigations.push(inv);
      }

      // Sort: published first, then by updated desc
      data.investigations.sort((a, b) => {
        if (a.status === 'archived' && b.status !== 'archived') return 1;
        if (b.status === 'archived' && a.status !== 'archived') return -1;
        return new Date(b.updated) - new Date(a.updated);
      });

      await saveFileToGitHub(data, sha);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: inv.id, data: inv }) };
    }

    // ─── POST: delete investigation ───────────────────────────────
    if (method === 'POST' && action === 'delete_investigation') {
      const body = JSON.parse(event.body || '{}');
      const { id } = body;
      const { data, sha } = await getFileFromGitHub();
      if (data.investigations) {
        data.investigations = data.investigations.filter(i => i.id !== id);
      }
      await saveFileToGitHub(data, sha);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // ─── POST: upload file (image or document) ────────────────────
    if (method === 'POST' && action === 'upload_file') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch(e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body: ' + e.message }) };
      }
      const { filename, base64, mime_type } = body;
      if (!filename || !base64) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'filename and base64 required' }) };
      }
      // Check base64 size — GitHub API limit is 100MB but Netlify fn body is ~6MB
      const approxBytes = base64.length * 0.75;
      if (approxBytes > 5 * 1024 * 1024) {
        return { statusCode: 413, headers, body: JSON.stringify({ error: 'File too large (max 5MB). Please compress the PDF and try again.' }) };
      }
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `nfa-admin/investigation-files/${Date.now()}_${safeName}`;
      try {
        const url = await uploadFileToGitHub(filePath, base64, mime_type || 'application/octet-stream');
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, url }) };
      } catch(uploadErr) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'GitHub upload failed: ' + uploadErr.message }) };
      }
    }

    // ─── POST: delete a video slot ────────────────────────────────
    if (method === 'POST' && action === 'delete') {
      const body = JSON.parse(event.body || '{}');
      const { section, slot } = body;
      const { data, sha } = await getFileFromGitHub();

      if (data[section]) {
        const idx = data[section].findIndex(v => v.slot === Number(slot));
        if (idx >= 0) {
          data[section][idx] = { slot: Number(slot), title: '', description: '', story_line: '', video_url: '', thumbnail_url: '' };
        }
      }

      await saveFileToGitHub(data, sha);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
