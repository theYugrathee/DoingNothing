import { createClient } from "npm:@supabase/supabase-js@2";
import { Webhook } from "npm:standardwebhooks@1.0.0";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("DODO_PAYMENTS_WEBHOOK_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceKey) return new Response("Webhook is not configured", { status: 503 });

  const rawBody = await request.text();
  try {
    await new Webhook(secret).verify(rawBody, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  if (event.type !== "payment.succeeded") return new Response("ok", { status: 200 });

  const data = event.data ?? {};
  const paymentId = String(data.payment_id ?? data.id ?? "").trim();
  const orderId = String(data.metadata?.order_id ?? "").trim();
  if (!paymentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    console.error("Dodo success event is missing payment/order identifiers.");
    return new Response("Missing order metadata", { status: 400 });
  }

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: order, error: orderError } = await client
    .from("payment_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) {
    console.error("Could not load Dodo order:", orderError.message);
    return new Response("Temporary order lookup failure", { status: 500 });
  }
  if (!order) return new Response("Order not found", { status: 404 });

  const { data: alreadyListed, error: lookupError } = await client
    .from("patrons")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (lookupError) {
    console.error("Could not check payment idempotency:", lookupError.message);
    return new Response("Temporary payment lookup failure", { status: 500 });
  }
  if (alreadyListed) {
    await client.from("payment_orders").update({ status: "paid", payment_id: paymentId, paid_at: new Date().toISOString() }).eq("id", orderId);
    return new Response("ok", { status: 200 });
  }

  const paidEntry = {
    id: order.id,
    payment_id: paymentId,
    name: order.name,
    url: order.url,
    logo_url: order.logo_url,
    amount: order.amount,
    message: order.message,
    category: "Supporter",
    is_today: true,
    is_approved: true,
    created_at: new Date().toISOString(),
  };
  const { error: entryError } = await client.from("patrons").upsert(paidEntry, { onConflict: "id" });
  if (entryError) {
    console.error("Could not publish paid entry:", entryError.message);
    return new Response("Could not publish paid entry", { status: 500 });
  }
  const { error: orderUpdateError } = await client.from("payment_orders").update({
    status: "paid",
    payment_id: paymentId,
    paid_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (orderUpdateError) {
    console.error("Could not mark Dodo order paid:", orderUpdateError.message);
    return new Response("Could not finalize paid order", { status: 500 });
  }
  return new Response("ok", { status: 200 });
});
