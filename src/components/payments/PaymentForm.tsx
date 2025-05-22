import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CardField, useStripe, CardFieldInput } from '@stripe/stripe-react-native';
import { Button } from '@/components/ui';
import { ENDPOINTS } from '../../config';

interface PaymentFormProps {
  amount: number;
  jobId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  jobId,
  onSuccess,
  onError,
}) => {
  const { createPaymentMethod, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create a payment method from the card details
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Create a payment intent on your backend
      const response = await fetch(ENDPOINTS.PAYMENTS.CREATE_INTENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          jobId,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        throw new Error(backendError.message);
      }

      // Confirm the payment with the client secret
      const { error: confirmError } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
      Alert.alert('Payment Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CardField
        postalCodeEnabled={true}
        placeholders={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={styles.card}
        style={styles.cardField}
        onCardChange={(cardDetails: CardFieldInput.Details) => {
          setCardComplete(cardDetails.complete);
        }}
      />
      <Button
        onPress={handlePayment}
        disabled={!cardComplete || loading}
        loading={loading}
        style={{ marginTop: 24 }}
      >
        Pay Now
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 16,
  },
  payButton: {
    marginTop: 16,
  },
}); 