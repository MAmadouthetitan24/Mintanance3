import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { CardField, useStripe, useConfirmPayment } from '@stripe/stripe-react-native';
import { Button } from '@/components/ui';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ENDPOINTS } from '../config';
import { useQuery } from '@tanstack/react-query';
import { Job } from '../types/common';

interface Props {
  route: {
    params: {
      jobId: string;
    };
  };
  navigation: any;
}

export default function PaymentScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { confirmPayment, loading } = useConfirmPayment();
  const [cardComplete, setCardComplete] = useState(false);

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`${ENDPOINTS.JOBS}/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    },
  });

  const handlePayment = async () => {
    if (!job) return;

    try {
      // Create payment intent
      const response = await fetch(ENDPOINTS.PAYMENTS.CREATE_INTENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: job.actualCost || job.estimatedCost,
          jobId: job.id,
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        Alert.alert('Error', backendError.message);
        return;
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else if (paymentIntent) {
        // Payment successful
        const updateResponse = await fetch(`${ENDPOINTS.JOBS}/${jobId}/payment-success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: paymentIntent.id,
          }),
        });

        if (updateResponse.ok) {
          Alert.alert(
            'Success',
            'Payment processed successfully!',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Jobs'),
              },
            ]
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while processing payment');
    }
  };

  if (jobLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load job details</Text>
      </View>
    );
  }

  const amount = job.actualCost || job.estimatedCost || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Complete Payment</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Job ID:</Text>
            <Text style={styles.value}>#{job.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Service:</Text>
            <Text style={styles.value}>{job.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Contractor:</Text>
            <Text style={styles.value}>{job.contractor?.name || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount:</Text>
          <Text style={styles.amount}>
            £{(amount / 100).toFixed(2)}
          </Text>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <CardField
            postalCodeEnabled={true}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={styles.cardFieldStyle}
            style={styles.cardField}
            onCardChange={cardDetails => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>

        <Button
          onPress={handlePayment}
          disabled={!cardComplete || loading}
          loading={loading}
          style={styles.payButton}
        >
          Pay £{(amount / 100).toFixed(2)}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  amountContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentMethods: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  cardFieldStyle: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    placeholderColor: '#999999',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  payButton: {
    marginTop: 16,
  },
}); 