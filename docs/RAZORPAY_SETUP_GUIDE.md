# 🚀 Complete Razorpay Integration Setup Guide

## 📋 Prerequisites
- Razorpay account (free to create)
- Business verification completed
- API keys generated

---

## 🔑 Step 1: Get Your Razorpay API Keys

### 1.1 Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Click "Sign Up" and complete registration
3. Verify your email and phone number
4. Complete KYC (Know Your Customer) process

### 1.2 Generate API Keys
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **"Generate Key Pair"**
4. You'll receive:
   - **Key ID** (starts with `rzp_test_` for test mode)
   - **Key Secret** (keep this secure!)

### 1.3 Test vs Live Mode
- **Test Mode**: Use for development (no real money)
- **Live Mode**: Use for production (real transactions)
- Start with Test Mode for development

---

## ⚙️ Step 2: Configure Your Project

### 2.1 Update Configuration File
1. Open `src/lib/razorpay-config.ts`
2. Replace the placeholder values with your actual API keys:

```typescript
export const razorpayConfig = {
  test: {
    keyId: 'rzp_test_HvibTBowLV94vj', // Replace this
    keySecret: '5ZVnvIqZO3eCRlfOnQAqHEux', // Replace this
    environment: 'test'
  },
  // ... rest of config
};
```

### 2.2 Environment Setup
Create a `.env` file in your project root:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
VITE_RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET
VITE_RAZORPAY_ENVIRONMENT=test
VITE_RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

---

## 🧪 Step 3: Test Your Integration

### 3.1 Add Test Component
1. Import the test component in your app:

```typescript
import RazorpayTest from '@/components/RazorpayTest';
```

2. Add it to a page for testing:

```typescript
<RazorpayTest />
```

### 3.2 Test Payment Flow
1. Start your development server: `npm run dev`
2. Navigate to the test component
3. Click "Test Payment (₹100)"
4. Use test card details:
   - **Card Number**: 4111 1111 1111 1111
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits
   - **Name**: Any name

---

## 💰 Step 4: Understand Payment Flow

### 4.1 Your Scenario Breakdown
```
Venue Rate: ₹112/hour × 3 hours = ₹336
Platform Fee: ₹45
Total User Pays: ₹381
```

### 4.2 Money Flow
1. **User pays ₹381** to Razorpay
2. **₹381 goes to your Razorpay account**
3. **Your system records:**
   - Total payment: ₹381
   - Venue revenue: ₹336
   - Platform fee: ₹45
4. **You manually transfer ₹336 to venue owner**
5. **You keep ₹45 as platform revenue**

---

## 🔧 Step 5: Customize Platform Fees

### 5.1 Update Fee Configuration
In `src/lib/razorpay-config.ts`:

```typescript
platformFee: {
  percentage: 0.134, // 13.4% - change this
  minimumAmount: 4500, // ₹45 in paise - change this
  maximumAmount: 50000 // ₹500 in paise - change this
}
```

### 5.2 Fee Calculation
- **Percentage-based**: 13.4% of venue amount
- **Minimum fee**: ₹45 (even for small amounts)
- **Maximum fee**: ₹500 (caps for large amounts)

---

## 🌐 Step 6: Set Up Webhooks (Optional)

### 6.1 Create Webhook Endpoint
1. Go to Razorpay Dashboard
2. Navigate to **Settings** → **Webhooks**
3. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`

### 6.2 Webhook Secret
1. Copy the webhook secret from dashboard
2. Update in your config:

```typescript
webhook: {
  secret: 'YOUR_ACTUAL_WEBHOOK_SECRET'
}
```

---

## 🚀 Step 7: Go Live

### 7.1 Switch to Live Mode
1. Complete business verification
2. Update configuration:

```typescript
current: 'live', // Change from 'test' to 'live'
```

3. Replace test keys with live keys:

```typescript
live: {
  keyId: 'rzp_live_YOUR_LIVE_KEY_ID',
  keySecret: 'YOUR_LIVE_KEY_SECRET',
  environment: 'live'
}
```

### 7.2 Update Environment Variables
```env
VITE_RAZORPAY_ENVIRONMENT=live
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
VITE_RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
```

---

## 📱 Step 8: Mobile Integration

### 8.1 Mobile Payment Flow
The integration automatically works on mobile:
- Responsive payment modal
- UPI, cards, netbanking support
- Native mobile experience

### 8.2 Test on Mobile
1. Open your app on mobile
2. Navigate to booking flow
3. Test payment with mobile number
4. Verify UPI and wallet payments

---

## 🔒 Step 9: Security Best Practices

### 9.1 API Key Security
- ✅ Never expose key secret in frontend
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for test/live

### 9.2 Payment Verification
- ✅ Always verify payment signatures
- ✅ Use webhooks for payment status
- ✅ Implement proper error handling
- ✅ Log all payment attempts

---

## 🐛 Step 10: Troubleshooting

### 10.1 Common Issues

**Payment Modal Not Opening**
- Check if Razorpay script is loaded
- Verify API key is correct
- Check browser console for errors

**Payment Failing**
- Ensure test card details are correct
- Check if amount is in paise (multiply by 100)
- Verify currency is 'INR'

**Webhook Not Working**
- Check webhook URL is accessible
- Verify webhook secret matches
- Test with webhook testing tool

### 10.2 Debug Mode
Enable debug logging:

```typescript
// Add to your config
debug: true
```

---

## 📞 Support

### Razorpay Support
- **Documentation**: https://razorpay.com/docs/
- **Support**: support@razorpay.com
- **Phone**: 1800-419-1834

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **Network Error**: 4000 0000 0000 9995

---

## ✅ Checklist

- [ ] Razorpay account created
- [ ] API keys generated
- [ ] Configuration file updated
- [ ] Test payment successful
- [ ] Platform fees configured
- [ ] Webhooks set up (optional)
- [ ] Mobile testing completed
- [ ] Security measures implemented
- [ ] Ready for production

---

## 🎉 Congratulations!

Your Razorpay integration is now complete! You can:
- Accept payments from users
- Calculate platform fees automatically
- Process refunds when needed
- Track all transactions
- Scale your business

**Next Steps:**
1. Test thoroughly with different payment methods
2. Set up proper error handling
3. Implement payment analytics
4. Plan for production deployment 