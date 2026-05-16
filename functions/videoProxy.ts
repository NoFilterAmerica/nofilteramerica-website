import { base44 } from "../.base44/sdk.ts";

export default async function handler(req: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // Use service role to bypass auth — this runs server-side
    const db = base44.asServiceRole.entities.Video;

    if (req.method === "GET" && action === "list") {
      const section = url.searchParams.get("section") || "";
      const records = section
        ? await db.filter({ section })
        : await db.list();
      return new Response(JSON.stringify({ ok: true, records }), { headers });
    }

    if (req.method === "POST" && action === "save") {
      const body = await req.json();
      const { section, slot, title, description, story_line, video_url, file_name } = body;

      // Check if record exists for this section+slot
      const existing = await db.filter({ section, slot: Number(slot) });

      let record;
      if (existing && existing.length > 0) {
        record = await db.update(existing[0].id, {
          title, description, story_line: story_line || "", video_url, file_name,
          upload_date: new Date().toISOString()
        });
      } else {
        record = await db.create({
          section, slot: Number(slot), title, description,
          story_line: story_line || "", video_url, file_name,
          upload_date: new Date().toISOString()
        });
      }
      return new Response(JSON.stringify({ ok: true, record }), { headers });
    }

    if (req.method === "POST" && action === "delete") {
      const body = await req.json();
      const { section, slot } = body;
      const existing = await db.filter({ section, slot: Number(slot) });
      if (existing && existing.length > 0) {
        await db.delete(existing[0].id);
      }
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
