import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { insertScheduleSlotSchema, insertAppointmentProposalSchema, insertCalendarIntegrationSchema } from '@shared/schema';

const router = Router();

// Get schedule slots for the authenticated contractor
router.get('/schedule-slots', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const slots = await storage.getScheduleSlotsByContractor(userId);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching schedule slots:', error);
    res.status(500).json({ message: 'Error fetching schedule slots' });
  }
});

// Get available slots for a specific contractor
router.get('/schedule-slots/available/:contractorId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { contractorId } = req.params;
    
    const slots = await storage.getAvailableSlotsByContractor(contractorId);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Error fetching available slots' });
  }
});

// Create a new schedule slot
router.post('/schedule-slots', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Validate request body against schema
    const validationResult = insertScheduleSlotSchema.safeParse({
      ...req.body,
      contractorId: userId,
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid slot data', 
        errors: validationResult.error.errors 
      });
    }
    
    // Create the slot in database
    const slot = await storage.createScheduleSlot(validationResult.data);
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
    const userId = user.claims?.sub;
    const slotId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the slot exists and belongs to the user
    const existingSlot = await storage.getScheduleSlot(slotId);
    
    if (!existingSlot) {
      return res.status(404).json({ message: 'Schedule slot not found' });
    }
    
    if (existingSlot.contractorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this slot' });
    }
    
    // Update the slot
    const updatedSlot = await storage.updateScheduleSlot(slotId, req.body);
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
    const userId = user.claims?.sub;
    const slotId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the slot exists and belongs to the user
    const existingSlot = await storage.getScheduleSlot(slotId);
    
    if (!existingSlot) {
      return res.status(404).json({ message: 'Schedule slot not found' });
    }
    
    if (existingSlot.contractorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this slot' });
    }
    
    // Delete the slot
    await storage.deleteScheduleSlot(slotId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    res.status(500).json({ message: 'Error deleting schedule slot' });
  }
});

// Get appointment proposals for the authenticated user
router.get('/appointment-proposals', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get all proposals where the user is involved
    const proposals = await storage.getAppointmentProposalsByUser(userId);
    res.json(proposals);
  } catch (error) {
    console.error('Error fetching appointment proposals:', error);
    res.status(500).json({ message: 'Error fetching appointment proposals' });
  }
});

// Create a new appointment proposal
router.post('/appointment-proposals', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Validate request body against schema
    const validationResult = insertAppointmentProposalSchema.safeParse({
      ...req.body,
      proposerId: userId,
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid proposal data', 
        errors: validationResult.error.errors 
      });
    }
    
    // Check if the job exists
    const job = await storage.getJob(validationResult.data.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the user is the homeowner or the contractor for this job
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to create proposals for this job' });
    }
    
    // Create the proposal in database
    const proposal = await storage.createAppointmentProposal(validationResult.data);
    
    // Return the created proposal
    res.status(201).json(proposal);
  } catch (error) {
    console.error('Error creating appointment proposal:', error);
    res.status(500).json({ message: 'Error creating appointment proposal' });
  }
});

// Respond to an appointment proposal
router.post('/appointment-proposals/:id/respond', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    const proposalId = parseInt(req.params.id);
    const { status, message } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!status || !['accepted', 'rejected', 'countered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Get the proposal
    const proposal = await storage.getAppointmentProposal(proposalId);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Appointment proposal not found' });
    }
    
    // Get the job
    const job = await storage.getJob(proposal.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the user is the homeowner or the contractor for this job
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this proposal' });
    }
    
    // Check that the user is not the one who created the proposal
    if (proposal.proposerId === userId) {
      return res.status(400).json({ message: 'Cannot respond to your own proposal' });
    }
    
    // Update the proposal status
    const updatedProposal = await storage.updateAppointmentProposal(proposalId, { status, message });
    
    // If the proposal was accepted, update the job with the scheduled date
    if (status === 'accepted') {
      await storage.updateJob(job.id, { 
        status: 'scheduled',
        scheduledDate: proposal.startTime
      });
      
      // If there's a slot ID associated with the proposal, update the slot to be booked
      if (proposal.slotId) {
        await storage.updateScheduleSlot(proposal.slotId, {
          isBooked: true,
          jobId: job.id,
          status: 'confirmed'
        });
      }
    }
    
    res.json(updatedProposal);
  } catch (error) {
    console.error('Error responding to appointment proposal:', error);
    res.status(500).json({ message: 'Error responding to appointment proposal' });
  }
});

// Get calendar integrations for the authenticated user
router.get('/calendar-integrations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const integrations = await storage.getCalendarIntegrationsByUser(userId);
    res.json(integrations);
  } catch (error) {
    console.error('Error fetching calendar integrations:', error);
    res.status(500).json({ message: 'Error fetching calendar integrations' });
  }
});

// Connect to external calendar (initiate OAuth flow)
router.post('/calendar-integrations/connect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    const { provider } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!provider || !['google', 'outlook', 'apple'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid provider' });
    }
    
    // For Google and Outlook, we would normally generate an OAuth URL and redirect
    // For this demo, we'll simulate the connection
    
    // Create a new integration record
    const integration = await storage.createCalendarIntegration({
      userId,
      provider,
      accessToken: 'simulated-token',
      refreshToken: 'simulated-refresh-token',
      tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      calendarId: `${provider}-calendar-${userId.substring(0, 8)}`,
      isActive: true
    });
    
    res.json({
      success: true,
      integration
    });
  } catch (error) {
    console.error('Error connecting to external calendar:', error);
    res.status(500).json({ message: 'Error connecting to external calendar' });
  }
});

// Update calendar integration
router.patch('/calendar-integrations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    const integrationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the integration exists and belongs to the user
    const existingIntegration = await storage.getCalendarIntegration(integrationId);
    
    if (!existingIntegration) {
      return res.status(404).json({ message: 'Calendar integration not found' });
    }
    
    if (existingIntegration.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this integration' });
    }
    
    // Update the integration
    const updatedIntegration = await storage.updateCalendarIntegration(integrationId, req.body);
    res.json(updatedIntegration);
  } catch (error) {
    console.error('Error updating calendar integration:', error);
    res.status(500).json({ message: 'Error updating calendar integration' });
  }
});

// Delete calendar integration
router.delete('/calendar-integrations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    const integrationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the integration exists and belongs to the user
    const existingIntegration = await storage.getCalendarIntegration(integrationId);
    
    if (!existingIntegration) {
      return res.status(404).json({ message: 'Calendar integration not found' });
    }
    
    if (existingIntegration.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this integration' });
    }
    
    // Delete the integration
    await storage.deleteCalendarIntegration(integrationId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting calendar integration:', error);
    res.status(500).json({ message: 'Error deleting calendar integration' });
  }
});

export default router;