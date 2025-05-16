import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertJobSchema, insertReviewSchema, insertMessageSchema, 
  insertQuoteSchema, insertJobSheetSchema, insertScheduleSlotSchema
} from "@shared/schema";
import * as path from "path";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Set up storage for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
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
      
      // Remove passwords
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
      
      // Handle uploaded files
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
      
      const updatedJob = await storage.updateJob(jobId, req.body);
      res.json(updatedJob);
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

  app.get('/api/quotes/job/:jobId', async (req, res) => {
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
      
      const quotes = await storage.getQuotesByJob(jobId);
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
