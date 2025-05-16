import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

const router = express.Router();

// Initialize Stripe with the API key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe Secret Key. Payment functionality will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// Create a payment intent
router.post('/create-payment-intent', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({ 
        message: 'Payment processing is not configured. Please contact support.' 
      });
    }

    const { jobId, amount } = req.body;

    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }
    
    const user = req.user as any;
    
    // Fetch the job to verify ownership and status
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Only the homeowner can make payments
    if (job.homeownerId !== user.claims.sub) {
      return res.status(403).json({ message: 'Not authorized to make payment for this job' });
    }
    
    // Check if job is already paid
    if (job.isPaid) {
      return res.status(400).json({ message: 'This job has already been paid' });
    }
    
    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: 'usd',
      metadata: {
        jobId: job.id.toString(),
        homeownerId: job.homeownerId,
        contractorId: job.contractorId || '',
      },
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message || 'Error creating payment intent' });
  }
});

// Mark a job as paid after successful payment
router.post('/jobs/:id/payment-success', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const { paymentId } = req.body;
    
    if (!stripe) {
      return res.status(500).json({ message: 'Payment processing is not configured' });
    }
    
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const user = req.user as any;
    
    // Verify the job exists
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Only the homeowner can confirm payments
    if (job.homeownerId !== user.claims.sub) {
      return res.status(403).json({ message: 'Not authorized to confirm payment for this job' });
    }
    
    // Retrieve the payment intent to verify it's successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment has not been completed' });
    }
    
    // Verify this payment was for this job
    if (paymentIntent.metadata.jobId !== job.id.toString()) {
      return res.status(400).json({ message: 'Payment does not match this job' });
    }
    
    // Update the job as paid
    const updatedJob = await storage.updateJob(jobId, {
      isPaid: true,
      paidAt: new Date(),
      paymentId: paymentId
    });
    
    res.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: error.message || 'Error confirming payment' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(500).send('Stripe not configured');
  }

  // Verify webhook signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (webhookSecret) {
      const signature = req.headers['stripe-signature'] as string;
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } else {
      // If webhook secret is not configured, just parse the event
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const jobId = parseInt(paymentIntent.metadata.jobId);
        
        if (jobId) {
          await storage.updateJob(jobId, {
            isPaid: true,
            paidAt: new Date(),
            paymentId: paymentIntent.id
          });
          
          console.log(`Payment for job ${jobId} confirmed via webhook`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).send(`Webhook processing error: ${err.message}`);
  }
});

export default router;