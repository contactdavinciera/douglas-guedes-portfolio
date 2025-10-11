/**
 * Stripe Payment Service
 * Handles checkout, subscriptions, and marketplace payments
 */

import { loadStripe } from '@stripe/stripe-js';

class PaymentService {
  constructor() {
    this.stripe = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Stripe
   */
  async initialize() {
    try {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      
      if (!publishableKey) {
        throw new Error('Stripe public key not found');
      }

      this.stripe = await loadStripe(publishableKey);
      this.isInitialized = true;
      
      console.log('✅ Stripe initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return false;
    }
  }

  /**
   * Calculate project price
   */
  calculatePrice(config) {
    const {
      duration, // minutes
      projectType, // sdr, hdr2020, dolby
      sourceFormat, // h264, prores, raw
      useColorGrading,
      useProfessionalHelp,
      deliveryFormat // proxy, high, hdr, dolby
    } = config;

    const BASE_PRICE = 10; // $10/min

    const projectMultipliers = {
      sdr: 1.0,
      hdr2020: 1.5,
      dolby: 2.5
    };

    const formatMultipliers = {
      h264: 1.0,
      prores: 1.3,
      raw: 2.0
    };

    const deliveryMultipliers = {
      proxy: 1.0,
      high: 1.3,
      hdr: 1.6,
      dolby: 2.0
    };

    let price = BASE_PRICE * duration;
    price *= projectMultipliers[projectType] || 1.0;
    price *= formatMultipliers[sourceFormat] || 1.0;
    
    if (useColorGrading) {
      price *= 1.5;
    }
    
    if (useProfessionalHelp) {
      price *= 2.0;
    }
    
    price *= deliveryMultipliers[deliveryFormat] || 1.0;

    return {
      subtotal: price,
      tax: price * 0.0, // Add tax logic
      total: price,
      breakdown: this.getBreakdown(config, price)
    };
  }

  /**
   * Get price breakdown
   */
  getBreakdown(config, total) {
    const items = [];
    let running = 10 * config.duration;

    items.push({
      label: `Base editing (${config.duration} min)`,
      amount: running
    });

    // Add multipliers...
    // (simplified for brevity)

    items.push({
      label: 'Total',
      amount: total,
      isTotal: true
    });

    return items;
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(projectConfig) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const pricing = this.calculatePrice(projectConfig);

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(pricing.total * 100), // cents
          currency: 'usd',
          projectConfig,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`
        })
      });

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return session;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for marketplace
   */
  async createPaymentIntent(amount, metadata) {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // cents
          currency: 'usd',
          metadata
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Payment intent error:', error);
      throw error;
    }
  }

  /**
   * Create subscription (Pro/Enterprise plans)
   */
  async createSubscription(priceId, customerId) {
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          customerId
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  /**
   * Create Stripe Connect account for professionals
   */
  async createConnectAccount(professionalData) {
    try {
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professionalData)
      });

      return await response.json();
    } catch (error) {
      console.error('Connect account error:', error);
      throw error;
    }
  }

  /**
   * Split payment (platform + professional)
   */
  async createSplitPayment(amount, professionalAccountId, platformFee = 0.10) {
    try {
      const platformAmount = Math.round(amount * platformFee * 100);
      const professionalAmount = Math.round(amount * (1 - platformFee) * 100);

      const response = await fetch('/api/stripe/create-split-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          platformFee: platformAmount,
          destinationAccount: professionalAccountId
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Split payment error:', error);
      throw error;
    }
  }

  /**
   * Request refund
   */
  async requestRefund(paymentIntentId, amount, reason) {
    try {
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(customerId, limit = 10) {
    try {
      const response = await fetch(`/api/stripe/payment-history?customerId=${customerId}&limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Payment history error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature (backend)
   */
  static verifyWebhook(payload, signature, secret) {
    // This runs on backend
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        secret
      );
      return event;
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return null;
    }
  }
}

/**
 * Subscription plans
 */
export const subscriptionPlans = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '1 project/month',
      'SDR only',
      'H.264 proxy',
      'Basic support'
    ],
    limits: {
      projects: 1,
      storage: 5, // GB
      duration: 10 // minutes
    }
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    features: [
      'Unlimited projects',
      'HDR & Dolby Vision',
      'All formats (RAW included)',
      'Priority support',
      'Cloud storage 100GB',
      'Collaboration features'
    ],
    limits: {
      projects: -1, // unlimited
      storage: 100,
      duration: -1
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    priceId: 'price_enterprise_monthly',
    features: [
      'Everything in Pro',
      'Team management',
      'Advanced analytics',
      'Custom branding',
      'Dedicated support',
      'Cloud storage 1TB',
      'API access'
    ],
    limits: {
      projects: -1,
      storage: 1000,
      duration: -1,
      teamMembers: 10
    }
  }
};

export default PaymentService;
