import { 
  users, type User, type InsertUser, type UpsertUser,
  trades, type Trade, type InsertTrade,
  contractorTrades, type ContractorTrade, type InsertContractorTrade,
  jobs, type Job, type InsertJob,
  quotes, type Quote, type InsertQuote,
  messages, type Message, type InsertMessage,
  jobSheets, type JobSheet, type InsertJobSheet,
  reviews, type Review, type InsertReview,
  scheduleSlots, type ScheduleSlot, type InsertScheduleSlot
} from "@shared/schema";

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
  getScheduleSlotsByContractor(contractorId: string): Promise<ScheduleSlot[]>;
  getAvailableSlotsByContractor(contractorId: string): Promise<ScheduleSlot[]>;
  updateScheduleSlot(id: number, slot: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined>;
  
  // Smart Distribution Algorithm
  findMatchingContractors(jobId: number): Promise<User[]>;
  assignContractorToJob(jobId: number, contractorId: string): Promise<Job | undefined>;
}

import { DatabaseStorage } from "./dbStorage";

// Use DatabaseStorage instead of MemStorage for persistent storage
export const storage = new DatabaseStorage();