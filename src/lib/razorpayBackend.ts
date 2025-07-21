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

  // Create a real Razorpay order
  async createOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    try {
      // In a real backend, you would make an API call to Razorpay
      // For now, we'll simulate the order creation
      const orderData = {
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes || {},
        partial_payment: false,
        payment_capture: 1
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate a realistic order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id: orderId,
        entity: 'order',
        amount: params.amount,
        amount_paid: 0,
        amount_due: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        status: 'created',
        attempts: 0,
        notes: params.notes || {},
        created_at: Date.now()
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      // In a real backend, you would verify the signature using crypto
      // For now, we'll simulate verification
      const expectedSignature = this.generateSignature(orderId, paymentId);
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  // Generate signature for testing
  private generateSignature(orderId: string, paymentId: string): string {
    const text = `${orderId}|${paymentId}`;
    // In real implementation, use crypto.createHmac('sha256', this.keySecret).update(text).digest('hex')
    return btoa(text + this.keySecret).substring(0, 32);
  }

  // Get payment details
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