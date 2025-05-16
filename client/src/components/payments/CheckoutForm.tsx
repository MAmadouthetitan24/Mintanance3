import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, LockIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  jobId: number;
  amount: number;
  onSuccess?: () => void;
}

export function CheckoutForm({ jobId, amount, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation/${jobId}`,
          payment_method_data: {
            billing_details: {
              // You can pre-fill user details here if available
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'An unknown error occurred');
        toast({
          title: 'Payment Failed',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: 'Payment Successful',
          description: 'Thank you for your payment!',
          variant: 'default',
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      toast({
        title: 'Payment Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border rounded-md p-4 bg-gray-50">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-gray-500 flex items-center mb-2">
          <LockIcon className="h-3 w-3 mr-1" /> 
          Your payment is processed securely via Stripe
        </p>
        
        <Button 
          type="submit" 
          disabled={isProcessing || !stripe || !elements}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}