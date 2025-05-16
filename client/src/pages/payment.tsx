import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/payments/CheckoutForm';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Make sure to call loadStripe outside of a component's render to avoid recreating
// the Stripe object on every render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch job details
  const { 
    data: job, 
    isLoading: isLoadingJob,
    isError: isJobError,
  } = useQuery({
    queryKey: ['/api/jobs', jobId],
    enabled: !isNaN(jobId)
  });

  // Get contractor details
  const {
    data: contractor,
    isLoading: isLoadingContractor
  } = useQuery({
    queryKey: ['/api/users', job?.contractorId],
    enabled: !!job?.contractorId
  });

  // Create payment intent when component mounts
  useEffect(() => {
    if (!job || isJobError) return;

    if (job.isPaid) {
      // Job is already paid, redirect back to job detail
      navigate(`/job-detail/${jobId}`);
      return;
    }

    if (user?.id !== job.homeownerId) {
      // Only the homeowner can pay for a job
      setError('You are not authorized to make a payment for this job');
      setIsLoading(false);
      return;
    }

    // Create a payment intent
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('POST', '/api/payments/create-payment-intent', {
          jobId,
          amount: job.actualCost || job.estimatedCost || 0
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || 'Failed to create payment intent');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (job.status === 'completed' && !job.isPaid) {
      createPaymentIntent();
    } else {
      setError('This job is not ready for payment yet');
      setIsLoading(false);
    }
  }, [job, jobId, navigate, user?.id]);

  const handleBack = () => {
    navigate(`/job-detail/${jobId}`);
  };

  const onPaymentSuccess = () => {
    // Invalidate job query to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId] });
  };

  if (isLoadingJob) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job || isJobError) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you are looking for does not exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Calculate amount to pay (use actual cost if available, otherwise estimated cost)
  const amount = job.actualCost || job.estimatedCost || 0;
  const formattedAmount = (amount / 100).toFixed(2);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job Details
      </Button>
      
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-2xl">Payment</CardTitle>
          <CardDescription>
            Complete your payment for {job.title}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Summary</h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Service:</div>
              <div>{job.title}</div>
              
              <div className="font-medium">Contractor:</div>
              <div>
                {isLoadingContractor ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Loading...
                  </span>
                ) : contractor ? (
                  `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || 'Unknown'
                ) : (
                  'Unknown'
                )}
              </div>
              
              <div className="font-medium">Amount:</div>
              <div>${formattedAmount}</div>
            </div>
          </div>
          
          <Separator />
          
          {error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <h3 className="text-lg font-medium">Payment Method</h3>
              
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    jobId={jobId} 
                    amount={amount} 
                    onSuccess={onPaymentSuccess}
                  />
                </Elements>
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p>Payment system is not properly configured. Please contact support.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="p-6 bg-gray-50">
          <p className="text-xs text-gray-500">
            Your payment is securely processed by Stripe. We do not store your 
            credit card information on our servers.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}