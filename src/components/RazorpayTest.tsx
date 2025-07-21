import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testPayment, calculatePlatformFee, calculateTotalAmount } from '@/lib/razorpayService';

const RazorpayTest: React.FC = () => {
  const [venueAmount, setVenueAmount] = useState<number>(33600); // ₹336 in paise
  const [platformFee, setPlatformFee] = useState<number>(4500); // ₹45 in paise
  const [totalAmount, setTotalAmount] = useState<number>(38100); // ₹381 in paise
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAmountChange = (value: string) => {
    const amount = parseInt(value) || 0;
    setVenueAmount(amount);
    const fee = calculatePlatformFee(amount);
    const total = calculateTotalAmount(amount);
    setPlatformFee(fee);
    setTotalAmount(total);
  };

  const handleTestPayment = async () => {
    setIsLoading(true);
    try {
      await testPayment();
    } catch (error) {
      console.error('Test payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Razorpay Integration Test</CardTitle>
          <CardDescription>
            Test your Razorpay integration with this component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venueAmount">Venue Amount (₹)</Label>
            <Input
              id="venueAmount"
              type="number"
              value={venueAmount / 100}
              onChange={(e) => handleAmountChange((parseFloat(e.target.value) * 100).toString())}
              placeholder="Enter venue amount"
            />
          </div>

          <div className="space-y-2">
            <Label>Platform Fee (₹)</Label>
            <div className="text-lg font-semibold text-blue-600">
              {formatAmount(platformFee)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total Amount (₹)</Label>
            <div className="text-xl font-bold text-green-600">
              {formatAmount(totalAmount)}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleTestPayment} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Test Payment (₹100)'}
            </Button>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter your venue amount above</li>
              <li>Platform fee is calculated automatically (13.4%)</li>
              <li>Click "Test Payment" to test with ₹100</li>
              <li>Use test card: 4111 1111 1111 1111</li>
              <li>Any future expiry date</li>
              <li>Any 3-digit CVV</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RazorpayTest; 