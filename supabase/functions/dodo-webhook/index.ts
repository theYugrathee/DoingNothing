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
  const webhookId = request.headers.get("webhook-id") || request.headers.get("svix-id") || "";
  const webhookSignature = request.headers.get("webhook-signature") || request.headers.get("svix-signature") || "";
  const webhookTimestamp = request.headers.get("webhook-timestamp") || request.headers.get("svix-timestamp") || "";

  try {
    await new Webhook(secret).verify(rawBody, {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
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

  const eventType = String(event.type ?? "").toLowerCase();
  const isPaymentSuccess = eventType === "payment.succeeded" || eventType === "payment.successful" || eventType === "checkout.session.completed";

  // Handle Dodo test pings or non-payment events gracefully
  if (!isPaymentSuccess) {
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

  const patronUrl = order?.url || data.metadata?.url || data.metadata?.link || "";
  let patronLogo = order?.logo_url || data.metadata?.logo_url || data.metadata?.img || "";
  if (!patronLogo && patronUrl) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(patronUrl) ? patronUrl : `https://${patronUrl}`);
      patronLogo = `https://unavatar.io/${parsed.hostname}?fallback=https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;
    } catch {
      // ignore
    }
  }

  // 3. Insert confirmed patron into the public leaderboard table
  const rawAmt = typeof order?.amount === "number" ? order.amount : (Number(data.total_amount ?? data.amount ?? 0)) / 100;
  const paidEntry: Record<string, any> = {
    payment_id: paymentId,
    name: order?.name || data.metadata?.name || data.customer?.name || "Generous Supporter",
    url: patronUrl,
    logo_url: patronLogo,
    amount: Math.max(0, Math.round(rawAmt * 100) / 100),
    message: order?.message || data.metadata?.message || data.metadata?.desc || "Supporter contribution",
    category: "Supporter",
    is_today: true,
    is_approved: true,
    created_at: new Date().toISOString(),
  };

  if (order?.id) {
    paidEntry.id = order.id;
  }

  let { error: entryError } = await client.from("patrons").upsert(paidEntry, { onConflict: "payment_id" });
  if (entryError) {
    console.warn("Could not upsert on payment_id, trying insert:", entryError.message);
    const { error: insertError } = await client.from("patrons").insert(paidEntry);
    if (insertError) {
      console.error("Could not publish paid entry to patrons:", insertError.message);
      return new Response("Could not publish paid entry", { status: 500 });
    }
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
