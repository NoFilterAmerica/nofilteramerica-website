// Netlify serverless function for NFA video management
// Uses Netlify Blobs for persistent storage

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    let store;
    try {
      const blobs = require('@netlify/blobs');
      store = blobs.getStore({ name: 'nfa-videos', consistency: 'strong' });
    } catch(e) {
      // Fallback: use environment variable if blobs not available
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Blobs not available: ' + e.message }) };
    }

    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const action = params.action;

    if (method === 'GET' && action === 'list') {
      const section = params.section || '';
      let data = {};
      try {
        const raw = await store.get('videos');
        if (raw) data = JSON.parse(raw);
      } catch(e) { data = {}; }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, data: section ? (data[section] || {}) : data }) };
    }

    if (method === 'POST' && (action === 'save' || action === 'delete')) {
      const body = JSON.parse(event.body || '{}');
      let data = {};
      try {
        const raw = await store.get('videos');
        if (raw) data = JSON.parse(raw);
      } catch(e) { data = {}; }

      if (action === 'save') {
        const { section, slot, title, description, story_line, video_url, file_name } = body;
        if (!data[section]) data[section] = {};
        data[section][String(slot)] = { title, description, story_line, video_url, file_name, upload_date: new Date().toISOString() };
      } else {
        const { section, slot } = body;
        if (data[section]) delete data[section][String(slot)];
      }

      await store.set('videos', JSON.stringify(data));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};
