import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { insertJobSheetSchema } from '@shared/schema';
import { z } from 'zod';
import { sendEmail, generateJobCompletionEmail } from '../email';

const router = Router();

// Get job sheet for a specific job
router.get('/job/:jobId', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const jobId = parseInt(req.params.jobId);
    
    // Check if job exists and if user has access
    const job = await storage.getJob(jobId);
    
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Verify user has access (either as homeowner or contractor)
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      res.status(403).json({ message: 'You do not have permission to access this job sheet' });
      return;
    }
    
    // Get job sheet
    const jobSheet = await storage.getJobSheetByJob(jobId);
    
    if (!jobSheet) {
      res.status(404).json({ message: 'Job sheet not found' });
      return;
    }
    
    res.json(jobSheet);
  } catch (error) {
    console.error('Error fetching job sheet:', error);
    res.status(500).json({ message: 'Error fetching job sheet' });
  }
});

// Get job sheet by ID
router.get('/:id', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const jobSheetId = parseInt(req.params.id);
    
    // Get job sheet
    const jobSheet = await storage.getJobSheet(jobSheetId);
    
    if (!jobSheet) {
      res.status(404).json({ message: 'Job sheet not found' });
      return;
    }
    
    // Get job to check permissions
    const job = await storage.getJob(jobSheet.jobId);
    
    if (!job) {
      res.status(404).json({ message: 'Associated job not found' });
      return;
    }
    
    // Verify user has access (either as homeowner or contractor)
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      res.status(403).json({ message: 'You do not have permission to access this job sheet' });
      return;
    }
    
    res.json(jobSheet);
  } catch (error) {
    console.error('Error fetching job sheet:', error);
    res.status(500).json({ message: 'Error fetching job sheet' });
  }
});

// Create job sheet
router.post('/', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    
    // Validate request body
    const validatedData = insertJobSheetSchema.parse(req.body);
    
    // Check if job exists and if user is the contractor
    const job = await storage.getJob(validatedData.jobId);
    
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Verify user is the contractor for the job
    if (job.contractorId !== userId) {
      res.status(403).json({ message: 'Only the assigned contractor can create a job sheet' });
      return;
    }
    
    // Check if a job sheet already exists
    const existingJobSheet = await storage.getJobSheetByJob(validatedData.jobId);
    
    if (existingJobSheet) {
      res.status(400).json({ 
        message: 'A job sheet already exists for this job. Use PATCH to update it.' 
      });
      return;
    }
    
    // Create job sheet
    const jobSheet = await storage.createJobSheet({
      ...validatedData,
      contractorId: userId,
    });
    
    // Update job status to in_progress if not already completed
    if (job.status !== 'completed') {
      await storage.updateJob(job.id, { status: 'in_progress' });
    }
    
    res.status(201).json(jobSheet);
  } catch (error) {
    console.error('Error creating job sheet:', error);
    res.status(500).json({ message: 'Error creating job sheet' });
  }
});

// Update job sheet
router.patch('/:id', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const jobSheetId = parseInt(req.params.id);
    
    // Get job sheet
    const jobSheet = await storage.getJobSheet(jobSheetId);
    
    if (!jobSheet) {
      res.status(404).json({ message: 'Job sheet not found' });
      return;
    }
    
    // Verify user is the contractor who created the job sheet
    if (jobSheet.contractorId !== userId) {
      res.status(403).json({ message: 'Only the contractor who created the job sheet can update it' });
      return;
    }
    
    // Check if job sheet is already completed
    if (jobSheet.status === 'completed') {
      res.status(400).json({ message: 'Cannot update a completed job sheet' });
      return;
    }
    
    // Update job sheet
    const updatedJobSheet = await storage.updateJobSheet(jobSheetId, req.body);
    
    if (!updatedJobSheet) {
      res.status(404).json({ message: 'Failed to update job sheet' });
      return;
    }
    
    // If status is set to completed, update job status and send email notification
    if (req.body.status === 'completed') {
      const job = await storage.getJob(jobSheet.jobId);
      if (job) {
        await storage.updateJob(jobSheet.jobId, { status: 'completed' });
        
        // Send email notification to homeowner
        try {
          // Get homeowner and contractor details
          const homeowner = await storage.getUser(job.homeownerId);
          const contractor = await storage.getUser(userId);
          
          if (homeowner && homeowner.email && contractor) {
            // Generate job sheet URL
            const jobSheetUrl = `${req.protocol}://${req.get('host')}/job-sheet/${jobSheet.id}`;
            
            // Generate email content
            const emailHtml = generateJobCompletionEmail(
              job.title,
              `${contractor.firstName || ''} ${contractor.lastName || 'Contractor'}`,
              new Date(),
              jobSheetUrl
            );
            
            // Send email
            await sendEmail({
              to: homeowner.email,
              subject: `Job Completed: ${job.title}`,
              html: emailHtml
            });
            
            console.log(`Completion email sent to ${homeowner.email} for job ${job.id}`);
          }
        } catch (emailError) {
          // Log email error but don't fail the request
          console.error('Error sending job completion email:', emailError);
        }
      }
    }
    
    res.json(updatedJobSheet);
  } catch (error) {
    console.error('Error updating job sheet:', error);
    res.status(500).json({ message: 'Error updating job sheet' });
  }
});

// Check in
router.post('/check-in', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const { jobId, checkInLocation } = req.body;
    
    // Validate job ID and location
    if (!jobId || !checkInLocation) {
      res.status(400).json({ message: 'Job ID and check-in location are required' });
      return;
    }
    
    // Get job sheet
    const jobSheet = await storage.getJobSheetByJob(jobId);
    
    if (!jobSheet) {
      res.status(404).json({ message: 'Job sheet not found' });
      return;
    }
    
    // Verify user is the contractor
    if (jobSheet.contractorId !== userId) {
      res.status(403).json({ message: 'Only the assigned contractor can check in' });
      return;
    }
    
    // Update job sheet with check-in
    const updatedJobSheet = await storage.updateJobSheet(jobSheet.id, {
      checkInTime: new Date(),
      checkInLocation,
      status: 'in_progress'
    });
    
    if (!updatedJobSheet) {
      res.status(500).json({ message: 'Failed to update job sheet' });
      return;
    }
    
    res.json(updatedJobSheet);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ message: 'Error checking in' });
  }
});

// Check out
router.post('/check-out', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const { jobId, checkOutLocation, contractorNotes } = req.body;
    
    // Validate job ID and location
    if (!jobId || !checkOutLocation) {
      res.status(400).json({ message: 'Job ID and check-out location are required' });
      return;
    }
    
    // Get job sheet
    const jobSheet = await storage.getJobSheetByJob(jobId);
    
    if (!jobSheet) {
      res.status(404).json({ message: 'Job sheet not found' });
      return;
    }
    
    // Verify user is the contractor
    if (jobSheet.contractorId !== userId) {
      res.status(403).json({ message: 'Only the assigned contractor can check out' });
      return;
    }
    
    // Verify contractor has checked in
    if (!jobSheet.checkInTime) {
      res.status(400).json({ message: 'Must check in before checking out' });
      return;
    }
    
    // Update job sheet with check-out
    const updatedJobSheet = await storage.updateJobSheet(jobSheet.id, {
      checkOutTime: new Date(),
      checkOutLocation,
      contractorNotes,
      status: 'completed'
    });
    
    if (!updatedJobSheet) {
      res.status(500).json({ message: 'Failed to update job sheet' });
      return;
    }
    
    // Update job status
    await storage.updateJob(jobId, { status: 'completed' });
    
    res.json(updatedJobSheet);
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ message: 'Error checking out' });
  }
});

export default router;