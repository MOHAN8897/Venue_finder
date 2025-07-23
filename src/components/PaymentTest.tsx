import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createRazorpayOrder, initializeRazorpayPayment } from '@/lib/razorpayService';
import { useAuth } from '@/hooks/useAuth';

const PaymentTest: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testPayment = async () => {
    if (!user) {
      setResult('❌ Please sign in first');
      return;
    }

    setIsLoading(true);
    setResult('🔄 Testing payment flow...');

    try {
      // Test order creation
      const order = await createRazorpayOrder({
        amount: 10000, // ₹100 in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
        notes: {
          test: 'true',
          user_id: user.id
        }
      });

      setResult(`✅ Order created successfully: ${order.id}`);

      // Test payment modal
      initializeRazorpayPayment(
        order,
        {
          name: user.name || user.full_name || 'Test User',
          email: user.email || 'test@example.com',
          contact: user.phone || '9999999999'
        },
        (payment) => {
          setResult(`✅ Payment successful: ${payment.razorpay_payment_id}`);
          setIsLoading(false);
        },
        (error) => {
          setResult(`❌ Payment failed: ${error.message}`);
          setIsLoading(false);
        },
        () => {
          setResult('ℹ️ Payment cancelled by user');
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This will test the Razorpay payment integration with a ₹100 test order.
        </p>
        
        <Button
          onClick={testPayment}
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Payment (₹100)'}
        </Button>
        
        {!user && (
          <p className="text-red-600 text-sm">Please sign in to test payments</p>
        )}
        
        {result && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentTest; 