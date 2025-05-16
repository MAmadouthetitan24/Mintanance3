import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This key should come from an environment variable
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const [, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['/api/jobs', jobId],
    enabled: !isNaN(jobId)
  });
  
  // Get payment intent when job is loaded
  useEffect(() => {
    if (!job || !stripePromise) return;
    
    const fetchPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Calculate amount from job
        const amount = job.actualCost || job.estimatedCost;
        
        if (!amount) {
          setError('No payment amount found for this job');
          setIsLoading(false);
          return;
        }
        
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          jobId: job.id,
          amount
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Error setting up payment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentIntent();
  }, [job]);
  
  const handleBack = () => {
    navigate(`/job-detail/${jobId}`);
  };
  
  const handleSuccess = () => {
    navigate(`/payment-confirmation/${jobId}?success=true`);
  };
  
  // Show error if Stripe is not configured
  if (!stripePromise) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-600">Payment Not Available</CardTitle>
            <CardDescription>
              The payment system is not properly configured. Please contact support.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between pt-6">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Job
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (jobLoading || isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>
              {error || 'Could not load job details for payment'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between pt-6">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Job
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const amount = job.actualCost || job.estimatedCost || 0;
  
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-primary-100">
          <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
          <CardDescription>
            Secure payment for {job.title}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Job Summary</h3>
            <p className="text-sm text-gray-600">Service: {job.title}</p>
            <p className="text-sm text-gray-600 mb-2">Reference ID: {job.id}</p>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-semibold">${(amount / 100).toFixed(2)}</span>
            </div>
          </div>
          
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm jobId={job.id} amount={amount} onSuccess={handleSuccess} />
            </Elements>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Job
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}