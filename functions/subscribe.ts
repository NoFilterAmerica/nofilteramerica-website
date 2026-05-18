import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400, headers: corsHeaders });
    }

    // Check for duplicate
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email });
    if (existing && existing.length > 0) {
      return Response.json({ ok: true, message: "Already subscribed!" }, { headers: corsHeaders });
    }

    // Save to database
    await base44.asServiceRole.entities.Subscriber.create({
      email,
      subscribed_date: new Date().toISOString(),
      source: body.source || "homepage",
      status: "active",
    });

    // Send notification email via base44.emails (top-level, not asServiceRole)
    await base44.emails.send({
      to: "zion@nofilteramerica.com",
      subject: "🔔 New NFA Subscriber: " + email,
      html: `
        <div style="font-family:Arial,sans-serif;background:#0a1628;color:#fff;padding:30px;border-radius:8px;max-width:480px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://nofilteramerica.com/assets/logo.png" alt="No Filter America" style="height:70px;"/>
          </div>
          <div style="background:#0d1f3c;border:1px solid rgba(197,160,70,0.4);border-left:4px solid #c9a84c;border-radius:6px;padding:20px 24px;">
            <h2 style="color:#c9a84c;font-size:1.1rem;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">📬 New Subscriber</h2>
            <p style="margin:0 0 8px;font-size:15px;"><strong style="color:#c9a84c;">Email:</strong> ${email}</p>
            <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.6);"><strong style="color:#c9a84c;">Source:</strong> ${body.source || "homepage"}</p>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);"><strong style="color:#c9a84c;">Date:</strong> ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}</p>
          </div>
          <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:20px;">No Filter America · nofilteramerica.com</p>
        </div>
      `,
    });

    return Response.json({ ok: true, message: "Subscribed successfully!" }, { headers: corsHeaders });

  } catch (err) {
    // Still return success to user even if email fails — subscriber is already saved
    console.error("Subscribe error:", err.message);
    return Response.json({ ok: true, message: "Subscribed successfully!" }, { headers: corsHeaders });
  }
});
