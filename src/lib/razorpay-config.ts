// Razorpay Configuration
// Uses environment variables for security

export const razorpayConfig = {
  // Test Mode (Development)
  test: {
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_HvibTBowLV94vj',
    keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '5ZVnvIqZO3eCRlfOnQAqHEux',
    environment: 'test'
  },
  
  // Live Mode (Production)
  live: {
    keyId: import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID || 'rzp_live_YOUR_LIVE_KEY_ID',
    keySecret: import.meta.env.VITE_RAZORPAY_LIVE_KEY_SECRET || 'YOUR_LIVE_KEY_SECRET',
    environment: 'live'
  },
  
  // Current environment (change to 'live' for production)
  current: (import.meta.env.VITE_RAZORPAY_ENVIRONMENT as 'test' | 'live') || 'test',
  
  // Currency
  currency: import.meta.env.VITE_RAZORPAY_CURRENCY || 'INR',
  
  // Platform fee settings (Fixed ₹35 per booking)
  platformFee: {
    percentage: 0, // No percentage fee
    minimumAmount: 3500, // Fixed ₹35 (3500 paise)
    maximumAmount: 3500, // Fixed ₹35 (3500 paise)
    fixedFee: 3500 // Fixed ₹35 (3500 paise)
  },
  
  // Webhook settings
  webhook: {
    secret: import.meta.env.VITE_RAZORPAY_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET'
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

// Get current configuration based on environment
export const getCurrentConfig = () => {
  return razorpayConfig[razorpayConfig.current as 'test' | 'live'];
};

// Get key ID for frontend
export const getKeyId = () => {
  const config = getCurrentConfig();
  if (!config.keyId || config.keyId.includes('YOUR_')) {
    console.error('Razorpay key ID not properly configured');
    return '';
  }
  return config.keyId;
};

// Get key secret for backend (server-side only)
export const getKeySecret = () => {
  const config = getCurrentConfig();
  if (!config.keySecret || config.keySecret.includes('YOUR_')) {
    console.error('Razorpay key secret not properly configured');
    return '';
  }
  return config.keySecret;
};

// Validate configuration
export const validateConfig = () => {
  const config = getCurrentConfig();
  const errors = [];
  
  if (!config.keyId || config.keyId.includes('YOUR_')) {
    errors.push('Razorpay Key ID not configured');
  }
  
  if (!config.keySecret || config.keySecret.includes('YOUR_')) {
    errors.push('Razorpay Key Secret not configured');
  }
  
  if (errors.length > 0) {
    console.error('Razorpay Configuration Errors:', errors);
    return false;
  }
  
  return true;
};

// Log configuration status (for debugging)
export const logConfigStatus = () => {
  const config = getCurrentConfig();
  console.log('Razorpay Config Status:', {
    environment: razorpayConfig.current,
    keyIdConfigured: !!(config.keyId && !config.keyId.includes('YOUR_')),
    keySecretConfigured: !!(config.keySecret && !config.keySecret.includes('YOUR_')),
    currency: razorpayConfig.currency,
    platformFee: razorpayConfig.platformFee
  });
}; 