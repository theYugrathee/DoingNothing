import { PaymentPayload, PaymentResult, LeaderboardEntry } from '../types';
import { StorageService } from './storage';

/**
 * Pluggable Payment Service Interface & Gateway Driver
 * Ready for live Stripe, Razorpay, or LemonSqueezy integration.
 */
export class PaymentService {
  /**
   * Process a contribution payload.
   * If a live payUrl is configured in AppConfig, redirects to the checkout provider.
   * Otherwise, processes as an instant preview transaction.
   */
  public static async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const config = StorageService.getConfig();

    // 1. Live Payment Gateway Redirect (e.g. Stripe Payment Link)
    if (config.payUrl && config.payUrl.trim().length > 0) {
      try {
        const liveUrl = new URL(config.payUrl);
        // Append client reference params
        liveUrl.searchParams.set('client_reference_id', `donor_${Date.now()}`);
        liveUrl.searchParams.set('prefilled_amount', String(payload.amount));
        return {
          success: true,
          redirectUrl: liveUrl.toString()
        };
      } catch (err) {
        console.warn('Invalid live payment URL:', err);
      }
    }

    // 2. Client-side / Preview Mode Simulation
    // When backend API endpoints (/api/checkout) are wired up, replace this block with fetch('/api/checkout')
    await new Promise((resolve) => setTimeout(resolve, 350));

    const newEntry: LeaderboardEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: payload.anon ? 'Anonymous Hero' : payload.name,
      url: payload.anon ? '' : (payload.url || ''),
      amt: Math.round(payload.amount * 100) / 100,
      desc: payload.desc || 'Fueling the non-productive revolution.',
      img: payload.anon ? '' : (payload.img || ''),
      anon: payload.anon,
      t: Date.now(),
      src: 'preview',
      gateway: payload.gateway,
      currency: payload.currency || 'USD'
    };

    StorageService.addEntry(newEntry);

    return {
      success: true,
      transactionId: `tx_${Date.now()}`,
      entry: newEntry
    };
  }
}
