import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://doingnothing.lol",
  "https://www.doingnothing.lol",
  "http://localhost:3000",
  "http://localhost:4173",
]);

function response(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://doingnothing.lol",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
      "Vary": "Origin",
    },
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": origin ?? "https://doingnothing.lol", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" } });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return response({ error: "Origin not allowed." }, 403, origin);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return response({ error: "Status service is unavailable." }, 503, origin);
  let orderId: string;
  try {
    orderId = String((await request.json()).order_id ?? "");
  } catch {
    return response({ error: "Invalid request." }, 400, origin);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return response({ error: "Invalid order." }, 400, origin);
  }
  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await client.from("payment_orders").select("status").eq("id", orderId).maybeSingle();
  if (error) return response({ error: "Could not check payment status." }, 500, origin);
  if (!data) return response({ error: "Order not found." }, 404, origin);
  return response({ status: data.status }, 200, origin);
});
