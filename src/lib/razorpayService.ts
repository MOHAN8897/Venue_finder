import { getKeyId, getKeySecret, razorpayConfig, validateConfig, logConfigStatus } from './razorpay-config';
import { razorpayBackend } from './razorpayBackend';

// Types for Razorpay
interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  email: string;
  contact: string;
  name: string;
}

interface CreateOrderParams {
  amount: number; // Amount in paise (₹100 = 10000)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

// Initialize Razorpay configuration
const initializeRazorpay = () => {
  // Log configuration status for debugging
  logConfigStatus();
  
  // Validate configuration
  if (!validateConfig()) {
    throw new Error('Razorpay configuration is invalid. Please check your environment variables.');
  }
};

// Calculate platform fee (Fixed ₹35 per booking)
export const calculatePlatformFee = (venueAmount: number): number => {
  // Fixed ₹35 platform fee (3500 paise)
  return 3500;
};

// Calculate total amount (venue amount + platform fee)
export const calculateTotalAmount = (venueAmount: number): number => {
  const platformFee = calculatePlatformFee(venueAmount);
  return venueAmount + platformFee;
};

// Utility to validate and log Razorpay order payload
export const validateAndLogOrderPayload = (params: CreateOrderParams) => {
  if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0 || !Number.isInteger(params.amount)) {
    console.error('Razorpay order creation error: Amount must be a positive integer in paise. Got:', params.amount);
    throw new Error('Payment error: Amount must be a positive integer in paise.');
  }
  if (!params.currency) {
    console.error('Razorpay order creation error: Currency is missing.');
    throw new Error('Payment error: Currency is required.');
  }
  if (!params.receipt) {
    console.error('Razorpay order creation error: Receipt is missing.');
    throw new Error('Payment error: Receipt is required.');
  }
  // Log the payload for debugging
  console.log('Creating Razorpay order with payload:', params);
};

// Create Razorpay order using Edge Function
export const createRazorpayOrder = async (params: CreateOrderParams): Promise<RazorpayOrder> => {
  try {
    // Initialize and validate configuration
    initializeRazorpay();
    // Validate input parameters
    validateAndLogOrderPayload({
      ...params,
      currency: params.currency || razorpayConfig.currency,
      receipt: params.receipt || `receipt_${Date.now()}`
    });
    // Call the Edge Function endpoint
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`;
    console.log('Calling edge function URL:', url);
    console.log('Request payload:', {
      amount: params.amount,
      currency: params.currency || razorpayConfig.currency,
      receipt: params.receipt || `receipt_${Date.now()}`,
      notes: params.notes
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || razorpayConfig.currency,
      receipt: params.receipt || `receipt_${Date.now()}`,
      notes: params.notes
      }),
    });
    console.log('Edge function response status:', response.status);
    const data = await response.json();
    console.log('Edge function response data:', data);
    
    if (!response.ok || !data.success) {
      console.error('Edge function error:', data);
      throw new Error(data.error || 'Failed to create payment order');
    }
    const order = data.order;
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
};

// Initialize Razorpay payment
export const initializeRazorpayPayment = (
  order: RazorpayOrder,
  userDetails: {
    name: string;
    email: string;
    contact: string;
  },
  onSuccess: (payment: any) => void,
  onFailure: (error: any) => void,
  onDismiss: () => void
): void => {
  try {
    // Initialize and validate configuration
    initializeRazorpay();
    
    // Validate order
    if (!order || !order.id || !order.amount) {
      throw new Error('Invalid order data');
    }
    
    // Validate user details
    if (!userDetails.name || !userDetails.email) {
      throw new Error('Invalid user details');
    }
    
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        createPaymentModal(order, userDetails, onSuccess, onFailure, onDismiss);
      };
      script.onerror = () => {
        onFailure(new Error('Failed to load Razorpay script'));
      };
      document.head.appendChild(script);
    } else {
      createPaymentModal(order, userDetails, onSuccess, onFailure, onDismiss);
    }
  } catch (error) {
    console.error('Error initializing Razorpay payment:', error);
    onFailure(error);
  }
};

// Create payment modal
const createPaymentModal = (
  order: RazorpayOrder,
  userDetails: {
    name: string;
    email: string;
    contact: string;
  },
  onSuccess: (payment: any) => void,
  onFailure: (error: any) => void,
  onDismiss: () => void
): void => {
  try {
    const keyId = getKeyId();
    if (!keyId) {
      throw new Error('Razorpay key ID not configured');
    }
    
    const options: PaymentOptions = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Venue Finder',
      description: 'Venue Booking Payment',
      order_id: order.id,
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.contact
      },
      notes: {
        booking_type: 'venue_booking',
        platform: 'venue_finder',
        user_email: userDetails.email
      },
      theme: {
        color: '#3B82F6'
      },
      handler: (response: any) => {
        console.log('Payment successful:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
          onDismiss();
        }
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error creating payment modal:', error);
    onFailure(error);
  }
};

// Verify payment signature using backend service
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    return razorpayBackend.verifyPaymentSignature(orderId, paymentId, signature);
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

// Get payment status
export const getPaymentStatus = async (paymentId: string): Promise<any> => {
  try {
    // Initialize and validate configuration
    initializeRazorpay();
    
    // In a real application, this would be an API call to your backend
    // which would then call Razorpay's API
    const response = await fetch(`/api/payments/${paymentId}/status`);
    return await response.json();
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw new Error('Failed to get payment status');
  }
};

// Refund payment
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<any> => {
  try {
    // Initialize and validate configuration
    initializeRazorpay();
    
    // In a real application, this would be an API call to your backend
    const response = await fetch(`/api/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        reason: reason || 'Customer request'
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw new Error('Failed to refund payment');
  }
};

// Test payment function
export const testPayment = async (): Promise<void> => {
  try {
    // Initialize and validate configuration
    initializeRazorpay();
    
    const testOrder = await createRazorpayOrder({
      amount: 10000, // ₹100
      currency: razorpayConfig.currency,
      receipt: 'test_receipt'
    });

    initializeRazorpayPayment(
      testOrder,
      {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9999999999'
      },
      (payment) => {
        console.log('Test payment successful:', payment);
        alert('Test payment successful!');
      },
      (error) => {
        console.error('Test payment failed:', error);
        alert('Test payment failed!');
      },
      () => {
        console.log('Test payment cancelled');
        alert('Test payment cancelled');
      }
    );
  } catch (error) {
    console.error('Error in test payment:', error);
    alert('Error in test payment');
  }
};

// Export validation functions
export { validateConfig, logConfigStatus } from './razorpay-config';

// Export for global use
declare global {
  interface Window {
    Razorpay: any;
  }
} 