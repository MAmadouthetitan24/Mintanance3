import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';

interface PaymentButtonProps {
  jobId: number;
  jobStatus: string;
  isPaid: boolean;
  disabled?: boolean;
  className?: string;
}

export function PaymentButton({ 
  jobId, 
  jobStatus, 
  isPaid, 
  disabled = false,
  className = ''
}: PaymentButtonProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePaymentClick = () => {
    setIsLoading(true);
    // Navigate to the payment page for this job
    navigate(`/payment/${jobId}`);
  };

  // Only allow payment for completed jobs that haven't been paid yet
  const canPay = jobStatus === 'completed' && !isPaid && !disabled;

  if (isPaid) {
    return (
      <Button 
        variant="outline" 
        className={`${className} bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800`}
        disabled
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Payment Complete
      </Button>
    );
  }
  
  return (
    <Button
      onClick={handlePaymentClick}
      disabled={!canPay || isLoading}
      className={className}
      variant={canPay ? "default" : "outline"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {canPay ? "Make Payment" : "Payment Unavailable"}
        </>
      )}
    </Button>
  );
}