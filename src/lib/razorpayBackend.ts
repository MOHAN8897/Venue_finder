import { getKeySecret, razorpayConfig } from './razorpay-config';

// Backend Razorpay integration
export class RazorpayBackend {
  private static instance: RazorpayBackend;
  private keySecret: string;

  private constructor() {
    this.keySecret = getKeySecret();
  }

  public static getInstance(): RazorpayBackend {
    if (!RazorpayBackend.instance) {
      RazorpayBackend.instance = new RazorpayBackend();
    }
    return RazorpayBackend.instance;
  }

  // Create a real Razorpay order using the deployed Edge Function
  async createOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    try {
      // Call the Edge Function endpoint
      const response = await fetch('/functions/v1/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }
      return data.order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment signature (placeholder for backend verification)
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    // In production, this should call a backend/Edge Function for secure verification
    // For now, return true as a placeholder
    return true;
  }

  // Get payment details (unchanged)
  async getPaymentDetails(paymentId: string) {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        id: paymentId,
        entity: 'payment',
        amount: 3520,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_test',
        method: 'card',
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: 'Venue Booking Payment',
        card_id: null,
        bank: null,
        wallet: null,
        vpa: null,
        email: 'test@example.com',
        contact: '+919999999999',
        notes: {},
        fee: 0,
        tax: 0,
        error_code: null,
        error_description: null,
        created_at: Date.now()
      };
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw new Error('Failed to get payment details');
    }
  }
}

// Export singleton instance
export const razorpayBackend = RazorpayBackend.getInstance(); 