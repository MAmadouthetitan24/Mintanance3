import request from 'supertest';
import { app } from '../app';
import { storage } from '../storage';
import Stripe from 'stripe';
import { mockStripe } from '../__mocks__/stripe';
import { mockUser, mockJob, mockPaymentIntent } from '../__mocks__/data';

// Mock Stripe
jest.mock('stripe', () => mockStripe);

// Mock storage
jest.mock('../storage', () => ({
  storage: {
    jobs: {
      update: jest.fn(),
    },
    getJob: jest.fn(),
    createRefundRequest: jest.fn(),
    getRefundRequest: jest.fn(),
    updateRefundRequest: jest.fn(),
  }
}));

describe('Payment Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Payment Intent', () => {
    it('should create a payment intent successfully', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${mockUser.token}`)
        .send({
          amount: 1000,
          jobId: mockJob.id,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('clientSecret');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'gbp',
        metadata: {
          jobId: mockJob.id,
          userId: mockUser.id,
        },
      });
    });

    it('should handle missing authentication', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({
          amount: 1000,
          jobId: mockJob.id,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'User not authenticated');
    });

    it('should handle invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${mockUser.token}`)
        .send({
          amount: -1000,
          jobId: mockJob.id,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Payment Webhook Handler', () => {
    it('should handle successful payment', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: mockPaymentIntent,
        },
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'mock_signature')
        .send(event);

      expect(response.status).toBe(200);
      expect(storage.jobs.update).toHaveBeenCalledWith({
        where: { id: mockPaymentIntent.metadata.jobId },
        data: expect.objectContaining({
          paymentStatus: 'completed',
          status: 'in_progress',
        }),
      });
    });

    it('should handle failed payment', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            ...mockPaymentIntent,
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'mock_signature')
        .send(event);

      expect(response.status).toBe(200);
      expect(storage.jobs.update).toHaveBeenCalledWith({
        where: { id: mockPaymentIntent.metadata.jobId },
        data: expect.objectContaining({
          paymentStatus: 'failed',
        }),
      });
    });

    it('should handle invalid webhook signature', async () => {
      const response = await request(app)
        .post('/api/payments/webhook')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing stripe signature or webhook secret');
    });
  });

  describe('Refund Flow', () => {
    it('should create refund request successfully', async () => {
      (storage.getJob as jest.Mock).mockResolvedValueOnce({
        ...mockJob,
        clientId: mockUser.id,
        paymentInfo: {
          transactionId: 'pi_123',
          status: 'completed',
        },
      });

      (storage.createRefundRequest as jest.Mock).mockResolvedValueOnce({
        id: 1,
        jobId: mockJob.id,
        status: 'pending',
      });

      const response = await request(app)
        .post(`/api/payments/jobs/${mockJob.id}/refund-request`)
        .set('Authorization', `Bearer ${mockUser.token}`)
        .send({
          reason: 'Service not satisfactory',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('refundRequest');
    });

    it('should process approved refund successfully', async () => {
      (storage.getRefundRequest as jest.Mock).mockResolvedValueOnce({
        id: 1,
        jobId: mockJob.id,
        status: 'pending',
        paymentIntentId: 'pi_123',
        userId: mockUser.id,
      });

      const response = await request(app)
        .post('/api/payments/refund-requests/1/process')
        .set('Authorization', `Bearer ${mockUser.adminToken}`)
        .send({
          approved: true,
        });

      expect(response.status).toBe(200);
      expect(mockStripe.refunds.create).toHaveBeenCalled();
      expect(storage.updateRefundRequest).toHaveBeenCalled();
      expect(storage.jobs.update).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should handle payment intent creation failure gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Stripe.errors.StripeCardError({
          message: 'Card declined',
          type: 'card_error',
          code: 'card_declined',
        })
      );

      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${mockUser.token}`)
        .send({
          amount: 1000,
          jobId: mockJob.id,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle webhook processing failure gracefully', async () => {
      (storage.jobs.update as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: mockPaymentIntent,
        },
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'mock_signature')
        .send(event);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 