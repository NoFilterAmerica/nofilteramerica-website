// NFA Video Management — Netlify Serverless Function
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
      message: 'Update NFA video data',
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

    // GET: list videos
    if (method === 'GET' && action === 'list') {
      const { data } = await getFileFromGitHub();
      const section = params.section;
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ ok: true, data: section ? (data[section] || []) : data })
      };
    }

    // POST: save a slot
    if (method === 'POST' && action === 'save') {
      const body = JSON.parse(event.body || '{}');
      const { section, slot, title, description, story_line, video_url, thumbnail_url } = body;
      const { data, sha } = await getFileFromGitHub();

      if (!data[section]) data[section] = [];
      // Find existing slot or add new
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

    // POST: delete a slot
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
