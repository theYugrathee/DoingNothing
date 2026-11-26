import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://doingnothing.lol",
  "https://www.doingnothing.lol",
  "http://localhost:3000",
  "http://localhost:4173",
]);

function corsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://doingnothing.lol";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed." }, 403, origin);

  const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
  const defaultProductId = Deno.env.get("DODO_PRODUCT_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!dodoApiKey || !supabaseUrl || !serviceKey) {
    return json({ error: "Dodo checkout is not fully configured on the server." }, 503, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400, origin);
  }
  const amount = Number(body.amount);
  const realProductId = "pdt_0NsYNxU9GTMZ5B1Obh5rm";
  const targetProductId = defaultProductId || realProductId;
  if (!targetProductId) {
    return json({ error: "Product ID is missing on the server." }, 503, origin);
  }
  const name = String(body.name ?? "").trim().slice(0, 60);
  const url = String(body.url ?? "").trim().slice(0, 140);
  const message = String(body.desc ?? "").trim().slice(0, 5000);
  const anonymous = body.anon === true;
  const logoUrl = String(body.img ?? "").trim().slice(0, 500);
  if (body.consent !== true) return json({ error: "Consent is required." }, 400, origin);
  if (!Number.isFinite(amount) || amount < 1 || amount > 3000) {
    return json({ error: "Amount must be between $1 and $3,000 per contribution." }, 400, origin);
  }
  if (!anonymous && !name) return json({ error: "Name is required." }, 400, origin);
  if (url && !url.startsWith("@")) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      if (!parsed.hostname.includes(".")) throw new Error("invalid host");
    } catch {
      return json({ error: "The link is invalid." }, 400, origin);
    }
  }

  const orderId = crypto.randomUUID();
  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const order = {
    id: orderId,
    name: anonymous ? "Anonymous legend" : name,
    url: anonymous ? "" : url,
    amount: Math.round(amount * 100) / 100,
    message,
    logo_url: anonymous ? "" : logoUrl,
    is_anonymous: anonymous,
    status: "pending",
  };
  const { error: insertError } = await client.from("payment_orders").insert(order);
  if (insertError) {
    console.error("Could not stage Dodo order:", insertError.message);
    return json({ error: "Could not prepare this payment. Please try again." }, 500, origin);
  }

  const cartItem: Record<string, unknown> = {
    product_id: targetProductId,
    quantity: 1,
    amount: Math.round(amount * 100),
  };

  const environment = Deno.env.get("DODO_ENVIRONMENT") === "test_mode" ? "test" : "live";
  const dodoResponse = await fetch(`https://${environment}.dodopayments.com/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${dodoApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_cart: [cartItem],
      billing_currency: "USD",
      return_url: `${origin || "https://doingnothing.lol"}/?checkout=return&order_id=${orderId}`,
      metadata: { order_id: orderId },
    }),
  });
  const dodoBody = await dodoResponse.json().catch(() => ({}));
  if (!dodoResponse.ok || typeof dodoBody.checkout_url !== "string") {
    await client.from("payment_orders").delete().eq("id", orderId);
    console.error("Dodo checkout creation failed:", dodoResponse.status, dodoBody);
    return json({ error: "Dodo could not create the checkout. Please try again." }, 502, origin);
  }

  await client.from("payment_orders").update({ dodo_session_id: dodoBody.session_id ?? null }).eq("id", orderId);
  return json({ checkout_url: dodoBody.checkout_url }, 200, origin);
});
