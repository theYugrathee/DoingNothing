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
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://doingnothing.lol",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
      },
    });
  }
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
  const { data: order, error } = await client.from("payment_orders").select("*").eq("id", orderId).maybeSingle();
  if (error) return response({ error: "Could not check payment status." }, 500, origin);
  if (!order) return response({ error: "Order not found." }, 404, origin);

  // If already marked as paid, return immediately
  if (order.status === "paid") {
    return response({ status: "paid" }, 200, origin);
  }

  // Active Verification Fallback:
  // If the webhook hasn't arrived or was delayed, directly query Dodo Payments API
  const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
  const environment = Deno.env.get("DODO_ENVIRONMENT") === "test_mode" ? "test" : "live";

  if (dodoApiKey) {
    try {
      const dodoRes = await fetch(`https://${environment}.dodopayments.com/payments?limit=50`, {
        headers: { Authorization: `Bearer ${dodoApiKey}` },
      });
      if (dodoRes.ok) {
        const payload = await dodoRes.json().catch(() => ({}));
        const payments: any[] = payload.items || payload.data || payload.payments || [];
        const matchingPayment = payments.find((p: any) => {
          const matchMeta = p.metadata?.order_id === orderId;
          const matchSession = order.dodo_session_id && (p.session_id === order.dodo_session_id || p.checkout_session_id === order.dodo_session_id);
          const isSuccess = p.status === "succeeded" || p.status === "successful" || p.status === "paid" || p.status === "completed";
          return (matchMeta || matchSession) && isSuccess;
        });

        if (matchingPayment) {
          const paymentId = String(matchingPayment.payment_id || matchingPayment.id || `dodo_${orderId}`).trim();
          const paidEntry = {
            id: order.id,
            payment_id: paymentId,
            name: order.name,
            url: order.url,
            logo_url: order.logo_url,
            amount: typeof order.amount === "number" ? order.amount : 0,
            message: order.message,
            category: "Supporter",
            is_today: true,
            is_approved: true,
            created_at: new Date().toISOString(),
          };

          // 1. Publish to patrons (triggers Supabase Realtime for all visitors instantly)
          await client.from("patrons").upsert(paidEntry, { onConflict: "payment_id" });

          // 2. Mark order as paid
          await client.from("payment_orders").update({
            status: "paid",
            payment_id: paymentId,
            paid_at: new Date().toISOString(),
          }).eq("id", orderId);

          console.log(`Directly fulfilled order ${orderId} via Dodo Payments API verification.`);
          return response({ status: "paid" }, 200, origin);
        }
      }
    } catch (apiErr) {
      console.warn("Direct Dodo API payment lookup exception:", apiErr);
    }
  }

  return response({ status: order.status }, 200, origin);
});
