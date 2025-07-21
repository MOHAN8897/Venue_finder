// Razorpay Configuration Example
// Copy this file to razorpay-config.js and fill in your actual API keys

export const razorpayConfig = {
  // Test Mode (Development) - Replace with your actual test keys
  test: {
    keyId: 'rzp_test_YOUR_TEST_KEY_ID',
    keySecret: 'YOUR_TEST_KEY_SECRET',
    environment: 'test'
  },
  
  // Live Mode (Production) - Replace with your actual live keys
  live: {
    keyId: 'rzp_live_YOUR_LIVE_KEY_ID',
    keySecret: 'YOUR_LIVE_KEY_SECRET',
    environment: 'live'
  },
  
  // Current environment (change to 'live' for production)
  current: 'test',
  
  // Currency
  currency: 'INR',
  
  // Platform fee settings
  platformFee: {
    percentage: 0.134, // 13.4%
    minimumAmount: 4500, // ₹45 in paise
    maximumAmount: 50000 // ₹500 in paise
  },
  
  // Webhook settings
  webhook: {
    secret: 'YOUR_WEBHOOK_SECRET'
  },
  
  // Payment methods to enable
  paymentMethods: {
    card: true,
    netbanking: true,
    upi: true,
    wallet: true,
    emi: false
  }
};

// Instructions:
// 1. Copy this file to razorpay-config.js
// 2. Replace 'YOUR_TEST_KEY_ID' with your actual test key ID
// 3. Replace 'YOUR_TEST_KEY_SECRET' with your actual test key secret
// 4. Replace 'YOUR_LIVE_KEY_ID' with your actual live key ID
// 5. Replace 'YOUR_LIVE_KEY_SECRET' with your actual live key secret
// 6. Replace 'YOUR_WEBHOOK_SECRET' with your webhook secret
// 7. Change 'current' to 'live' when going to production 