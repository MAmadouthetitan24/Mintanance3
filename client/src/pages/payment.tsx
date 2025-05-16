import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CheckoutForm from '@/components/payments/CheckoutForm';
import { Skeleton } from '@/components/ui/skeleton';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch job details
  const { 
    data: job, 
    isLoading: isJobLoading, 
    error: jobError 
  } = useQuery({
    queryKey: ['/api/jobs', jobId],
    enabled: !isNaN(jobId)
  });

  // Redirect if not authorized
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login');
    }
    
    if (!isAuthLoading && user && job && user.id !== job.homeownerId) {
      navigate('/dashboard');
    }
  }, [isAuthLoading, user, job, navigate]);

  // Handle payment success
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId] });
    queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    
    // Redirect to job detail after a short delay
    setTimeout(() => {
      navigate(`/job-detail/${jobId}`);
    }, 2000);
  };

  // Handle return to job detail
  const handleReturn = () => {
    navigate(`/job-detail/${jobId}`);
  };

  // Calculate amount to pay in cents
  const amountToPay = job?.actualCost ? job.actualCost * 100 : job?.estimatedCost ? job.estimatedCost * 100 : 0;

  // Display loading state
  if (isAuthLoading || isJobLoading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="p-0 mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-60" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="mt-8">
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display error state
  if (jobError || !job) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load job details. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Cannot pay if job is not completed
  if (job.status !== 'completed') {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" className="p-0 mb-6" onClick={handleReturn}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Job Details
        </Button>
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Not Available</AlertTitle>
          <AlertDescription>
            Payment is only available for completed jobs. This job is currently marked as: <Badge>{job.status}</Badge>
          </AlertDescription>
        </Alert>
        <Button onClick={handleReturn} className="mt-4">
          Return to Job Details
        </Button>
      </div>
    );
  }

  // Display payment success state
  if (paymentSuccess) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>
            Your payment has been processed successfully. You will be redirected to the job details page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" className="p-0 mb-6" onClick={handleReturn}>
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Job Details
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Payment for Job: {job.title}</CardTitle>
          <CardDescription>
            Completed {job.completedAt ? formatDistanceToNow(new Date(job.completedAt), { addSuffix: true }) : 'recently'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-semibold mb-3">Job Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Type:</span>
                <span>{job.tradeId ? 'Repair & Maintenance' : 'Custom Service'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contractor:</span>
                <span>{job.contractorName || 'Assigned Contractor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span>{job.location || 'Not specified'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee:</span>
                <span>${(job.actualCost || job.estimatedCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee:</span>
                <span>${((job.actualCost || job.estimatedCost || 0) * 0.05).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span className="text-lg">
                  ${((job.actualCost || job.estimatedCost || 0) * 1.05).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                amount={Math.round(amountToPay * 1.05)} 
                jobId={jobId}
                onSuccess={handlePaymentSuccess}
                onCancel={handleReturn}
              />
            </Elements>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Processing Unavailable</AlertTitle>
              <AlertDescription>
                Payment processing is not available at the moment. Please try again later.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-gray-500 bg-gray-50">
          <span>Secure payment powered by Stripe</span>
          <span>Transaction ID: {`JOB-${jobId}`}</span>
        </CardFooter>
      </Card>
    </div>
  );
}