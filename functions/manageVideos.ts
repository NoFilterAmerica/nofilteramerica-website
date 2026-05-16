import base44 from "npm:@base44/sdk";

const client = base44({ appId: "6a0717be1b2d3fb43fda6201" });

export default async function handler(req: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (req.method === "GET" && action === "list") {
      const section = url.searchParams.get("section");
      const filter: Record<string,string> = {};
      if (section) filter.section = section;
      const videos = await client.asServiceRole.entities.Video.filter(filter);
      return new Response(JSON.stringify({ ok: true, videos }), { headers });
    }

    if (req.method === "POST" && action === "save") {
      const body = await req.json();
      const { section, slot, title, description, story_line, video_url, file_name } = body;
      const existing = await client.asServiceRole.entities.Video.filter({ section, slot });
      if (existing && existing.length > 0) {
        const updated = await client.asServiceRole.entities.Video.update(existing[0].id, {
          title, description, story_line, video_url, file_name,
          upload_date: new Date().toISOString()
        });
        return new Response(JSON.stringify({ ok: true, video: updated }), { headers });
      } else {
        const created = await client.asServiceRole.entities.Video.create({
          section, slot, title, description, story_line, video_url, file_name,
          upload_date: new Date().toISOString()
        });
        return new Response(JSON.stringify({ ok: true, video: created }), { headers });
      }
    }

    if (req.method === "DELETE" && action === "delete") {
      const body = await req.json();
      const { section, slot } = body;
      const existing = await client.asServiceRole.entities.Video.filter({ section, slot });
      if (existing && existing.length > 0) {
        await client.asServiceRole.entities.Video.delete(existing[0].id);
      }
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}
