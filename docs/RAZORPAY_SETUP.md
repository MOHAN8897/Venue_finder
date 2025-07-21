# Razorpay Integration Setup Guide

## Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
VITE_RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET
VITE_RAZORPAY_TEST_MODE=true

# For production, use live keys:
# VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
# VITE_RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
# VITE_RAZORPAY_TEST_MODE=false
```

## Getting Razorpay Keys

### 1. Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete KYC verification

### 2. Get Test Keys
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate a new key pair
4. Copy the Key ID and Key Secret

### 3. Get Live Keys (Production)
1. Complete business verification
2. Go to Settings → API Keys
3. Generate live key pair
4. Update environment variables

## Testing Payment Flow

### Test Card Details:
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

### Test UPI:
- **UPI ID**: success@razorpay

### Test Net Banking:
- **Bank**: Any test bank
- **Credentials**: Use any test credentials

## Security Best Practices

1. **Never expose Key Secret in frontend code**
2. **Always verify payment signatures on backend**
3. **Use HTTPS in production**
4. **Implement webhook verification**
5. **Store sensitive data securely**

## Webhook Setup

### 1. Configure Webhook URL
```
https://yourdomain.com/api/razorpay/webhook
```

### 2. Webhook Events to Listen:
- `payment.captured`
- `payment.failed`
- `refund.processed`
- `order.paid`

### 3. Webhook Security
- Verify webhook signature
- Use HTTPS
- Implement idempotency

## Common Issues & Solutions

### 1. Payment Failed
- Check if test mode is enabled
- Verify key configuration
- Check amount format (should be in paise)

### 2. Signature Verification Failed
- Ensure correct key secret
- Verify signature algorithm
- Check order_id and payment_id format

### 3. SDK Loading Issues
- Check internet connection
- Verify script loading
- Check browser console for errors

## Production Checklist

- [ ] Switch to live keys
- [ ] Enable HTTPS
- [ ] Configure webhooks
- [ ] Test payment flow
- [ ] Implement error handling
- [ ] Add logging
- [ ] Set up monitoring
- [ ] Test refund flow
- [ ] Verify webhook security
- [ ] Document API usage 