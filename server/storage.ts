import { 
  User, type InsertUser, type UpsertUser,
  Trade, type InsertTrade,
  ContractorTrade, type InsertContractorTrade,
  Job, type InsertJob,
  Quote, type InsertQuote,
  Message, type InsertMessage,
  JobSheet, type InsertJobSheet,
  Review, type InsertReview,
  ScheduleSlot, type InsertScheduleSlot,
  AppointmentProposal, type InsertAppointmentProposal, JobQuoteRequest, InsertJobQuoteRequest,
  CalendarIntegration, type InsertCalendarIntegration,
  RefundRequest, Payment, Refund,
  Notification, type InsertNotification, ContractorPortfolioItem, InsertContractorPortfolioItem
} from "../shared/schema";

// Import contractor profile types from their own file, although we're building the profile in the user type for now
import { ContractorProfile, type InsertContractorProfile } from "../shared/contractorProfile";

import { PrismaClient } from '@prisma/client';

// Interface for storage operations
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getContractorsByTrade(tradeId: number): Promise<User[]>;
  
  // Trades
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrade(id: number): Promise<Trade | undefined>;
  getAllTrades(): Promise<Trade[]>;
  
  // Contractor Trades 
  createContractorTrade(contractorTrade: InsertContractorTrade): Promise<ContractorTrade>;
  getContractorTrades(contractorId: string): Promise<ContractorTrade[]>;
  
  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  getJobsByHomeowner(homeownerId: string): Promise<Job[]>;
  getJobsByContractor(contractorId: string): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  
  // Quotes
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuotesByJob(jobId: number): Promise<Quote[]>;
  getQuotesByContractor(contractorId: string): Promise<Quote[]>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  getQuotesByJobId: (jobId: number) => Promise<Quote[]>;
 acceptQuote(jobId: number, acceptedQuoteId: number): Promise<Job | null>;
  
  // Messages 
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByJob(jobId: number): Promise<Message[]>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  getConversation(jobId: number, user1Id: string, user2Id: string): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Job Sheets
  createJobSheet(jobSheet: InsertJobSheet): Promise<JobSheet>;
  getJobSheet(id: number): Promise<JobSheet | undefined>;
  getJobSheetByJob(jobId: number): Promise<JobSheet | undefined>;
  updateJobSheet(id: number, jobSheet: Partial<JobSheet>): Promise<JobSheet | undefined>;
  
  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByContractor(contractorId: string): Promise<Review[]>;
  getReviewsByHomeowner(homeownerId: string): Promise<Review[]>;
  getReviewByJob(jobId: number): Promise<Review | undefined>;
  
  // Schedule Slots
  createScheduleSlot(slot: InsertScheduleSlot): Promise<ScheduleSlot>;
  getScheduleSlot(id: number): Promise<ScheduleSlot | undefined>;
  getScheduleSlotsByContractor(contractorId: string): Promise<ScheduleSlot[]>;
  getAvailableSlotsByContractor(contractorId: string): Promise<ScheduleSlot[]>;
  updateScheduleSlot(id: number, slot: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined>;
  deleteScheduleSlot(id: number): Promise<void>;
  
  // Appointment Proposals
  createAppointmentProposal(proposal: InsertAppointmentProposal): Promise<AppointmentProposal>;
  getAppointmentProposal(id: number): Promise<AppointmentProposal | undefined>;
  getAppointmentProposalsByJob(jobId: number): Promise<AppointmentProposal[]>;
  getAppointmentProposalsByUser(userId: string): Promise<AppointmentProposal[]>;
  updateAppointmentProposal(id: number, data: Partial<AppointmentProposal>): Promise<AppointmentProposal | undefined>;
  
  // Calendar Integrations
  createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration>;
  getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined>;
  getCalendarIntegrationsByUser(userId: string): Promise<CalendarIntegration[]>;
  updateCalendarIntegration(id: number, data: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: number): Promise<void>;
  
  // Smart Distribution Algorithm
  findMatchingContractors(jobId: number): Promise<User[]>;
  assignContractorToJob(jobId: number, contractorId: string): Promise<Job | undefined>;
}

export interface DatabaseStorage {
  // User methods
  getUser: (id: string) => Promise<User | null>;
  upsertUser: (user: UpsertUser) => Promise<User>;
  updateUser: (id: string, user: Partial<User>) => Promise<User | null>;
  updateUserSubscription(userId: string, subscriptionData: { subscriptionTier?: string, subscriptionEndsAt?: Date, freeRepairsRemaining?: number, lastSubscriptionPayment?: Date }): Promise<User | null>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null>;

  // Job Quote Request methods
  recordQuoteRequest(jobId: number, contractorId: string): Promise<void>;
  
  // Job methods
  createJob: (job: InsertJob) => Promise<Job>;
  getJob: (id: number) => Promise<Job | null>;
  updateJob: (id: number, job: Partial<Job>) => Promise<Job | null>;
  getJobsByHomeowner: (homeownerId: string) => Promise<Job[]>;
  getJobsByContractor: (contractorId: string) => Promise<Job[]>;
  getLastJobByContractor: (contractorId: string) => Promise<Job | null>;
  getJobsByStatus: (status: string) => Promise<Job[]>;
  getAllJobs: () => Promise<Job[]>;
  
  // Trade methods
  createTrade: (trade: InsertTrade) => Promise<Trade>;
  getTrade: (id: number) => Promise<Trade | null>;
  getAllTrades: () => Promise<Trade[]>;
  getContractorsByTrade: (tradeId: number) => Promise<ContractorTrade[]>;
  
  // Review methods
  createReview: (review: InsertReview) => Promise<Review>;
  getReviewsByContractor: (contractorId: string) => Promise<Review[]>;
  getReviewsByHomeowner: (homeownerId: string) => Promise<Review[]>;
  getReviewByJob: (jobId: number) => Promise<Review | null>;

  // Job Sheet methods
  createJobSheet: (jobSheet: InsertJobSheet) => Promise<JobSheet>;
  getJobSheet: (id: number) => Promise<JobSheet | undefined>;
  getJobSheetByJob: (jobId: number) => Promise<JobSheet | undefined>;
  updateJobSheet: (id: number, jobSheet: Partial<JobSheet>) => Promise<JobSheet | undefined>;

  // Contractor Profile methods
  createContractorProfile: (data: InsertContractorProfile) => Promise<ContractorProfile>;
  getContractorProfile: (userId: string) => Promise<ContractorProfile | null>;
  updateContractorProfile: (userId: string, data: Partial<ContractorProfile>) => Promise<ContractorProfile>;
  getContractorProfiles: (filter?: { status?: string }) => Promise<ContractorProfile[]>;
  deleteContractorProfile: (userId: string) => Promise<void>;

  // Contractor Portfolio methods
  
  // Schedule Slot methods
 createQuote: (quote: InsertQuote) => Promise<Quote>;
 getQuotesByJob: (jobId: number) => Promise<Quote[]>;
 getQuotesByJobId: (jobId: number) => Promise<Quote[]>; // Added function
 getQuotesByContractor: (contractorId: string) => Promise<Quote[]>;
 acceptQuote(jobId: number, acceptedQuoteId: number): Promise<Job | null>;
 updateQuote: (id: number, quote: Partial<Quote>) => Promise<Quote | null>;
  createScheduleSlot: (slot: InsertScheduleSlot) => Promise<ScheduleSlot>;
  getScheduleSlot: (id: number) => Promise<ScheduleSlot | null>;
  getScheduleSlotsByContractor: (contractorId: string) => Promise<ScheduleSlot[]>;
  getAvailableSlotsByContractor: (contractorId: string) => Promise<ScheduleSlot[]>;
  updateScheduleSlot: (id: number, slot: Partial<ScheduleSlot>) => Promise<ScheduleSlot | null>;
  deleteScheduleSlot: (id: number) => Promise<void>;

  // Appointment Proposal methods
  createAppointmentProposal: (proposal: InsertAppointmentProposal) => Promise<AppointmentProposal>;
  getAppointmentProposal: (id: number) => Promise<AppointmentProposal | null>;
  getAppointmentProposalsByJob: (jobId: number) => Promise<AppointmentProposal[]>;
  getAppointmentProposalsByUser: (userId: string) => Promise<AppointmentProposal[]>;
  updateAppointmentProposal: (id: number, data: Partial<AppointmentProposal>) => Promise<AppointmentProposal | null>;

  // Calendar Integration methods
  createCalendarIntegration: (integration: InsertCalendarIntegration) => Promise<CalendarIntegration>;
  getCalendarIntegration: (id: number) => Promise<CalendarIntegration | null>;
  getCalendarIntegrationsByUser: (userId: string) => Promise<CalendarIntegration[]>;
  updateCalendarIntegration: (id: number, data: Partial<CalendarIntegration>) => Promise<CalendarIntegration | null>;
  deleteCalendarIntegration: (id: number) => Promise<void>;

  // Payment methods
  getPaymentByJobId: (jobId: number) => Promise<Payment | null>;
  createPayment: (payment: Payment) => Promise<Payment>;
  updatePayment: (id: number, data: Partial<Payment>) => Promise<Payment | null>;
  getPaymentsByDateRange: (startDate: Date, endDate: Date, filter?: { status?: string; contractorId?: string }) => Promise<Payment[]>;

  recordPaymentSuccess(jobId: number, paymentIntentId: string, paymentDetails: any): Promise<void>;
  recordPaymentFailure(jobId: number, paymentIntentId: string, paymentDetails: any): Promise<void>;
  // Refund methods
  createRefundRequest: (request: RefundRequest) => Promise<RefundRequest>;
  getRefundRequest: (id: number) => Promise<RefundRequest | null>;
  updateRefundRequest: (id: number, data: Partial<RefundRequest>) => Promise<RefundRequest | null>;
  getRefundRequestsByJob: (jobId: number) => Promise<RefundRequest[]>;
  getRefundRequestsByUser: (userId: string) => Promise<RefundRequest[]>;
  getRefundsByDateRange: (startDate: Date, endDate: Date, filter?: { contractorId?: string }) => Promise<Refund[]>;
  
  // Notification methods
  createNotification: (notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    read?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) => Promise<Notification>;
  getNotificationsByUser: (userId: string) => Promise<Notification[]>;
  markNotificationAsRead: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;

  // Prisma direct access (for complex queries)
  jobs: PrismaClient['job'];
  payments: PrismaClient['payment'];
  refunds: PrismaClient['refund'];
}

class PrismaDatabaseStorage extends PrismaClient implements DatabaseStorage {
  async recordPaymentSuccess(jobId: number, paymentIntentId: string, paymentDetails: any): Promise<void> {
    await this.job.update({
      where: { id: jobId },
      data: {
        isPaid: true,
        paymentId: paymentIntentId,
        paidAt: new Date(),
        paymentStatus: 'completed',
        paymentInfo: paymentDetails, // Assuming paymentDetails matches the PaymentInfo schema or can be cast
        status: 'in_progress', // Or another appropriate status after payment
      },
    });
  }

  async recordPaymentFailure(jobId: number, paymentIntentId: string, paymentDetails: any): Promise<void> {
    await this.job.update({
      where: { id: jobId },
      data: {
        isPaid: false,
        paymentId: paymentIntentId,
        paidAt: null,
        paymentStatus: 'failed',
        paymentInfo: paymentDetails, // Assuming paymentDetails matches the PaymentInfo schema or can be cast
        // Consider updating the job's main `status` as well, perhaps to indicate a payment issue.
      },
    });
  }


  async acceptQuote(jobId: number, acceptedQuoteId: number): Promise<Job | null> {
    const quoteToAccept = await this.quote.findUnique({
      where: { id: acceptedQuoteId, jobId: jobId },
    });

    if (!quoteToAccept) {
      return null; // Quote not found or doesn't belong to the job
    }

    const updatedJob = await this.job.update({
      where: { id: jobId },
      data: {
        status: 'assigned', // Or 'in progress' or similar
        contractorId: quoteToAccept.contractorId,
      },
    });

    // Optionally, update other quotes for this job to 'rejected'
    await this.quote.updateMany({
      where: { jobId: jobId, id: { not: acceptedQuoteId } },
      data: { status: 'rejected' }, // Assuming you have a status field on Quote
    });

    // Notify accepted contractor
    await this.createNotification({
      userId: quoteToAccept.contractorId,
      type: 'quote_accepted',
      title: 'Quote Accepted!',
      message: 'Your quote for a job has been accepted.',
      data: { jobId: jobId, quoteId: acceptedQuoteId },
    });

    // Notify other contractors whose quotes were not accepted
    const otherQuotes = await this.getQuotesByJobId(jobId);
    for (const otherQuote of otherQuotes) {
      if (otherQuote.id !== acceptedQuoteId) {
        await this.createNotification({
          userId: otherQuote.contractorId,
          type: 'quote_rejected',
          title: 'Quote Not Accepted',
          message: 'Your quote for a job was not accepted.',
          data: { jobId: jobId, quoteId: otherQuote.id },
        });
      }
    }

    return updatedJob;
  }

 // Quotes
 async createQuote(quote: InsertQuote): Promise<Quote> {
    // Check if a quote request exists for this job and contractor
    const quoteRequest = await this.jobQuoteRequest.findFirst({
      where: {
        jobId: quote.jobId,
        contractorId: quote.contractorId,
      },
    });

    if (!quoteRequest) {
      throw new Error("Quote request not found for this job and contractor.");
    }
 const createdQuote = await this.quote.create({ data: quote });

    const job = await this.getJob(createdQuote.jobId);

    if (job && job.homeownerId) {
 await this.createNotification({
 userId: job.homeownerId,
 type: 'quote_submitted',
 title: 'Quote Submitted',
 message: 'A contractor has submitted a quote for your job.',
 data: { jobId: createdQuote.jobId, quoteId: createdQuote.id },
      });
    }
 return createdQuote;
 }

 async getQuotesByJobId(jobId: number): Promise<Quote[]> {
 return this.quote.findMany({ where: { jobId } });
 }

  async updateUserSubscription(userId: string, subscriptionData: { subscriptionTier?: string, subscriptionEndsAt?: Date, freeRepairsRemaining?: number, lastSubscriptionPayment?: Date }): Promise<User | null> {
    return this.user.update({
      where: { id: userId },
      data: subscriptionData,
    });
  }

  async createContractorPortfolioItem(item: InsertContractorPortfolioItem): Promise<ContractorPortfolioItem> {
    return this.contractorPortfolioItem.create({
      data: item,
    });
  }

  async getContractorPortfoliosByContractor(contractorId: string): Promise<ContractorPortfolioItem[]> {
    return this.contractorPortfolioItem.findMany({
      where: { contractorId },
    });
  }

  async updateContractorPortfolioItem(id: number, updates: Partial<ContractorPortfolioItem>): Promise<ContractorPortfolioItem | null> {
    return this.contractorPortfolioItem.update({
      where: { id },
      data: updates,
    });
  }


  async deleteContractorPortfolioItem(id: number): Promise<void> {
  async getContractorProfile(userId: string): Promise<User | null> {
    const contractor = await this.user.findUnique({
      where: { id: userId, role: 'contractor' },
      include: {
        contractorTrades: {
          include: {
            trade: true,
          },
        },
        reviews: {
          include: { homeowner: true },
        },
        // Assuming business details are in the user table for now
        contractorPortfolioItem: true, // Include portfolio items
      },
    });

    if (!contractor) {
      return null;
    }

    // Structure the data for the profile
    const contractorProfile = {
      ...contractor,
      experience: contractor.contractorTrades.map(ct => ({
        trade: ct.trade.name,
        years: ct.yearsExperience,
      })),
      reviews: contractor.reviews, // Use the fetched reviews
      portfolio: contractor.contractorPortfolioItem, // Use the fetched portfolio items
    };

    // Remove sensitive or unnecessary data before returning
    delete (contractorProfile as any).password;
    // Remove contractorTrades as we've extracted experience
    delete (contractorProfile as any).reviews; // Remove the original reviews to use the structured one
    delete (contractorProfile as any).contractorTrades;

    return contractorProfile as unknown as User; // Cast to User for now, might need a dedicated ContractorProfile type later
  }


  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    return this.user.findUnique({
      where: { stripeCustomerId: stripeCustomerId },
    });
  }

  async findContractorsByLocationAndTrade(tradeId: number, latitude: number, longitude: number, userId: string): Promise<User[]> {
    // Define earth radius in meters for distance calculation
    const EARTH_RADIUS_METERS = 6371000;

    // Haversine formula to calculate distance between two points (lat1, lon1) and (lat2, lon2) in meters
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const toRadians = (degrees: number): number => degrees * Math.PI / 180;

        lat1 = toRadians(lat1);
        lon1 = toRadians(lon1);
        lat2 = toRadians(lat2);
        lon2 = toRadians(lon2);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_METERS * c;
    };

    const contractors = await this.user.findMany({
      where: {
        role: 'contractor',
        contractorTrades: {
          some: {
            tradeId: tradeId
          }
        },
        // Filter by location and subscription tier in post-processing for now
        // A more performant solution would use database spatial functions if available
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        contractorTrades: true // Include trades to filter later if needed, though already filtered in where
      }
    });

    return contractors.filter(contractor => {
      if (contractor.latitude === null || contractor.longitude === null) {
        return false; // Exclude contractors without location data
      }

      const distance = haversineDistance(latitude, longitude, contractor.latitude, contractor.longitude);
      const maxRadius = contractor.subscriptionTier === 'premium' ? 1000 : 600; // 1km for premium, 600m for free

      return distance <= maxRadius;
    });
  }

  async recordQuoteRequest(jobId: number, contractorId: string): Promise<void> {
    await this.jobQuoteRequest.create({
      data: {
        jobId,
        contractorId,
      },
    });

    await this.createNotification({
      userId: contractorId,
      type: 'quote_requested',
      title: 'New Quote Request',
      message: 'A homeowner has requested a quote from you.',
      data: { jobId: jobId, contractorId: contractorId },
    });

 async getQuotesByJob(jobId: number): Promise<Quote[]> {
 return this.quote.findMany({ where: { jobId } });
 }

 async getQuotesByContractor(contractorId: string): Promise<Quote[]> {
 return this.quote.findMany({ where: { contractorId } });
 }

  async updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | null> {
    return this.quote.update({
      where: { id },
      data: quote,
    });
  }
  // Add implementations for other methods if needed, or ensure PrismaClient provides them
  // For now, assuming PrismaClient's generated methods cover the rest based on the interface

}

export const storage: DatabaseStorage = new PrismaDatabaseStorage();