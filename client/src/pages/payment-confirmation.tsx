import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function PaymentConfirmation() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // Get the payment intent status from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');
    
    if (!paymentIntent || !paymentIntentClientSecret) {
      setStatus('error');
      setError('Invalid payment information. Please try again.');
      return;
    }
    
    if (redirectStatus === 'succeeded') {
      // Payment successful, update the job
      const updateJobPayment = async () => {
        try {
          const response = await apiRequest('POST', `/api/jobs/${jobId}/payment-success`, {
            paymentId: paymentIntent
          });
          
          if (response.ok) {
            // Invalidate the job query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId] });
            setStatus('success');
          } else {
            const data = await response.json();
            setStatus('error');
            setError(data.message || 'Failed to update payment status');
          }
        } catch (err: any) {
          setStatus('error');
          setError(err.message || 'An error occurred while confirming payment');
        }
      };
      
      updateJobPayment();
    } else {
      setStatus('error');
      setError('Payment was not successful. Please try again.');
    }
  }, [jobId, queryClient]);
  
  // Fetch job details in background
  const { data: job } = useQuery({
    queryKey: ['/api/jobs', jobId],
    enabled: !isNaN(jobId)
  });
  
  const handleBack = () => {
    navigate(`/job-detail/${jobId}`);
  };
  
  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Card className="shadow-lg border-0">
        <CardHeader className={`text-center ${status === 'success' ? 'bg-green-50' : status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="flex justify-center mb-4">
            {status === 'loading' ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' ? 'Processing Payment...' : 
             status === 'success' ? 'Payment Successful!' : 
             'Payment Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {status === 'loading' ? (
            <p className="text-center text-gray-600">
              Please wait while we confirm your payment...
            </p>
          ) : status === 'success' ? (
            <>
              <p className="text-center text-gray-600">
                Thank you for your payment. Your transaction has been completed successfully.
              </p>
              <p className="text-center text-gray-600">
                A receipt has been sent to your email address.
              </p>
              {job && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Payment Details:</h3>
                  <p><span className="font-medium">Service:</span> {job.title}</p>
                  <p><span className="font-medium">Amount Paid:</span> ${((job.actualCost || job.estimatedCost || 0) / 100).toFixed(2)}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-center text-red-600">
                {error || 'We were unable to process your payment. Please try again.'}
              </p>
              <p className="text-center text-gray-600">
                If you continue to experience issues, please contact our support team.
              </p>
            </>
          )}
          
          <div className="flex justify-center mt-6">
            <Button onClick={handleBack} variant={status === 'error' ? 'default' : 'outline'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {status === 'success' ? 'Return to Job Details' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}