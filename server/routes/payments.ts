import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';

const router = Router();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Create a payment intent for a job
router.post('/create-payment-intent', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: 'Payment service unavailable' });
    }

    const { amount, jobId } = req.body;
    
    if (!amount || !jobId) {
      return res.status(400).json({ message: 'Amount and jobId are required' });
    }

    // Validate that the job exists and belongs to the authenticated user
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user.claims.sub;
    
    if (job.homeownerId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to make payments for this job' });
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      metadata: {
        jobId: jobId.toString(),
        userId,
      },
    });

    // Return the client secret to the client
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message });
  }
});

// Handle successful payment for a job
router.post('/jobs/:id/payment-success', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: 'Payment service unavailable' });
    }

    const jobId = parseInt(req.params.id);
    const { paymentIntentId } = req.body;
    
    if (!jobId || !paymentIntentId) {
      return res.status(400).json({ message: 'Job ID and payment intent ID are required' });
    }

    // Validate that the job exists and belongs to the authenticated user
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user.claims.sub;
    
    if (job.homeownerId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this job' });
    }

    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment has not succeeded' });
    }

    // Update the job with payment information
    const updatedJob = await storage.updateJob(jobId, {
      isPaid: true,
      paymentId: paymentIntentId,
      paidAt: new Date(),
    });

    // If the contractor has an account that can receive payments, transfer funds
    if (job.contractorId) {
      const contractor = await storage.getUser(job.contractorId);
      
      if (contractor && contractor.stripeAccountId) {
        // Calculate the amount to transfer (e.g., 95% of the payment)
        const transferAmount = Math.floor(paymentIntent.amount * 0.95);
        
        // Create a transfer to the contractor's Stripe account
        await stripe.transfers.create({
          amount: transferAmount,
          currency: 'usd',
          destination: contractor.stripeAccountId,
          source_transaction: paymentIntentId,
          metadata: {
            jobId: jobId.toString(),
            contractorId: job.contractorId,
          },
        });
      }
    }

    res.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ message: error.message });
  }
});

// Stripe webhook for payment events
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: 'Payment service unavailable' });
    }

    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      return res.status(503).json({ message: 'Webhook service not configured' });
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const jobId = paymentIntent.metadata.jobId;
        
        if (jobId) {
          await storage.updateJob(parseInt(jobId), {
            isPaid: true,
            paymentId: paymentIntent.id,
            paidAt: new Date(),
          });
        }
        break;
        
      case 'payment_intent.payment_failed':
        // Handle failed payment intent
        console.log('Payment failed:', event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;