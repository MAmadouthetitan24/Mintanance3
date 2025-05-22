import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Initialize Stripe with the latest API version
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })
  : null;

// Create Payment Intent
router.post(
  '/create-payment-intent',
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!stripe) {
        res.status(500).json({
          error: 'Stripe is not properly configured',
        });
        return;
      }

      const { amount, jobId } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: 'User not authenticated',
        });
        return;
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'gbp',
        metadata: {
          jobId,
          userId: user.id,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        error: 'Failed to create payment intent',
      });
    }
  }
);

// Handle successful payment
router.post(
  '/jobs/:id/payment-success',
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id: jobId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: 'User not authenticated',
        });
        return;
      }

      // Update job status to paid
      // Add your database update logic here

      res.json({
        success: true,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      console.error('Error processing payment success:', error);
      res.status(500).json({
        error: 'Failed to process payment success',
      });
    }
  }
);

// Stripe webhook handler
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!stripe) {
        res.status(500).json({
          error: 'Stripe is not properly configured',
        });
        return;
      }

      const sig = req.headers['stripe-signature'];

      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        res.status(400).json({
          error: 'Missing stripe signature or webhook secret',
        });
        return;
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
          
          // Update job payment status to completed
          await storage.jobs.update({
            where: { id: paymentIntent.metadata.jobId },
            data: {
              paymentStatus: 'completed',
              status: 'in_progress',
              updatedAt: new Date(),
              paymentInfo: {
                transactionId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: 'completed',
                method: 'card',
                receiptUrl: charge?.receipt_url ? charge.receipt_url : undefined,
              },
            },
          });

          // Notify contractor that payment is received
          if (paymentIntent.metadata.contractorId) {
            // Add notification logic here
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          // Update job payment status to failed
          await storage.jobs.update({
            where: { id: failedPayment.metadata.jobId },
            data: {
              paymentStatus: 'failed',
              updatedAt: new Date(),
              paymentInfo: {
                transactionId: failedPayment.id,
                amount: failedPayment.amount,
                currency: failedPayment.currency,
                status: 'failed',
                method: 'card',
                error: failedPayment.last_payment_error?.message,
              },
            },
          });
          break;

        case 'payment_intent.processing':
          const processingPayment = event.data.object as Stripe.PaymentIntent;
          // Update job payment status to processing
          await storage.jobs.update({
            where: { id: processingPayment.metadata.jobId },
            data: {
              paymentStatus: 'processing',
              updatedAt: new Date(),
            },
          });
          break;

        case 'charge.refunded':
          const refund = event.data.object as Stripe.Charge;
          const refundDetails = refund.refunds?.data?.[0];
          
          // Update job payment status for refunds
          await storage.jobs.update({
            where: { id: refund.metadata.jobId },
            data: {
              paymentStatus: 'refunded',
              status: 'cancelled',
              updatedAt: new Date(),
              paymentInfo: {
                transactionId: refund.payment_intent as string,
                amount: refund.amount_refunded,
                currency: refund.currency,
                status: 'refunded',
                method: 'card',
                refundId: refundDetails?.id,
              },
            },
          });
          break;

        // Add more event handlers as needed
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(400).json({
        error: 'Webhook error',
      });
    }
  }
);

export default router;