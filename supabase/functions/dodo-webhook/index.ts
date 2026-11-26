import { createClient } from "npm:@supabase/supabase-js@2";
import { Webhook } from "npm:standardwebhooks@1.0.0";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("DODO_PAYMENTS_WEBHOOK_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceKey) {
    console.error("Missing webhook environment variables (DODO_PAYMENTS_WEBHOOK_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY).");
    return new Response("Webhook is not configured on the server", { status: 503 });
  }

  const rawBody = await request.text();
  try {
    await new Webhook(secret).verify(rawBody, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    });
  } catch (err) {
    console.warn("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  // Handle Dodo test pings or non-payment events gracefully
  if (event.type !== "payment.succeeded") {
    console.log(`Received event type: ${event.type} — acknowledging with 200 OK.`);
    return new Response("ok", { status: 200 });
  }

  const data = event.data ?? {};
  const paymentId = String(data.payment_id ?? data.id ?? "").trim();
  const orderId = String(data.metadata?.order_id ?? "").trim();

  if (!paymentId) {
    console.warn("Payment succeeded event received without payment_id. Acknowledging.");
    return new Response("ok (no payment_id)", { status: 200 });
  }

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // 1. Check idempotency: if this payment was already added to patrons, don't duplicate
  const { data: alreadyListed } = await client
    .from("patrons")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (alreadyListed) {
    console.log(`Payment ${paymentId} already processed. Skipping duplicate insert.`);
    if (orderId) {
      await client.from("payment_orders").update({ status: "paid", payment_id: paymentId, paid_at: new Date().toISOString() }).eq("id", orderId);
    }
    return new Response("ok (already processed)", { status: 200 });
  }

  // 2. Look up the staged order
  let order: any = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    const { data: orderData } = await client
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    order = orderData;
  }

  // 3. Insert confirmed patron into the public leaderboard table
  const paidEntry = {
    payment_id: paymentId,
    name: order?.name || data.customer?.name || "Generous Supporter",
    url: order?.url || "",
    logo_url: order?.logo_url || "",
    amount: order?.amount || Math.max(1, (Number(data.total_amount ?? data.amount ?? 100)) / 100),
    message: order?.message || "Supporter contribution",
    category: "Supporter",
    is_today: true,
    is_approved: true,
    created_at: new Date().toISOString(),
  };

  if (order?.id) {
    (paidEntry as any).id = order.id;
  }

  const { error: entryError } = await client.from("patrons").upsert(paidEntry, { onConflict: "payment_id" });
  if (entryError) {
    console.error("Could not publish paid entry to patrons:", entryError.message);
    return new Response("Could not publish paid entry", { status: 500 });
  }

  console.log(`Successfully listed patron: ${paidEntry.name} ($${paidEntry.amount}) for payment ${paymentId}`);

  // 4. Update the order status if it was staged
  if (orderId) {
    await client.from("payment_orders").update({
      status: "paid",
      payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }).eq("id", orderId);
  }

  return new Response("ok", { status: 200 });
});
