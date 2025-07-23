# Razorpay UPI Setup Guide - Enable UPI in Test Mode

_Last updated: 2025-01-23_

## 🔍 **Current Issue**
UPI payment option is not showing in Razorpay payment modal despite configuration.

## 🎯 **Solution Steps**

### **Step 1: Check Razorpay Dashboard Settings**

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Go to Settings** → **Payment Methods**
3. **Check UPI Status**:
   - Look for "UPI" in the payment methods list
   - Ensure UPI is **enabled** for both Test and Live modes
   - If disabled, click **Enable** next to UPI

### **Step 2: Test Mode Configuration**

1. **Switch to Test Mode** (top-right toggle)
2. **Navigate to**: Settings → Payment Methods → UPI
3. **Verify UPI Settings**:
   - ✅ UPI should be enabled
   - ✅ "Collect Flow" should be enabled
   - ✅ "Intent Flow" should be enabled (optional)

### **Step 3: Account Verification**

**For UPI to work in Test Mode, your Razorpay account needs:**
- ✅ Basic KYC completed
- ✅ UPI payment method activated
- ✅ Test API keys generated

**Check Account Status:**
1. Go to **Account & Settings** → **Website/App Details**
2. Ensure business details are filled
3. Check if UPI requires additional verification

### **Step 4: Manual UPI Enablement**

If UPI is not visible in your dashboard:

1. **Contact Razorpay Support**:
   - Email: support@razorpay.com
   - Request: "Enable UPI for Test Mode"
   - Mention: Account ID and requirement for testing

2. **Alternative**: Use Razorpay Chat Support
   - Login to dashboard
   - Click chat icon (bottom-right)
   - Ask: "Please enable UPI payment method for test mode"

### **Step 5: Code Configuration (Already Applied)**

```javascript
// Current Razorpay configuration
const options = {
  key: keyId,
  amount: order.amount, // Dynamic amount from order
  currency: order.currency,
  name: 'Venue Finder',
  description: 'Venue Booking Payment',
  order_id: order.id,
  method: {
    upi: true,        // ✅ UPI enabled
    card: true,       // ✅ Cards enabled
    netbanking: true, // ✅ NetBanking enabled
    wallet: true,     // ✅ Wallets enabled
    emi: false        // ❌ EMI disabled for test
  },
  // ... other options
};
```

## 🧪 **Testing UPI After Enablement**

### **Test UPI IDs (Use these once UPI is enabled):**
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

### **Test Flow:**
1. Complete booking → Click "Pay Securely"
2. Razorpay modal opens
3. **Should see**: UPI tab alongside Cards, NetBanking, Wallet
4. Click UPI → Enter `success@razorpay`
5. Payment should succeed

## 🔧 **Dynamic Amount Explanation**

### **How Dynamic Amount Works:**

1. **Order Creation** (Edge Function):
   ```javascript
   // Amount calculated from booking (venue + platform fee)
   const order = await createRazorpayOrder({
     amount: 8300, // ₹83 = 8300 paise
     currency: 'INR',
     // ...
   });
   ```

2. **Razorpay Modal** (Frontend):
   ```javascript
   // Amount automatically taken from order
   const options = {
     amount: order.amount, // 8300 paise = ₹83
     order_id: order.id,
     // ...
   };
   ```

3. **Price Summary Display**:
   - Amount is calculated from selected slots/dates
   - Platform fee (₹35) is added
   - Total is converted to paise (multiply by 100)
   - Razorpay shows amount in rupees automatically

### **Amount Flow Example:**
```
Venue Price: ₹48 (4800 paise)
Platform Fee: ₹35 (3500 paise)
Total: ₹83 (8300 paise)
↓
Razorpay Order: amount: 8300
↓
Modal Shows: ₹83.00
```

## ⚠️ **Common Issues & Solutions**

### **Issue 1: UPI Not Showing**
**Cause**: UPI not enabled in Razorpay account
**Solution**: Follow Steps 1-4 above

### **Issue 2: Wrong Amount Displayed**
**Cause**: Amount calculation error
**Solution**: Check console logs for order details

### **Issue 3: "UPI Not Available" Error**
**Cause**: Account limitations
**Solution**: Contact Razorpay support for UPI activation

### **Issue 4: UPI Works in Live but Not Test**
**Cause**: Different settings for Test/Live modes
**Solution**: Enable UPI separately for Test mode

## 📞 **Razorpay Support Contact**

If UPI still doesn't show after following these steps:

**Email Support:**
- Email: support@razorpay.com
- Subject: "Enable UPI Payment Method for Test Mode"
- Include: Account ID, API Key ID, Business Name

**Chat Support:**
- Login to Razorpay Dashboard
- Click chat icon (bottom-right)
- Request UPI enablement for test mode

**Phone Support:**
- India: +91-7676-70-1100
- Available: Mon-Fri, 10 AM - 7 PM IST

## ✅ **Success Checklist**

After completing setup, you should see:
- [ ] UPI tab in Razorpay payment modal
- [ ] Dynamic amount (₹83 in your case) displayed correctly
- [ ] Ability to enter test UPI ID: `success@razorpay`
- [ ] Successful test payment completion
- [ ] Booking created in database after payment

## 🎯 **Next Steps**

1. **Check Dashboard**: Verify UPI is enabled in your Razorpay account
2. **Contact Support**: If UPI is not available, reach out to Razorpay
3. **Test Payment**: Once enabled, test with `success@razorpay`
4. **Verify Database**: Confirm booking is saved after successful payment

**Note**: UPI enablement might take 24-48 hours after request to Razorpay support. 