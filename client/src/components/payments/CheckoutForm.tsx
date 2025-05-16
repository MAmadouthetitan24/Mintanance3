import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CheckoutFormProps {
  jobId: number;
  amount: number;
  onSuccess?: () => void;
}

export function CheckoutForm({ jobId, amount, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + `/payment/confirmation/${jobId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setMessage(error.message || 'An unexpected error occurred');
        toast({
          title: 'Payment Failed',
          description: error.message || 'There was a problem processing your payment',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        setSuccess(true);
        setMessage('Payment successful! Redirecting...');
        
        // Update job payment status on the server
        await apiRequest('POST', `/api/jobs/${jobId}/payment-success`, {
          paymentId: paymentIntent.id,
        });
        
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully',
          variant: 'default',
        });
        
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/job-detail/${jobId}`);
        }, 2000);
      } else {
        setMessage('Payment processing. Please wait...');
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred during payment processing');
      toast({
        title: 'Error',
        description: err.message || 'An error occurred during payment processing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {message && (
        <div className={`flex items-center p-3 rounded-md ${success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {success ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <AlertCircle className="mr-2 h-4 w-4" />
          )}
          <p>{message}</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isLoading || !stripe || !elements || success} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Payment Complete
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  );
}