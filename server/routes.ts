import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, registerUserSchema, insertJobSchema, 
  insertReviewSchema, insertMessageSchema, insertQuoteSchema,
  insertJobSheetSchema, insertScheduleSlotSchema
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as crypto from "crypto";
import * as path from "path";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { WebSocketServer } from "ws";

// Initialize session store
const SessionStore = MemoryStore(session);

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

// Password hashing helper function
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
  // Configure session middleware
  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'homeFixrSecret',
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      if (!verifyPassword(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const result = registerUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid registration data', errors: result.error.format() });
      }

      const { username, email, password, role, ...userData } = result.data;

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = hashPassword(password);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role,
        ...userData
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid login data', errors: result.error.format() });
      }

      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message || 'Authentication failed' });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  });

  app.get('/api/auth/session', (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
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
  
  // Set up WebSockets for real-time messaging
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Broadcast message to all clients
        wss.clients.forEach((client) => {
          if (client !== ws) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
