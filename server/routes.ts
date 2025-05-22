import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertJobSchema, insertReviewSchema, insertMessageSchema, 
  insertQuoteSchema, insertJobSheetSchema, insertScheduleSlotSchema,
  insertAppointmentProposalSchema, insertCalendarIntegrationSchema
} from "@shared/schema";
import * as path from "path";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import Stripe from "stripe";
import dotenv from "dotenv";
import { setupAuth, isAuthenticated } from "./replitAuth";
import schedulingRoutes from "./routes/scheduling";
import jobSheetsRoutes from "./routes/job-sheets";
import paymentsRoutes from "./routes/payments";

// Set up storage for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: \'2023-10-16\' });
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and GIF files are allowed"));
    }
    cb(null, true);
  }
});

// Note: These password functions are no longer needed with Replit Auth
// But keeping them for reference in case we need to implement custom auth later
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === computedHash;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit Auth middleware
  await setupAuth(app);

  // Register scheduling routes
  app.use('/api', schedulingRoutes);
  
  // Register job sheets routes
  app.use('/api', jobSheetsRoutes);
  
  // Register payment routes
  app.use('/api', paymentsRoutes);

  // Subscription routes
  app.post('/api/subscriptions/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, planId } = req.body; // planId would map to a Stripe Price ID

      if (!userId || !planId) {
        return res.status(400).json({ message: 'User ID and Plan ID are required' });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if they don't exist
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          metadata: {
            userId: user.id,
          },
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId });
      }

      // Create a checkout session for a subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: planId, // Use the Stripe Price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer: stripeCustomerId,
        success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`, // Redirect to success page
        cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`, // Redirect to cancel page
        metadata: {
            userId: userId,
            planId: planId,
        }
      });

      res.json({ url: session.url }); // Send the Checkout Session URL to the client

    } catch (error) {
      console.error('Error initiating subscription:', error);
      res.status(500).json({ message: 'Error initiating subscription' });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = (req as any).rawBody; // Access the raw body
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!; // Get your webhook secret from environment variables
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    const data = event.data;
    const eventType = event.type;

    switch (event.type) {
      case 'checkout.session.completed':
        const session = data.object as Stripe.Checkout.Session;
        // Fulfill the purchase...
        console.log(`Checkout session completed for customer ${session.customer}`);
        // Retrieve user and update subscription status (if applicable, e.g., for initial subscription)
        if (session.customer && session.subscription) {
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateUserSubscription(user.id, { stripeSubscriptionId: subscriptionId });
            console.log(`User ${user.id} linked to subscription ${subscriptionId}`);
            // Further updates for subscription tier/end date will come from invoice.payment_succeeded
          }
        }
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${failedPaymentIntent.id} failed.`);
        const failedJobId = failedPaymentIntent.metadata.jobId;
        if (failedJobId) {
          try {
            // Call a storage function to update the job status and record failure details
            await storage.recordPaymentFailure(parseInt(failedJobId), failedPaymentIntent.id, failedPaymentIntent.last_payment_error?.message);
          } catch (storageError) {
            console.error('Error recording payment failure in storage:', storageError);
          }
        }
        break;
      case 'invoice.payment_succeeded':
        const invoice = data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;
        const periodEnd = invoice.lines.data[0].period.end; // Assuming single subscription item

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          await storage.updateUserSubscription(user.id, { subscriptionEndsAt: new Date(periodEnd * 1000) });
          console.log(`User ${user.id} subscription updated to end at ${new Date(periodEnd * 1000)}`);
        }
      case 'customer.subscription.created':
      case 'payment_intent.succeeded':
        const paymentIntent = data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${paymentIntent.id} succeeded.`);
        // Extract relevant data from metadata
        const { jobId: metadataJobId, acceptedQuoteId: metadataAcceptedQuoteId, contractorId: metadataContractorId, homeownerId: metadataHomeownerId } = paymentIntent.metadata;

        if (metadataJobId && metadataAcceptedQuoteId) {
          try {
            // Call a storage function to update the job and record payment details
            // You'll need to create this function in server/storage.ts
            await storage.recordPaymentSuccess(
              parseInt(metadataJobId),
              paymentIntent.id,
              paymentIntent.amount,
              paymentIntent.currency,
              'succeeded', // Payment status
              paymentIntent.last_payment_error?.message // Include error message if any
            );
            console.log(`Job ${metadataJobId} payment recorded.`);
          } catch (storageError) {
            console.error('Error recording payment success in storage:', storageError);
          }
        }
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        // Update user's subscription status in the database
        await storage.updateUserSubscription(subscription);
        console.log(`Subscription updated for customer ${subscription.customer}`);
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        // Update user's subscription status to 'free' or inactive in the database
        const userToDeleteSub = await storage.getUserByStripeCustomerId(deletedSubscription.customer as string);
        if (userToDeleteSub) {
          await storage.updateUserSubscription(userToDeleteSub.id, { subscriptionTier: 'free', stripeSubscriptionId: null, subscriptionEndsAt: null });
          console.log(`User ${userToDeleteSub.id} subscription cancelled.`);
        }
        console.log(`Subscription deleted for customer ${deletedSubscription.customer}`);
        break;
      // Handle other events like invoice.payment_succeeded, etc.
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });
  
  // Authentication routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error fetching user details' });
    }
  });
  
  // Trade routes
  app.get('/api/trades', async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      res.status(500).json({ message: 'Error fetching trades' });
    }
  });

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error fetching user' });
    }
  });

  app.get('/api/contractors/by-trade/:tradeId', async (req, res) => {
    try {
      const contractors = await storage.getContractorsByTrade(parseInt(req.params.tradeId));
      
      // Remove passwords (Note: Replit Auth handles auth, password field might not be used but good practice)
      const contractorsWithoutPasswords = contractors.map(c => {
        const { password, ...withoutPassword } = c;
        return withoutPassword;
      });
      
      res.json(contractorsWithoutPasswords);
    } catch (error) {
      console.error('Error fetching contractors by trade:', error);
      res.status(500).json({ message: 'Error fetching contractors' });
    }
  });

  // Contractor search route (Tinder-like)
  app.get('/api/contractors/search', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const { tradeId, latitude, longitude, radius } = req.query;

      if (!tradeId || !latitude || !longitude) {
        return res.status(400).json({ message: 'tradeId, latitude, and longitude are required' });
      }

      const searchRadius = radius ? parseInt(radius) : 600; // Default to 600m

      const contractors = await storage.findContractorsByLocationAndTrade(
        parseInt(tradeId),
        parseFloat(latitude),
        parseFloat(longitude),
        searchRadius
      );

      // Map contractors for the card view
      const contractorCards = contractors.map(contractor => ({
        id: contractor.id,
        firstName: contractor.firstName,
        lastName: contractor.lastName,
        profileImageUrl: contractor.profileImageUrl,
        // Add other fields needed for the Tinder card view
      }));
      
      res.json(contractorCards);
    } catch (error) {
      console.error('Error searching contractors:', error);
      res.status(500).json({ message: 'Error searching contractors' });
    }
  });

  // Job routes
  app.post('/api/jobs', upload.array('photos', 5), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      if (user.role !== 'homeowner') {
        return res.status(403).json({ message: 'Only homeowners can create job requests' });
      }
      
      // Handle uploaded files (assuming file handling is correctly set up)
      const photos = (req.files as Express.Multer.File[])?.map(file => `/uploads/${file.filename}`) || [];
      
      // Parse job data
      const jobData = {
        ...req.body,
        homeownerId: user.id,
        photos
      };
      
      const result = insertJobSchema.safeParse(jobData);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid job data', errors: result.error.format() });
      }
      
      const job = await storage.createJob(result.data);
      
      // Find matching contractors
      const matchingContractors = await storage.findMatchingContractors(job.id);
      
      res.status(201).json({ job, matchingContractorsCount: matchingContractors.length });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ message: 'Error creating job' });
    }
  });

  app.get('/api/jobs', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      let jobs;
      
      if (user.role === 'homeowner') {
        jobs = await storage.getJobsByHomeowner(user.id);
      } else if (user.role === 'contractor') {
        jobs = await storage.getJobsByContractor(user.id);
      } else {
        return res.status(403).json({ message: 'Invalid user role' });
      }
      
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Error fetching jobs' });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const job = await storage.getJob(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: 'Error fetching job' });
    }
  });

  app.patch('/api/jobs/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check authorization
      const user = req.user as any;
      if (user.role === 'homeowner' && job.homeownerId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update this job' });
      }
      
      if (user.role === 'contractor' && job.contractorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update this job' });
      }
      
      // Handle quote request from homeowner
      if (user.role === 'homeowner' && req.body.requestQuote === true && req.body.contractorId) {
        const contractorId = req.body.contractorId;
        
        // Verify the specified contractor exists
        const contractor = await storage.getUser(contractorId);
        if (!contractor || contractor.role !== 'contractor') {
          return res.status(400).json({ message: 'Invalid contractor specified for quote request' });
        }
        
        // Record the quote request
        // TODO: Implement storage.recordQuoteRequest function
        // await storage.recordQuoteRequest(jobId, contractorId);
        
        // Consider sending a real-time notification to the contractor
        // Example: sendNotification(contractorId, { type: 'quote_request', jobId: jobId, message: `You have a new quote request for job: ${job.title}` });
        
        // Return a success response for the quote request
        return res.json({ message: 'Quote request sent successfully' });
      }
      
      // Handle quote acceptance from homeowner
      if (user.role === 'homeowner' && req.body.acceptedQuoteId) {
        const acceptedQuoteId = parseInt(req.body.acceptedQuoteId);
        
        // Verify that the acceptedQuoteId is valid and corresponds to a quote for this job
        const acceptedQuote = await storage.getQuote(acceptedQuoteId); // Assuming a getQuote function exists
        if (!acceptedQuote || acceptedQuote.jobId !== jobId) {
          return res.status(400).json({ message: 'Invalid quote specified for acceptance' });
        }
        
        // Call the storage function to accept the quote
        const updatedJob = await storage.acceptQuote(jobId, acceptedQuoteId);

        if (!updatedJob) {
          return res.status(400).json({ message: 'Failed to accept quote' });
        }
        
        try {
          // Fetch the accepted quote again to get amount and currency
          const quoteForPayment = await storage.getQuote(acceptedQuoteId); // Assuming getQuote exists

          if (!quoteForPayment) {
            // This should not happen if acceptQuote succeeded, but as a safeguard
             console.error(`Accepted quote ${acceptedQuoteId} not found for payment intent.`);
          } else {
            // TODO: Ensure quote has amount and currency fields in the database and schema
            const amountInSmallestUnit = Math.round(quoteForPayment.amount * 100); // Convert to cents
            const currency = quoteForPayment.currency || 'usd'; // Default to USD if not in quote table

            // Create a Stripe Payment Intent
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amountInSmallestUnit,
              currency: currency,
              description: `Payment for Job ID: ${jobId}, Quote ID: ${acceptedQuoteId}`,
              metadata: {
                jobId: jobId,
                acceptedQuoteId: acceptedQuoteId,
                contractorId: acceptedQuote.contractorId,
                homeownerId: user.id
              },
            });

            // TODO: Send notifications to the accepted contractor and other bidders

            // Return the client secret to the frontend for payment confirmation
            return res.json({
              message: 'Quote accepted, payment initiation required',
              job: updatedJob,
              clientSecret: paymentIntent.client_secret,
            });
          }
        } catch (stripeError) {
          console.error('Error creating Stripe Payment Intent:', stripeError);
          // Optionally revert the job status or handle this failure appropriately
          return res.status(500).json({ message: 'Error initiating payment for accepted quote' });
        }
      }


      // Existing logic for other job updates
      // Ensure req.body doesn't contain requestQuote or contractorId if not a quote request
      delete req.body.requestQuote;
      delete req.body.contractorId;
      const updatedJob = await storage.updateJob(jobId, req.body);
      res.status(200).json(updatedJob);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ message: 'Error updating job' });
    }
  });

  // Quote routes
  app.post('/api/quotes', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      if (user.role !== 'contractor') {
        return res.status(403).json({ message: 'Only contractors can submit quotes' });
      }
      
      const quoteData = {
        ...req.body,
        contractorId: user.id
      };
      
      const result = insertQuoteSchema.safeParse(quoteData);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid quote data', errors: result.error.format() });
      }
      
      const quote = await storage.createQuote(result.data);
      res.status(201).json(quote);
    } catch (error) {
      console.error('Error creating quote:', error);
      res.status(500).json({ message: 'Error creating quote' });
    }
  });

  app.get('/api/jobs/:jobId/quotes', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check authorization
      const user = req.user as any;
      if (user.role === 'homeowner' && job.homeownerId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to view quotes for this job' });
      }
      
      const quotes = await storage.getQuotesByJobId(jobId); // Use the new function
      res.json(quotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ message: 'Error fetching quotes' });
    }
  });

  // Contractor matching
  app.post('/api/jobs/:id/assign/:contractorId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      const jobId = parseInt(req.params.id);
      const contractorId = parseInt(req.params.contractorId);
      
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check authorization
      if (user.role === 'homeowner' && job.homeownerId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to assign a contractor to this job' });
      }
      
      // Only allow assignment for pending jobs
      if (job.status !== 'pending') {
        return res.status(400).json({ message: 'Can only assign a contractor to pending jobs' });
      }
      
      const updatedJob = await storage.assignContractorToJob(jobId, contractorId);
      
      if (!updatedJob) {
        return res.status(400).json({ message: 'Failed to assign contractor' });
      }
      
      res.json(updatedJob);
    } catch (error) {
      console.error('Error assigning contractor:', error);
      res.status(500).json({ message: 'Error assigning contractor' });
    }
  });

  // Message routes
  app.post('/api/messages', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      
      const messageData = {
        ...req.body,
        senderId: user.id
      };
      
      const result = insertMessageSchema.safeParse(messageData);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid message data', errors: result.error.format() });
      }
      
      // Check if the job exists
      const job = await storage.getJob(result.data.jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Verify the user is part of this job conversation
      if (job.homeownerId !== user.id && job.contractorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to send messages for this job' });
      }
      
      const message = await storage.createMessage(result.data);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  });

  app.get('/api/messages/job/:jobId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      const jobId = parseInt(req.params.jobId);
      
      // Check if the job exists
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Verify the user is part of this job conversation
      if (job.homeownerId !== user.id && job.contractorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to view messages for this job' });
      }
      
      const messages = await storage.getMessagesByJob(jobId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  // Smart Matching Algorithm routes
  app.get('/api/jobs/:jobId/matching-contractors', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const jobId = parseInt(req.params.jobId);
      
      // Verify the job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Only the homeowner who created the job can see matching contractors
      if (job.homeownerId !== user.claims.sub && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view matching contractors for this job' });
      }
      
      // Find matching contractors using our smart algorithm
      const matchingContractors = await storage.findMatchingContractors(jobId);
      
      // Only return essential information about contractors to protect privacy
      const contractorProfiles = matchingContractors.map(contractor => ({
        id: contractor.id,
        firstName: contractor.firstName,
        lastName: contractor.lastName,
        profileImageUrl: contractor.profileImageUrl,
        averageRating: contractor.averageRating,
        reviewCount: contractor.reviewCount,
        city: contractor.city,
        state: contractor.state
      }));
      
      res.json(contractorProfiles);
    } catch (error) {
      console.error('Error finding matching contractors:', error);
      res.status(500).json({ message: 'Error finding matching contractors' });
    }
  });
  
  // Assign contractor to job
  app.post('/api/jobs/:jobId/assign', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const jobId = parseInt(req.params.jobId);
      const { contractorId } = req.body;
      
      if (!contractorId) {
        return res.status(400).json({ message: 'Contractor ID is required' });
      }
      
      // Verify the job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Only the homeowner who created the job can assign contractors
      if (job.homeownerId !== user.claims.sub && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to assign contractors to this job' });
      }
      
      // Check if job already has a contractor
      if (job.contractorId) {
        return res.status(400).json({ message: 'This job already has an assigned contractor' });
      }
      
      // Assign the contractor to the job
      const updatedJob = await storage.assignContractorToJob(jobId, contractorId);
      
      // Get contractor details to personalize the notification
      const contractor = await storage.getUser(contractorId);
      
      // Get homeowner details
      const homeowner = await storage.getUser(job.homeownerId);
      
      // Send real-time notification to the contractor
      const notificationSent = sendNotification(contractorId, {
        type: 'new_job_match',
        jobId: updatedJob?.id,
        title: updatedJob?.title,
        description: updatedJob?.description,
        location: updatedJob?.location || updatedJob?.address,
        homeownerName: homeowner ? `${homeowner.firstName || ''} ${homeowner.lastName || ''}`.trim() : 'A homeowner',
        message: `You've been matched with a new job: ${updatedJob?.title}`,
        timestamp: new Date().toISOString()
      });
      
      // Return the updated job with notification status
      res.json({
        job: updatedJob,
        notificationSent,
        message: 'Contractor successfully assigned to job'
      });
    } catch (error) {
      console.error('Error assigning contractor to job:', error);
      res.status(500).json({ message: 'Error assigning contractor to job' });
    }
  });

  // Contractor profile route
  app.get('/api/contractors/:id/profile', async (req, res) => {
    try {
      const contractorId = parseInt(req.params.id);

      // Get contractor details
      const contractor = await storage.getUser(contractorId);

      if (!contractor || contractor.role !== 'contractor') {
        return res.status(404).json({ message: 'Contractor not found' });
      }

      // Get reviews for the contractor
      const reviews = await storage.getReviewsByContractor(contractorId);

      // TODO: Fetch and include portfolio data here
      const portfolio = []; // Placeholder for portfolio data

      res.json({ ...contractor, reviews, portfolio });
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
      res.status(500).json({ message: 'Error fetching contractor profile' });
    }
  });

  // Job Sheet routes
  app.post('/api/job-sheets', upload.array('photos', 10), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      
      if (user.role !== 'contractor') {
        return res.status(403).json({ message: 'Only contractors can create job sheets' });
      }
      
      // Handle uploaded files
      const photos = (req.files as Express.Multer.File[])?.map(file => `/uploads/${file.filename}`) || [];
      
      const jobSheetData = {
        ...req.body,
        photos
      };
      
      const result = insertJobSheetSchema.safeParse(jobSheetData);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid job sheet data', errors: result.error.format() });
      }
      
      // Check if the job exists and belongs to this contractor
      const job = await storage.getJob(result.data.jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      if (job.contractorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to create a job sheet for this job' });
      }
      
      // Check if a job sheet already exists
      const existingSheet = await storage.getJobSheetByJob(job.id);
      
      if (existingSheet) {
        return res.status(400).json({ message: 'A job sheet already exists for this job' });
      }
      
      const jobSheet = await storage.createJobSheet(result.data);
      
      // Update job status to in_progress
      await storage.updateJob(job.id, { status: 'in_progress' });
      
      res.status(201).json(jobSheet);
    } catch (error) {
      console.error('Error creating job sheet:', error);
      res.status(500).json({ message: 'Error creating job sheet' });
    }
  });

  app.get('/api/job-sheets/job/:jobId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      const jobId = parseInt(req.params.jobId);
      
      // Check if the job exists
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Verify the user is part of this job
      if (job.homeownerId !== user.id && job.contractorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to view job sheet for this job' });
      }
      
      const jobSheet = await storage.getJobSheetByJob(jobId);
      
      if (!jobSheet) {
        return res.status(404).json({ message: 'Job sheet not found' });
      }
      
      res.json(jobSheet);
    } catch (error) {
      console.error('Error fetching job sheet:', error);
      res.status(500).json({ message: 'Error fetching job sheet' });
    }
  });

  app.patch('/api/job-sheets/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      const id = parseInt(req.params.id);
      
      const jobSheet = await storage.getJobSheet(id);
      
      if (!jobSheet) {
        return res.status(404).json({ message: 'Job sheet not found' });
      }
      
      // Check if the job exists
      const job = await storage.getJob(jobSheet.jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Associated job not found' });
      }
      
      // Verify the user is part of this job
      if (job.homeownerId !== user.id && job.contractorId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update job sheet for this job' });
      }
      
      // Handle digital signature
      if (req.body.homeownerSignature && user.role === 'homeowner') {
        // If homeowner submits signature, mark job as completed
        await storage.updateJob(job.id, { status: 'completed' });
      }
      
      const updatedJobSheet = await storage.updateJobSheet(id, req.body);
      res.json(updatedJobSheet);
    } catch (error) {
      console.error('Error updating job sheet:', error);
      res.status(500).json({ message: 'Error updating job sheet' });
    }
  });

  // Review routes
  app.post('/api/reviews', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      
      if (user.role !== 'homeowner') {
        return res.status(403).json({ message: 'Only homeowners can submit reviews' });
      }
      
      const reviewData = {
        ...req.body,
        homeownerId: user.id
      };
      
      const result = insertReviewSchema.safeParse(reviewData);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid review data', errors: result.error.format() });
      }
      
      // Check if the job exists and is completed
      const job = await storage.getJob(result.data.jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      if (job.homeownerId !== user.id) {
        return res.status(403).json({ message: 'You can only review your own jobs' });
      }
      
      if (job.status !== 'completed') {
        return res.status(400).json({ message: 'Can only review completed jobs' });
      }
      
      // Check if a review already exists
      const existingReview = await storage.getReviewByJob(job.id);
      
      if (existingReview) {
        return res.status(400).json({ message: 'A review already exists for this job' });
      }
      
      const review = await storage.createReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Error creating review' });
    }
  });

  app.get('/api/reviews/contractor/:contractorId', async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      
      // Check if the contractor exists
      const contractor = await storage.getUser(contractorId);
      
      if (!contractor || contractor.role !== 'contractor') {
        return res.status(404).json({ message: 'Contractor not found' });
      }
      
      const reviews = await storage.getReviewsByContractor(contractorId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Error fetching reviews' });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      // Assume req.user.id contains the current user's ID from authentication middleware
      const userId = req.user.id; // Adjust based on how your auth middleware provides user ID

      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  });

  // Schedule routes
  app.post('/api/schedule-slots', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      
      if (user.role !== 'contractor') {
        return res.status(403).json({ message: 'Only contractors can create schedule slots' });
      }
      
      const slotData = {
        ...req.body,
        contractorId: user.id
      };
      
      const result = insertScheduleSlotSchema.safeParse(slotData);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid schedule slot data', errors: result.error.format() });
      }
      
      const slot = await storage.createScheduleSlot(result.data);
      res.status(201).json(slot);
    } catch (error) {
      console.error('Error creating schedule slot:', error);
      res.status(500).json({ message: 'Error creating schedule slot' });
    }
  });

  app.get('/api/schedule-slots/contractor/:contractorId', async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      
      // Check if the contractor exists
      const contractor = await storage.getUser(contractorId);
      
      if (!contractor || contractor.role !== 'contractor') {
        return res.status(404).json({ message: 'Contractor not found' });
      }
      
      const slots = await storage.getScheduleSlotsByContractor(contractorId);
      res.json(slots);
    } catch (error) {
      console.error('Error fetching schedule slots:', error);
      res.status(500).json({ message: 'Error fetching schedule slots' });
    }
  });

  app.get('/api/schedule-slots/available/contractor/:contractorId', async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      
      // Check if the contractor exists
      const contractor = await storage.getUser(contractorId);
      
      if (!contractor || contractor.role !== 'contractor') {
        return res.status(404).json({ message: 'Contractor not found' });
      }
      
      const slots = await storage.getAvailableSlotsByContractor(contractorId);
      res.json(slots);
    } catch (error) {
      console.error('Error fetching available schedule slots:', error);
      res.status(500).json({ message: 'Error fetching available schedule slots' });
    }
  });

  app.patch('/api/schedule-slots/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = req.user as any;
      const id = parseInt(req.params.id);
      
      const slot = await storage.updateScheduleSlot(id, req.body);
      
      if (!slot) {
        return res.status(404).json({ message: 'Schedule slot not found' });
      }
      
      res.json(slot);
    } catch (error) {
      console.error('Error updating schedule slot:', error);
      res.status(500).json({ message: 'Error updating schedule slot' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSockets for real-time messaging and notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store client connections with user IDs for targeted notifications
  const clients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    let userId: string | null = null;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'auth':
            // Authenticate and associate the connection with a user ID
            if (data.userId) {
              userId = data.userId;
              clients.set(userId, ws);
              console.log(`User ${userId} authenticated for notifications`);
              
              // Confirm authentication
              ws.send(JSON.stringify({
                type: 'auth_success',
                message: 'Successfully authenticated for notifications'
              }));
            }
            break;
            
          case 'chat':
            // Forward chat message to the recipient if online
            if (data.recipientId && data.senderId && data.jobId) {
              const recipient = clients.get(data.recipientId);
              if (recipient && recipient.readyState === WebSocket.OPEN) {
                recipient.send(JSON.stringify({
                  type: 'chat',
                  senderId: data.senderId,
                  senderName: data.senderName,
                  jobId: data.jobId,
                  message: data.message,
                  timestamp: new Date().toISOString()
                }));
              }
            } else {
              // Fallback to broadcasting to all connected clients
              wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(data));
                }
              });
            }
            break;
            
          default:
            // Broadcast other messages to all clients (legacy behavior)
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
              }
            });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (userId) {
        clients.delete(userId);
      }
    });
  });
  
  // Helper function to send notifications via WebSocket
  const sendNotification = (userId: string, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
      return true;
    }
    return false;
  };

  return httpServer;
}
