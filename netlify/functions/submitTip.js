// NFA Tip Submission Handler
// Receives tip form data and emails it to news@nofilteramerica.com via Netlify's email integration

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch(e) {
      // Handle URL-encoded form data
      const params = new URLSearchParams(event.body);
      body = Object.fromEntries(params.entries());
    }

    const {
      tipName = 'Anonymous',
      tipEmail = 'Not provided',
      tipCategory = 'Not specified',
      tipMessage = '',
      tipEvidence = 'None provided'
    } = body;

    if (!tipMessage || tipMessage.trim() === '') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Tip message is required' }) };
    }

    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'nofilteramerica.com';

    if (!MAILGUN_API_KEY) {
      // Fallback: log it (Netlify will capture in function logs)
      console.log('TIP RECEIVED:', JSON.stringify(body, null, 2));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Tip received' }) };
    }

    const emailBody = [
      '🚨 NEW TIP SUBMITTED — NO FILTER AMERICA',
      '='.repeat(50),
      '',
      `Submitted:  ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST`,
      `Name:       ${tipName}`,
      `Email:      ${tipEmail}`,
      `Category:   ${tipCategory.toUpperCase()}`,
      '',
      'TIP:',
      '-'.repeat(40),
      tipMessage,
      '',
      'EVIDENCE / SOURCES:',
      '-'.repeat(40),
      tipEvidence,
      '',
      '='.repeat(50),
      'Sent via nofilteramerica.com contact form',
    ].join('\n');

    const formData = new URLSearchParams();
    formData.append('from', 'NFA Tips <tips@nofilteramerica.com>');
    formData.append('to', 'news@nofilteramerica.com');
    formData.append('subject', `🚨 New Tip [${tipCategory.toUpperCase()}] — No Filter America`);
    formData.append('text', emailBody);

    const mgRes = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
      },
      body: formData,
    });

    if (!mgRes.ok) {
      const err = await mgRes.text();
      console.error('Mailgun error:', err);
      // Still return success to user — we don't want to leak email issues
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Tip submitted successfully' }) };

  } catch (err) {
    console.error('submitTip error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
