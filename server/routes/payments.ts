import express from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

const router = express.Router();

// Create Stripe instance with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe Secret Key. Payment functionality will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// Create a payment intent for processing payments
router.post('/create-payment-intent', isAuthenticated, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe integration is not configured' });
    }

    const { jobId, amount } = req.body;

    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }

    // Get the job to verify ownership and status
    const job = await storage.getJob(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only the homeowner can pay for their job
    if (job.homeownerId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized to pay for this job' });
    }

    // Job must be completed to be paid
    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Job must be completed before payment' });
    }

    // Check if the job is already paid
    if (job.isPaid) {
      return res.status(400).json({ message: 'This job has already been paid' });
    }

    // Verify the contractor exists
    if (!job.contractorId) {
      return res.status(400).json({ message: 'No contractor assigned to this job' });
    }

    const contractor = await storage.getUser(job.contractorId);
    if (!contractor) {
      return res.status(400).json({ message: 'Contractor not found' });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      metadata: {
        jobId: jobId.toString(),
        contractorId: job.contractorId,
        homeownerId: job.homeownerId,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment intent' });
  }
});

// Handle successful payments
router.post('/jobs/:id/payment-success', isAuthenticated, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe integration is not configured' });
    }

    const jobId = parseInt(req.params.id);
    const { paymentId } = req.body;

    if (!jobId || !paymentId) {
      return res.status(400).json({ message: 'Job ID and payment ID are required' });
    }

    // Get the job to update
    const job = await storage.getJob(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify the payment intent exists
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment has not been completed' });
    }

    // Update the job as paid
    const updatedJob = await storage.updateJob(jobId, {
      isPaid: true,
      paymentId: paymentId,
      paidAt: new Date(),
    });

    res.json({
      success: true,
      job: updatedJob,
    });
  } catch (error: any) {
    console.error('Error marking job as paid:', error);
    res.status(500).json({ message: error.message || 'Failed to mark job as paid' });
  }
});

// Stripe webhook handler for asynchronous payment events
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: 'Stripe integration is not configured' });
  }

  // For production, you would verify the webhook signature
  // const signature = req.headers['stripe-signature'];
  
  try {
    const event = req.body;

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update the job if metadata contains jobId
        if (paymentIntent.metadata?.jobId) {
          const jobId = parseInt(paymentIntent.metadata.jobId);
          await storage.updateJob(jobId, {
            isPaid: true,
            paymentId: paymentIntent.id,
            paidAt: new Date(),
          });
        }
        break;
        
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;