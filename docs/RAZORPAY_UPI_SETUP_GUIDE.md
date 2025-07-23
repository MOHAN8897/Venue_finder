# Razorpay UPI Setup & Configuration Guide

## Overview
This guide provides comprehensive instructions for enabling and configuring UPI payments in Razorpay, based on official Razorpay documentation and best practices.

## UPI Configuration Status ✅

### Current Implementation Status
- **Payment Order Creation**: ✅ Working  
- **UPI Integration**: ✅ Enabled in Razorpay Dashboard
- **Test Environment**: ✅ Configured
- **Payment Methods**: Card, Netbanking, Wallet ✅ | UPI ⚠️ (Account-level activation needed)

## UPI Configuration in Razorpay Dashboard

### 1. Product Configuration Check
According to Razorpay documentation, UPI is typically enabled by default in the product configuration:

```json
{
  "active_configuration": {
    "payment_methods": {
      "upi": {
        "enabled": true,
        "instrument": ["upi"]
      }
    }
  }
}
```

### 2. UPI Enablement Process

#### Step 1: Dashboard Access
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Configuration** → **Payment Methods**

#### Step 2: UPI Method Configuration
1. Find **UPI** section in payment methods
2. Ensure UPI toggle is **ENABLED**
3. Check if there are any pending requirements or documentation

#### Step 3: Account Verification
UPI activation may require:
- Business verification documents
- Bank account verification
- KYC completion
- Settlement account setup

### 3. Test Mode UPI Configuration

#### Environment Setup
```javascript
// For Test Mode
const razorpay = new Razorpay({
  key_id: 'rzp_test_xxxxx', // Test Key
  key_secret: 'xxxxx' // Test Secret
});

// UPI Order Creation
const order = await razorpay.orders.create({
  amount: 100, // ₹1.00 in paise
  currency: 'INR',
  method: 'upi',
  notes: {
    purpose: 'UPI test payment'
  }
});
```

#### Test UPI IDs for Testing
```javascript
// Test UPI IDs (provided by Razorpay)
const testUPIIds = {
  success: 'success@razorpay',
  failure: 'failure@razorpay'
};
```

## UPI Payment Implementation

### 1. UPI Payment Link Creation
```javascript
// UPI-only Payment Link
instance.paymentLink.create({
  "upi_link": true,
  "amount": 500,
  "currency": "INR",
  "description": "UPI Payment",
  "customer": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "contact": "+919999999999"
  },
  "notify": {
    "sms": true,
    "email": true
  }
});
```

### 2. UPI Intent Payment
```javascript
// UPI Intent Flow
instance.payments.createUpi({
  "amount": 100,
  "currency": "INR",
  "order_id": "order_xxxxx",
  "email": "customer@example.com",
  "contact": "9090909090",
  "method": "upi",
  "description": "Test payment",
  "upi": {
    "flow": "intent"
  }
});
```

### 3. UPI Collect Payment
```javascript
// UPI Collect Flow
instance.payments.createUpi({
  "amount": 200,
  "currency": "INR",
  "order_id": "order_xxxxx",
  "method": "upi",
  "upi": {
    "flow": "collect",
    "vpa": "customer@upi",
    "expiry_time": 5
  }
});
```

### 4. VPA Validation
```javascript
// Validate UPI VPA before payment
instance.payments.validateVpa({
  "vpa": "customer@paytm"
});
```

## Checkout Configuration

### 1. Enable/Disable UPI in Checkout
```javascript
// Control payment methods in checkout
instance.paymentLink.create({
  "amount": 500,
  "currency": "INR",
  "options": {
    "checkout": {
      "method": {
        "netbanking": "1",
        "card": "1",
        "upi": "1", // Enable UPI
        "wallet": "1"
      }
    }
  }
});
```

### 2. UPI-Specific Options
```javascript
// Frontend Razorpay options
const options = {
  key: 'rzp_test_xxxxx',
  amount: 9500, // ₹95 in paise
  currency: 'INR',
  name: 'Venue Booking',
  description: 'Venue Slot Booking',
  order_id: order.id,
  handler: function (response) {
    // Handle successful payment
  },
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#3399cc'
  },
  config: {
    display: {
      blocks: {
        utib: { //customizing UPI block
          name: "Pay using UPI",
          instruments: [
            {
              method: "upi"
            }
          ]
        }
      },
      sequence: ["block.utib", "block.other"],
      preferences: {
        show_default_blocks: true
      }
    }
  }
};
```

## Common UPI Issues & Solutions

### Issue 1: UPI Not Visible in Checkout
**Cause**: UPI not enabled in Razorpay dashboard
**Solution**: 
1. Check dashboard payment methods
2. Enable UPI toggle
3. Complete any pending verification

### Issue 2: "UPI is not activated for this merchant"
**Cause**: Account-level UPI activation pending
**Solution**:
1. Contact Razorpay support
2. Complete business verification
3. Submit required documents

### Issue 3: Test UPI Payments Failing
**Cause**: Incorrect test credentials or environment
**Solution**:
```javascript
// Use proper test environment
const testOrder = {
  amount: 100,
  currency: 'INR',
  payment_capture: 1
};

// Test with provided test UPI IDs
// success@razorpay - for successful payments
// failure@razorpay - for failed payments
```

## Account Activation Steps

### For New Accounts
1. **Complete KYC**: Submit all required business documents
2. **Bank Verification**: Add and verify settlement bank account
3. **Business Details**: Complete business information
4. **Wait for Approval**: UPI activation typically takes 2-3 business days

### For Existing Accounts
1. **Check Configuration**: Verify current payment method settings
2. **Review Requirements**: Check for any pending documentation
3. **Contact Support**: If UPI is not available after verification

## Support & Troubleshooting

### Razorpay Support Channels
- **Email**: support@razorpay.com
- **Dashboard**: Raise ticket from dashboard
- **Phone**: Available in dashboard under support section

### Debug Information to Provide
1. **Merchant ID**: Your Razorpay account ID
2. **Test Payment ID**: For failed test transactions
3. **Error Logs**: Console errors from frontend
4. **Account Status**: Current verification status

## Testing Checklist

### Frontend Testing
- [ ] UPI option appears in payment modal
- [ ] UPI payment flow initiates correctly
- [ ] Success/failure scenarios work
- [ ] Error handling implemented

### Backend Testing
- [ ] Order creation with UPI method
- [ ] Webhook handling for UPI events
- [ ] Payment verification logic
- [ ] Database updates after payment

### Account Verification
- [ ] UPI enabled in dashboard
- [ ] No pending documentation
- [ ] Test mode working
- [ ] Live mode ready (after approval)

## Integration Verification

### Step 1: Check Current Status
```bash
# Test your current configuration
curl -X POST https://api.razorpay.com/v1/orders \
  -u rzp_test_xxxxx:xxxxx \
  -d amount=100 \
  -d currency=INR \
  -d method=upi
```

### Step 2: Frontend Integration
```javascript
// Verify UPI appears in checkout
const rzp = new Razorpay(options);
rzp.open();

// Check console for any UPI-related errors
// Ensure UPI block is visible to users
```

### Step 3: End-to-End Testing
1. Create test order with UPI method
2. Open payment modal and verify UPI option
3. Complete payment with test UPI ID
4. Verify webhook reception
5. Check payment status in dashboard

---

## Summary

UPI configuration in Razorpay requires both technical integration and account-level activation. While the code integration is straightforward, UPI availability depends on:

1. **Account Verification**: Complete business KYC
2. **Dashboard Configuration**: Enable UPI in payment methods
3. **Testing**: Use provided test UPI IDs
4. **Support**: Contact Razorpay for account-specific issues

The technical implementation is ready in our codebase. The main requirement is ensuring UPI is activated for your specific Razorpay account through their verification process.

**Next Steps**: 
1. Verify dashboard UPI settings
2. Complete any pending account verification
3. Contact Razorpay support if UPI option is not available after verification
4. Test with provided test UPI credentials once activated

Last Updated: December 2024 