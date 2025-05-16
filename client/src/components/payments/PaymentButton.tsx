import { Button, ButtonProps } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CreditCard } from 'lucide-react';

interface PaymentButtonProps extends ButtonProps {
  jobId: number;
  disabled?: boolean;
  isPaid?: boolean;
  className?: string;
}

export function PaymentButton({ 
  jobId, 
  disabled = false, 
  isPaid = false, 
  className = '',
  ...props 
}: PaymentButtonProps) {
  const [, navigate] = useLocation();
  
  const handlePayment = () => {
    navigate(`/payment/${jobId}`);
  };
  
  return (
    <Button
      onClick={handlePayment}
      variant={isPaid ? "outline" : "default"}
      disabled={disabled || isPaid}
      className={`${className} ${isPaid ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' : ''}`}
      {...props}
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {isPaid ? 'Paid' : 'Make Payment'}
    </Button>
  );
}