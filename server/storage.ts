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
  AppointmentProposal, type InsertAppointmentProposal,
  CalendarIntegration, type InsertCalendarIntegration,
  RefundRequest, Payment, Refund,
  Notification, type InsertNotification
} from "../shared/schema";

// Import contractor profile types from their own file
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

  // Schedule Slot methods
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

export const storage: DatabaseStorage = new PrismaClient();