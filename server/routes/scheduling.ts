import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { insertScheduleSlotSchema, insertAppointmentProposalSchema, insertCalendarIntegrationSchema } from '@shared/schema';

const router = Router();

// Get schedule slots for a contractor
router.get('/schedule-slots', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;

    // Different behavior based on query params
    if (req.query.contractorId) {
      // Get slots for a specific contractor (for homeowners viewing contractor availability)
      const contractorId = req.query.contractorId as string;
      let slots = [];
      
      if (req.query.available === 'true') {
        // Only get available slots
        slots = await storage.getAvailableSlotsByContractor(contractorId);
      } else {
        // Get all slots
        slots = await storage.getScheduleSlotsByContractor(contractorId);
      }
      
      return res.json(slots);
    } else {
      // Get current user's slots if they're a contractor
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'contractor') {
        return res.status(403).json({ message: 'Only contractors can view their own schedule slots' });
      }
      
      const slots = await storage.getScheduleSlotsByContractor(userId);
      return res.json(slots);
    }
  } catch (error) {
    console.error('Error fetching schedule slots:', error);
    res.status(500).json({ message: 'Error fetching schedule slots' });
  }
});

// Get available schedule slots for a contractor
router.get('/schedule-slots/available/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contractorId = req.params.contractorId;
    const slots = await storage.getAvailableSlotsByContractor(contractorId);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching available schedule slots:', error);
    res.status(500).json({ message: 'Error fetching available schedule slots' });
  }
});

// Create a new schedule slot
router.post('/schedule-slots', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    
    // Verify user is a contractor
    const currentUser = await storage.getUser(userId);
    if (currentUser?.role !== 'contractor') {
      return res.status(403).json({ message: 'Only contractors can create schedule slots' });
    }
    
    // Validate request body
    const validatedData = insertScheduleSlotSchema.parse(req.body);
    
    // Create the schedule slot
    const slot = await storage.createScheduleSlot({
      ...validatedData,
      contractorId: userId,
    });
    
    res.status(201).json(slot);
  } catch (error) {
    console.error('Error creating schedule slot:', error);
    res.status(500).json({ message: 'Error creating schedule slot' });
  }
});

// Update a schedule slot
router.patch('/schedule-slots/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the slot to verify ownership
    const slot = await storage.getScheduleSlot(id);
    
    if (!slot) {
      return res.status(404).json({ message: 'Schedule slot not found' });
    }
    
    if (slot.contractorId !== userId) {
      return res.status(403).json({ message: 'You can only update your own schedule slots' });
    }
    
    // Update the slot
    const updatedSlot = await storage.updateScheduleSlot(id, req.body);
    res.json(updatedSlot);
  } catch (error) {
    console.error('Error updating schedule slot:', error);
    res.status(500).json({ message: 'Error updating schedule slot' });
  }
});

// Delete a schedule slot
router.delete('/schedule-slots/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the slot to verify ownership
    const slot = await storage.getScheduleSlot(id);
    
    if (!slot) {
      return res.status(404).json({ message: 'Schedule slot not found' });
    }
    
    if (slot.contractorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own schedule slots' });
    }
    
    // Delete the slot
    await storage.deleteScheduleSlot(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    res.status(500).json({ message: 'Error deleting schedule slot' });
  }
});

// Get appointment proposals for a job or user
router.get('/appointment-proposals', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    
    if (req.query.jobId) {
      // Get appointment proposals for a specific job
      const jobId = parseInt(req.query.jobId as string);
      const proposals = await storage.getAppointmentProposalsByJob(jobId);
      
      // Check if user is authorized to view these proposals (should be either homeowner or contractor for the job)
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      if (job.homeownerId !== userId && job.contractorId !== userId) {
        return res.status(403).json({ message: 'You are not authorized to view these appointment proposals' });
      }
      
      return res.json(proposals);
    } else {
      // Get all appointment proposals for the current user
      const proposals = await storage.getAppointmentProposalsByUser(userId);
      return res.json(proposals);
    }
  } catch (error) {
    console.error('Error fetching appointment proposals:', error);
    res.status(500).json({ message: 'Error fetching appointment proposals' });
  }
});

// Create a new appointment proposal
router.post('/appointment-proposals', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    
    // Validate request body
    const validatedData = insertAppointmentProposalSchema.parse(req.body);
    
    // Check if user is authorized to create a proposal for this job
    const job = await storage.getJob(validatedData.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to create an appointment proposal for this job' });
    }
    
    // Create the appointment proposal
    const proposal = await storage.createAppointmentProposal({
      ...validatedData,
      status: 'pending',
    });
    
    res.status(201).json(proposal);
  } catch (error) {
    console.error('Error creating appointment proposal:', error);
    res.status(500).json({ message: 'Error creating appointment proposal' });
  }
});

// Accept or reject an appointment proposal
router.post('/appointment-proposals/:id/respond', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be either "accepted" or "rejected"' });
    }
    
    // Get the proposal to verify authorization
    const proposal = await storage.getAppointmentProposal(id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Appointment proposal not found' });
    }
    
    // Get the job to check authorization
    const job = await storage.getJob(proposal.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to respond to this appointment proposal' });
    }
    
    // Update the proposal
    const updatedProposal = await storage.updateAppointmentProposal(id, { status });
    
    // If accepted, update the job with the scheduled date
    if (status === 'accepted') {
      await storage.updateJob(job.id, {
        scheduledDate: proposal.proposedTime,
        status: 'scheduled',
      });
    }
    
    res.json(updatedProposal);
  } catch (error) {
    console.error('Error responding to appointment proposal:', error);
    res.status(500).json({ message: 'Error responding to appointment proposal' });
  }
});

// Calendar integration routes

// Get calendar integrations for the current user
router.get('/calendar-integrations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    
    const integrations = await storage.getCalendarIntegrationsByUser(userId);
    res.json(integrations);
  } catch (error) {
    console.error('Error fetching calendar integrations:', error);
    res.status(500).json({ message: 'Error fetching calendar integrations' });
  }
});

// Connect a calendar provider
router.post('/calendar-integrations/connect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const { provider } = req.body;
    
    if (!provider || !['google', 'apple', 'microsoft'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid provider. Must be one of: google, apple, microsoft' });
    }
    
    // For Google Calendar, we'd typically generate an OAuth URL
    if (provider === 'google') {
      // This is a placeholder, in a real app we'd generate an OAuth URL
      const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/calendar&response_type=code`;
      
      return res.json({ authUrl });
    }
    
    // For other providers we might have different flows
    // This is simplified for the demo
    const integration = await storage.createCalendarIntegration({
      userId,
      provider,
      accessToken: 'demo-token',
      refreshToken: 'demo-refresh-token',
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      syncStatus: 'active',
    });
    
    res.status(201).json(integration);
  } catch (error) {
    console.error('Error connecting calendar:', error);
    res.status(500).json({ message: 'Error connecting calendar' });
  }
});

// Update a calendar integration
router.patch('/calendar-integrations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the integration to verify ownership
    const integration = await storage.getCalendarIntegration(id);
    
    if (!integration) {
      return res.status(404).json({ message: 'Calendar integration not found' });
    }
    
    if (integration.userId !== userId) {
      return res.status(403).json({ message: 'You can only update your own calendar integrations' });
    }
    
    // Update the integration
    const updatedIntegration = await storage.updateCalendarIntegration(id, req.body);
    res.json(updatedIntegration);
  } catch (error) {
    console.error('Error updating calendar integration:', error);
    res.status(500).json({ message: 'Error updating calendar integration' });
  }
});

// Delete a calendar integration
router.delete('/calendar-integrations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the integration to verify ownership
    const integration = await storage.getCalendarIntegration(id);
    
    if (!integration) {
      return res.status(404).json({ message: 'Calendar integration not found' });
    }
    
    if (integration.userId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own calendar integrations' });
    }
    
    // Delete the integration
    await storage.deleteCalendarIntegration(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting calendar integration:', error);
    res.status(500).json({ message: 'Error deleting calendar integration' });
  }
});

export default router;