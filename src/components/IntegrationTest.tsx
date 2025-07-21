import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { testPayment, validateConfig, logConfigStatus } from '@/lib/razorpayService';
import { useAuth } from '@/hooks/useAuth';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const IntegrationTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runSupabaseTests = async () => {
    // Test 1: Supabase Connection
    addTestResult({
      name: 'Supabase Connection',
      status: 'pending',
      message: 'Testing connection...'
    });

    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        addTestResult({
          name: 'Supabase Connection',
          status: 'error',
          message: 'Connection failed',
          details: error.message
        });
      } else {
        addTestResult({
          name: 'Supabase Connection',
          status: 'success',
          message: 'Connection successful'
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Environment Variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    addTestResult({
      name: 'Supabase Environment Variables',
      status: supabaseUrl && supabaseKey ? 'success' : 'error',
      message: supabaseUrl && supabaseKey ? 'Environment variables configured' : 'Missing environment variables',
      details: {
        url: supabaseUrl ? '✓ Set' : '✗ Missing',
        key: supabaseKey ? '✓ Set' : '✗ Missing'
      }
    });

    // Test 3: Authentication
    if (user) {
      addTestResult({
        name: 'User Authentication',
        status: 'success',
        message: `Authenticated as ${user.email}`,
        details: {
          userId: user.user_id,
          email: user.email,
          role: user.role
        }
      });
    } else {
      addTestResult({
        name: 'User Authentication',
        status: 'error',
        message: 'No authenticated user'
      });
    }
  };

  const runRazorpayTests = async () => {
    // Test 1: Configuration Validation
    addTestResult({
      name: 'Razorpay Configuration',
      status: 'pending',
      message: 'Validating configuration...'
    });

    try {
      const isValid = validateConfig();
      logConfigStatus();
      
      addTestResult({
        name: 'Razorpay Configuration',
        status: isValid ? 'success' : 'error',
        message: isValid ? 'Configuration valid' : 'Configuration invalid',
        details: {
          environment: import.meta.env.VITE_RAZORPAY_ENVIRONMENT || 'test',
          keyId: import.meta.env.VITE_RAZORPAY_KEY_ID ? '✓ Set' : '✗ Missing',
          keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET ? '✓ Set' : '✗ Missing'
        }
      });
    } catch (error) {
      addTestResult({
        name: 'Razorpay Configuration',
        status: 'error',
        message: 'Configuration validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Environment Variables
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const razorpayKeySecret = import.meta.env.VITE_RAZORPAY_KEY_SECRET;
    const razorpayEnv = import.meta.env.VITE_RAZORPAY_ENVIRONMENT;

    addTestResult({
      name: 'Razorpay Environment Variables',
      status: razorpayKeyId && razorpayKeySecret ? 'success' : 'error',
      message: razorpayKeyId && razorpayKeySecret ? 'Environment variables configured' : 'Missing environment variables',
      details: {
        keyId: razorpayKeyId ? '✓ Set' : '✗ Missing',
        keySecret: razorpayKeySecret ? '✓ Set' : '✗ Missing',
        environment: razorpayEnv || 'test'
      }
    });

    // Test 3: Payment Test (only if user is authenticated)
    if (user) {
      addTestResult({
        name: 'Razorpay Payment Test',
        status: 'pending',
        message: 'Testing payment integration...'
      });

      try {
        // This will open the payment modal
        await testPayment();
        addTestResult({
          name: 'Razorpay Payment Test',
          status: 'success',
          message: 'Payment modal opened successfully'
        });
      } catch (error) {
        addTestResult({
          name: 'Razorpay Payment Test',
          status: 'error',
          message: 'Payment test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      addTestResult({
        name: 'Razorpay Payment Test',
        status: 'error',
        message: 'Cannot test payment without authentication'
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Run Supabase tests
    await runSupabaseTests();
    
    // Run Razorpay tests
    await runRazorpayTests();

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Integration Test Suite
          </CardTitle>
          <CardDescription>
            Test Supabase and Razorpay integration to ensure everything is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.details && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <pre>{JSON.stringify(result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Summary:</span>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {testResults.filter(r => r.status === 'success').length} Passed
                    </Badge>
                    <Badge variant="destructive">
                      {testResults.filter(r => r.status === 'error').length} Failed
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Test Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Run All Tests" to test both Supabase and Razorpay integration</li>
              <li>• Supabase tests will verify connection and environment variables</li>
              <li>• Razorpay tests will validate configuration and open a test payment modal</li>
              <li>• All tests should pass for full integration to work</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationTest; 