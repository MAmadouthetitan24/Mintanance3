import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { insertJobSheetSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get job sheet for a specific job
router.get('/job/:jobId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const jobId = parseInt(req.params.jobId);
    
    // Check if job exists and if user has access
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify user has access (either as homeowner or contractor)
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to access this job sheet' });
    }
    
    // Get job sheet
    const jobSheet = await storage.getJobSheetByJob(jobId);
    
    return res.json(jobSheet);
  } catch (error) {
    console.error('Error fetching job sheet:', error);
    res.status(500).json({ message: 'Error fetching job sheet' });
  }
});

// Get job sheet by ID
router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const jobSheetId = parseInt(req.params.id);
    
    // Get job sheet
    const jobSheet = await storage.getJobSheet(jobSheetId);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }
    
    // Get job to check permissions
    const job = await storage.getJob(jobSheet.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Associated job not found' });
    }
    
    // Verify user has access (either as homeowner or contractor)
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to access this job sheet' });
    }
    
    return res.json(jobSheet);
  } catch (error) {
    console.error('Error fetching job sheet:', error);
    res.status(500).json({ message: 'Error fetching job sheet' });
  }
});

// Create job sheet
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    
    // Validate request body
    const validatedData = insertJobSheetSchema.parse(req.body);
    
    // Check if job exists and if user is the contractor
    const job = await storage.getJob(validatedData.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify user is the contractor for the job
    if (job.contractorId !== userId) {
      return res.status(403).json({ message: 'Only the assigned contractor can create a job sheet' });
    }
    
    // Check if a job sheet already exists
    const existingJobSheet = await storage.getJobSheetByJob(validatedData.jobId);
    
    if (existingJobSheet) {
      return res.status(400).json({ 
        message: 'A job sheet already exists for this job. Use PATCH to update it.' 
      });
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
    
    return res.status(201).json(jobSheet);
  } catch (error) {
    console.error('Error creating job sheet:', error);
    res.status(500).json({ message: 'Error creating job sheet' });
  }
});

// Update job sheet
router.patch('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const jobSheetId = parseInt(req.params.id);
    
    // Get job sheet
    const jobSheet = await storage.getJobSheet(jobSheetId);
    
    if (!jobSheet) {
      return res.status(404).json({ message: 'Job sheet not found' });
    }
    
    // Verify user is the contractor who created the job sheet
    if (jobSheet.contractorId !== userId) {
      return res.status(403).json({ message: 'Only the contractor who created the job sheet can update it' });
    }
    
    // Check if job sheet is already completed
    if (jobSheet.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update a completed job sheet' });
    }
    
    // Update job sheet
    const updatedJobSheet = await storage.updateJobSheet(jobSheetId, req.body);
    
    // If status is set to completed, update job status
    if (req.body.status === 'completed') {
      await storage.updateJob(jobSheet.jobId, { status: 'completed' });
    }
    
    return res.json(updatedJobSheet);
  } catch (error) {
    console.error('Error updating job sheet:', error);
    res.status(500).json({ message: 'Error updating job sheet' });
  }
});

// Check in
router.post('/check-in', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const { jobId, checkInLocation } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }
    
    // Check if job exists
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify user is the contractor for the job
    if (job.contractorId !== userId) {
      return res.status(403).json({ message: 'Only the assigned contractor can check in to a job' });
    }
    
    // Get existing job sheet or create one
    let jobSheet = await storage.getJobSheetByJob(jobId);
    
    if (jobSheet) {
      // Update existing job sheet with check-in info
      jobSheet = await storage.updateJobSheet(jobSheet.id, {
        checkInTime: new Date(),
        checkInLocation: checkInLocation || null,
        status: 'in_progress',
      });
    } else {
      // Create new job sheet with check-in info
      jobSheet = await storage.createJobSheet({
        jobId,
        contractorId: userId,
        checkInTime: new Date(),
        checkInLocation: checkInLocation || null,
        status: 'in_progress',
      });
    }
    
    // Update job status
    await storage.updateJob(jobId, { status: 'in_progress' });
    
    return res.json(jobSheet);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ message: 'Error checking in' });
  }
});

// Check out
router.post('/check-out', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const { jobId, checkOutLocation } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }
    
    // Check if job exists
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify user is the contractor for the job
    if (job.contractorId !== userId) {
      return res.status(403).json({ message: 'Only the assigned contractor can check out of a job' });
    }
    
    // Get job sheet
    const jobSheet = await storage.getJobSheetByJob(jobId);
    
    if (!jobSheet) {
      return res.status(400).json({ message: 'Must check in before checking out' });
    }
    
    // Verify contractor has checked in
    if (!jobSheet.checkInTime) {
      return res.status(400).json({ message: 'Must check in before checking out' });
    }
    
    // Update job sheet with check-out info
    const updatedJobSheet = await storage.updateJobSheet(jobSheet.id, {
      checkOutTime: new Date(),
      checkOutLocation: checkOutLocation || null,
    });
    
    return res.json(updatedJobSheet);
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ message: 'Error checking out' });
  }
});

export default router;