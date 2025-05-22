import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { scheduleSlots, appointmentProposals, calendarIntegrations, type ScheduleSlot, type AppointmentProposal, type CalendarIntegration } from '../../shared/schema';
import { z } from 'zod';

/**
 * TODO: Fix TypeScript errors in this file:
 * 1. Request handler type issues with express middleware
 * 2. AuthenticatedRequest type not being properly recognized
 * 3. Return type issues with response objects
 * 
 * Current workarounds:
 * - Using non-null assertion (!.) for req.user
 * - Using checkAuth middleware to handle authentication
 * - Using any type for response bodies
 * 
 * These issues should be fixed by:
 * 1. Creating proper type definitions for express middleware
 * 2. Extending express Request type correctly
 * 3. Using proper return types for response objects
 */

const router = Router();

// Define the authenticated request type
interface AuthUser {
  id: string;
  claims: {
    sub: string;
  };
}

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// Type guard to check if request is authenticated
const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return req.user !== undefined && 'claims' in (req.user as any) && 'sub' in (req.user as any).claims;
};

// Middleware to ensure request is authenticated
const ensureAuthenticated = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

// Schedule slot schema
const scheduleSlotSchema = z.object({
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  isAvailable: z.boolean(),
  notes: z.string().optional(),
  status: z.string().optional(),
  jobId: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  isBooked: z.boolean().optional(),
  externalCalendarId: z.string().optional(),
  externalCalendarType: z.string().optional(),
});

// Appointment proposal schema
const appointmentProposalSchema = z.object({
  jobId: z.number(),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  message: z.string().optional(),
  slotId: z.number().optional(),
});

type ScheduleSlotType = z.infer<typeof scheduleSlotSchema>;
type AppointmentProposalType = z.infer<typeof appointmentProposalSchema>;

// Register routes
const getScheduleSlotsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;

    // Different behavior based on query params
    if (req.query.contractorId) {
      // Get slots for a specific contractor
      const contractorId = req.query.contractorId as string;
      let slots: ScheduleSlot[] = [];
      
      if (req.query.available === 'true') {
        slots = await storage.getAvailableSlotsByContractor(contractorId);
      } else {
        slots = await storage.getScheduleSlotsByContractor(contractorId);
      }
      
      res.json(slots);
      return;
    }

    // Get current user's slots if they're a contractor
    const currentUser = await storage.getUser(userId);
    
    if (currentUser?.role !== 'contractor') {
      res.status(403).json({ message: 'Only contractors can view their own schedule slots' });
      return;
    }
    
    const slots = await storage.getScheduleSlotsByContractor(userId);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule slots' });
  }
};

const createScheduleSlotHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    
    // Verify user is a contractor
    const currentUser = await storage.getUser(userId);
    if (currentUser?.role !== 'contractor') {
      res.status(403).json({ message: 'Only contractors can create schedule slots' });
      return;
    }
    
    // Validate request body
    const validatedData = scheduleSlotSchema.parse(req.body);
    
    // Create the schedule slot
    const slot = await storage.createScheduleSlot({
      ...validatedData,
      contractorId: userId,
    });
    
    res.status(201).json(slot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Error creating schedule slot' });
  }
};

const updateScheduleSlotHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the slot to verify ownership
    const slot = await storage.getScheduleSlot(id);
    
    if (!slot) {
      res.status(404).json({ message: 'Schedule slot not found' });
      return;
    }
    
    if (slot.contractorId !== userId) {
      res.status(403).json({ message: 'You can only update your own schedule slots' });
      return;
    }
    
    // Validate request body
    const validatedData = scheduleSlotSchema.partial().parse(req.body);
    
    // Update the slot
    const updatedSlot = await storage.updateScheduleSlot(id, validatedData);
    res.json(updatedSlot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Error updating schedule slot' });
  }
};

const deleteScheduleSlotHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the slot to verify ownership
    const slot = await storage.getScheduleSlot(id);
    
    if (!slot) {
      res.status(404).json({ message: 'Schedule slot not found' });
      return;
    }
    
    if (slot.contractorId !== userId) {
      res.status(403).json({ message: 'You can only delete your own schedule slots' });
      return;
    }
    
    // Delete the slot
    await storage.deleteScheduleSlot(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting schedule slot' });
  }
};

router.get('/schedule-slots', isAuthenticated, ensureAuthenticated(getScheduleSlotsHandler));
router.post('/schedule-slots', isAuthenticated, ensureAuthenticated(createScheduleSlotHandler));
router.patch('/schedule-slots/:id', isAuthenticated, ensureAuthenticated(updateScheduleSlotHandler));
router.delete('/schedule-slots/:id', isAuthenticated, ensureAuthenticated(deleteScheduleSlotHandler));

// Get appointment proposals for a job or user
const getAppointmentProposalsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    
    if (req.query.jobId) {
      const jobId = parseInt(req.query.jobId as string);
      const proposals = await storage.getAppointmentProposalsByJob(jobId);
      
      const job = await storage.getJob(jobId);
      
      if (!job) {
        res.status(404).json({ message: 'Job not found' });
        return;
      }
      
      if (job.homeownerId !== userId && job.contractorId !== userId) {
        res.status(403).json({ message: 'You are not authorized to view these appointment proposals' });
        return;
      }
      
      res.json(proposals);
      return;
    }
    
    const proposals = await storage.getAppointmentProposalsByUser(userId);
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment proposals' });
  }
};

const createAppointmentProposalHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    
    // Validate request body
    const validatedData = appointmentProposalSchema.parse(req.body);
    
    // Check if user is authorized to create a proposal for this job
    const job = await storage.getJob(validatedData.jobId);
    
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      res.status(403).json({ message: 'You are not authorized to create an appointment proposal for this job' });
      return;
    }
    
    // Create the appointment proposal with additional required fields
    const proposal = await storage.createAppointmentProposal({
      ...validatedData,
      proposerId: userId,
      status: 'pending',
      message: validatedData.message || null,
      slotId: validatedData.slotId || null
    });
    
    res.status(201).json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      return;
    }
    res.status(500).json({ message: 'Error creating appointment proposal' });
  }
};

const respondToAppointmentProposalHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (status !== 'accepted' && status !== 'rejected') {
      res.status(400).json({ message: 'Status must be either "accepted" or "rejected"' });
      return;
    }
    
    const proposal = await storage.getAppointmentProposal(id);
    
    if (!proposal) {
      res.status(404).json({ message: 'Appointment proposal not found' });
      return;
    }
    
    const job = await storage.getJob(proposal.jobId);
    
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    if (job.homeownerId !== userId && job.contractorId !== userId) {
      res.status(403).json({ message: 'You are not authorized to respond to this appointment proposal' });
      return;
    }
    
    const updatedProposal = await storage.updateAppointmentProposal(id, { status });
    
    if (status === 'accepted') {
      await storage.updateJob(job.id, {
        scheduledDate: proposal.startTime,
        status: 'scheduled',
      });
    }
    
    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ message: 'Error responding to appointment proposal' });
  }
};

// Calendar integration routes

// Get calendar integrations for the current user
const getCalendarIntegrationsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    
    const integrations = await storage.getCalendarIntegrationsByUser(userId);
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calendar integrations' });
  }
};

// Connect a calendar provider
const createCalendarIntegrationHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const { provider } = req.body;
    
    if (!provider || !['google', 'apple', 'microsoft'].includes(provider)) {
      res.status(400).json({ message: 'Invalid provider. Must be one of: google, apple, microsoft' });
      return;
    }
    
    const integration = await storage.createCalendarIntegration({
      userId,
      provider,
      accessToken: 'demo-token',
      refreshToken: 'demo-refresh-token',
      tokenExpiry: new Date(Date.now() + 3600 * 1000),
      isActive: true,
    });
    
    res.status(201).json(integration);
  } catch (error) {
    res.status(500).json({ message: 'Error creating calendar integration' });
  }
};

// Update a calendar integration
const updateCalendarIntegrationHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the integration to verify ownership
    const integration = await storage.getCalendarIntegration(id);
    
    if (!integration) {
      res.status(404).json({ message: 'Calendar integration not found' });
      return;
    }
    
    if (integration.userId !== userId) {
      res.status(403).json({ message: 'You can only update your own calendar integrations' });
      return;
    }
    
    // Update the integration
    const updatedIntegration = await storage.updateCalendarIntegration(id, req.body);
    res.json(updatedIntegration);
  } catch (error) {
    res.status(500).json({ message: 'Error updating calendar integration' });
  }
};

// Delete a calendar integration
const deleteCalendarIntegrationHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    
    // Get the integration to verify ownership
    const integration = await storage.getCalendarIntegration(id);
    
    if (!integration) {
      res.status(404).json({ message: 'Calendar integration not found' });
      return;
    }
    
    if (integration.userId !== userId) {
      res.status(403).json({ message: 'You can only delete your own calendar integrations' });
      return;
    }
    
    // Delete the integration
    await storage.deleteCalendarIntegration(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting calendar integration' });
  }
};

// Register appointment proposal routes
router.get('/appointment-proposals', isAuthenticated, ensureAuthenticated(getAppointmentProposalsHandler));
router.post('/appointment-proposals', isAuthenticated, ensureAuthenticated(createAppointmentProposalHandler));
router.post('/appointment-proposals/:id/respond', isAuthenticated, ensureAuthenticated(respondToAppointmentProposalHandler));

// Register calendar integration routes
router.get('/calendar-integrations', isAuthenticated, ensureAuthenticated(getCalendarIntegrationsHandler));
router.post('/calendar-integrations/connect', isAuthenticated, ensureAuthenticated(createCalendarIntegrationHandler));
router.patch('/calendar-integrations/:id', isAuthenticated, ensureAuthenticated(updateCalendarIntegrationHandler));
router.delete('/calendar-integrations/:id', isAuthenticated, ensureAuthenticated(deleteCalendarIntegrationHandler));

export default router;