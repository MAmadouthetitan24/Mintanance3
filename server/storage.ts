import { 
  users, type User, type InsertUser,
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
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getContractorsByTrade(tradeId: number): Promise<User[]>;
  
  // Trades
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrade(id: number): Promise<Trade | undefined>;
  getAllTrades(): Promise<Trade[]>;
  
  // Contractor Trades
  createContractorTrade(contractorTrade: InsertContractorTrade): Promise<ContractorTrade>;
  getContractorTrades(contractorId: number): Promise<ContractorTrade[]>;
  
  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  getJobsByHomeowner(homeownerId: number): Promise<Job[]>;
  getJobsByContractor(contractorId: number): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  
  // Quotes
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuotesByJob(jobId: number): Promise<Quote[]>;
  getQuotesByContractor(contractorId: number): Promise<Quote[]>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByJob(jobId: number): Promise<Message[]>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(jobId: number, user1Id: number, user2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Job Sheets
  createJobSheet(jobSheet: InsertJobSheet): Promise<JobSheet>;
  getJobSheet(id: number): Promise<JobSheet | undefined>;
  getJobSheetByJob(jobId: number): Promise<JobSheet | undefined>;
  updateJobSheet(id: number, jobSheet: Partial<JobSheet>): Promise<JobSheet | undefined>;
  
  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByContractor(contractorId: number): Promise<Review[]>;
  getReviewsByHomeowner(homeownerId: number): Promise<Review[]>;
  getReviewByJob(jobId: number): Promise<Review | undefined>;
  
  // Schedule Slots
  createScheduleSlot(slot: InsertScheduleSlot): Promise<ScheduleSlot>;
  getScheduleSlotsByContractor(contractorId: number): Promise<ScheduleSlot[]>;
  getAvailableSlotsByContractor(contractorId: number): Promise<ScheduleSlot[]>;
  updateScheduleSlot(id: number, slot: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined>;
  
  // Smart Distribution Algorithm
  findMatchingContractors(jobId: number): Promise<User[]>;
  assignContractorToJob(jobId: number, contractorId: number): Promise<Job | undefined>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private tradesData: Map<number, Trade>;
  private contractorTradesData: Map<number, ContractorTrade>;
  private jobsData: Map<number, Job>;
  private quotesData: Map<number, Quote>;
  private messagesData: Map<number, Message>;
  private jobSheetsData: Map<number, JobSheet>;
  private reviewsData: Map<number, Review>;
  private scheduleSlotsData: Map<number, ScheduleSlot>;
  
  private currentUserId: number;
  private currentTradeId: number;
  private currentContractorTradeId: number;
  private currentJobId: number;
  private currentQuoteId: number;
  private currentMessageId: number;
  private currentJobSheetId: number;
  private currentReviewId: number;
  private currentScheduleSlotId: number;
  
  constructor() {
    this.usersData = new Map();
    this.tradesData = new Map();
    this.contractorTradesData = new Map();
    this.jobsData = new Map();
    this.quotesData = new Map();
    this.messagesData = new Map();
    this.jobSheetsData = new Map();
    this.reviewsData = new Map();
    this.scheduleSlotsData = new Map();
    
    this.currentUserId = 1;
    this.currentTradeId = 1;
    this.currentContractorTradeId = 1;
    this.currentJobId = 1;
    this.currentQuoteId = 1;
    this.currentMessageId = 1;
    this.currentJobSheetId = 1;
    this.currentReviewId = 1;
    this.currentScheduleSlotId = 1;
    
    // Initialize with some trades
    this.initializeTrades();
  }
  
  private initializeTrades() {
    const defaultTrades: InsertTrade[] = [
      { name: "Plumbing", description: "Water and pipe related services", icon: "ri-hammer-line" },
      { name: "Electrical", description: "Electrical repair and installation", icon: "ri-plug-2-line" },
      { name: "Painting", description: "Interior and exterior painting", icon: "ri-brush-line" },
      { name: "Landscaping", description: "Outdoor maintenance and design", icon: "ri-scissors-line" },
      { name: "HVAC", description: "Heating, ventilation, and air conditioning", icon: "ri-heating-line" },
      { name: "Carpentry", description: "Woodworking and structural repairs", icon: "ri-hammer-line" },
    ];
    
    defaultTrades.forEach(trade => {
      this.createTrade(trade);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.usersData.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }
  
  async getContractorsByTrade(tradeId: number): Promise<User[]> {
    // Get contractor IDs that have this trade
    const contractorTradesWithTrade = Array.from(this.contractorTradesData.values())
      .filter(ct => ct.tradeId === tradeId)
      .map(ct => ct.contractorId);
    
    // Get contractors with those IDs
    return Array.from(this.usersData.values())
      .filter(user => user.role === 'contractor' && contractorTradesWithTrade.includes(user.id));
  }
  
  // Trade methods
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = { ...insertTrade, id };
    this.tradesData.set(id, trade);
    return trade;
  }
  
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.tradesData.get(id);
  }
  
  async getAllTrades(): Promise<Trade[]> {
    return Array.from(this.tradesData.values());
  }
  
  // Contractor Trade methods
  async createContractorTrade(insertContractorTrade: InsertContractorTrade): Promise<ContractorTrade> {
    const id = this.currentContractorTradeId++;
    const contractorTrade: ContractorTrade = { ...insertContractorTrade, id };
    this.contractorTradesData.set(id, contractorTrade);
    return contractorTrade;
  }
  
  async getContractorTrades(contractorId: number): Promise<ContractorTrade[]> {
    return Array.from(this.contractorTradesData.values())
      .filter(ct => ct.contractorId === contractorId);
  }
  
  // Job methods
  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const now = new Date();
    const job: Job = { 
      ...insertJob, 
      id,
      createdAt: now,
      updatedAt: now,
      contractorId: null,
      status: "pending",
      photos: insertJob.photos || [],
    };
    this.jobsData.set(id, job);
    return job;
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobsData.get(id);
  }
  
  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobsData.get(id);
    if (!job) return undefined;
    
    const updatedJob: Job = { 
      ...job, 
      ...jobData,
      updatedAt: new Date()
    };
    this.jobsData.set(id, updatedJob);
    return updatedJob;
  }
  
  async getJobsByHomeowner(homeownerId: number): Promise<Job[]> {
    return Array.from(this.jobsData.values())
      .filter(job => job.homeownerId === homeownerId);
  }
  
  async getJobsByContractor(contractorId: number): Promise<Job[]> {
    return Array.from(this.jobsData.values())
      .filter(job => job.contractorId === contractorId);
  }
  
  async getJobsByStatus(status: string): Promise<Job[]> {
    return Array.from(this.jobsData.values())
      .filter(job => job.status === status);
  }
  
  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobsData.values());
  }
  
  // Quote methods
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = this.currentQuoteId++;
    const quote: Quote = { 
      ...insertQuote, 
      id, 
      createdAt: new Date(),
      status: "pending",
    };
    this.quotesData.set(id, quote);
    return quote;
  }
  
  async getQuotesByJob(jobId: number): Promise<Quote[]> {
    return Array.from(this.quotesData.values())
      .filter(quote => quote.jobId === jobId);
  }
  
  async getQuotesByContractor(contractorId: number): Promise<Quote[]> {
    return Array.from(this.quotesData.values())
      .filter(quote => quote.contractorId === contractorId);
  }
  
  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const quote = this.quotesData.get(id);
    if (!quote) return undefined;
    
    const updatedQuote: Quote = { ...quote, ...quoteData };
    this.quotesData.set(id, updatedQuote);
    return updatedQuote;
  }
  
  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      isRead: false,
    };
    this.messagesData.set(id, message);
    return message;
  }
  
  async getMessagesByJob(jobId: number): Promise<Message[]> {
    return Array.from(this.messagesData.values())
      .filter(message => message.jobId === jobId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messagesData.values())
      .filter(message => message.senderId === userId || message.receiverId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getConversation(jobId: number, user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messagesData.values())
      .filter(message => 
        message.jobId === jobId && 
        ((message.senderId === user1Id && message.receiverId === user2Id) || 
         (message.senderId === user2Id && message.receiverId === user1Id))
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    const message = this.messagesData.get(id);
    if (message) {
      message.isRead = true;
      this.messagesData.set(id, message);
    }
  }
  
  // Job Sheet methods
  async createJobSheet(insertJobSheet: InsertJobSheet): Promise<JobSheet> {
    const id = this.currentJobSheetId++;
    const now = new Date();
    const jobSheet: JobSheet = { 
      ...insertJobSheet, 
      id,
      createdAt: now,
      updatedAt: now,
      photos: insertJobSheet.photos || [],
    };
    this.jobSheetsData.set(id, jobSheet);
    return jobSheet;
  }
  
  async getJobSheet(id: number): Promise<JobSheet | undefined> {
    return this.jobSheetsData.get(id);
  }
  
  async getJobSheetByJob(jobId: number): Promise<JobSheet | undefined> {
    return Array.from(this.jobSheetsData.values())
      .find(sheet => sheet.jobId === jobId);
  }
  
  async updateJobSheet(id: number, jobSheetData: Partial<JobSheet>): Promise<JobSheet | undefined> {
    const jobSheet = this.jobSheetsData.get(id);
    if (!jobSheet) return undefined;
    
    const updatedJobSheet: JobSheet = { 
      ...jobSheet, 
      ...jobSheetData,
      updatedAt: new Date()
    };
    this.jobSheetsData.set(id, updatedJobSheet);
    return updatedJobSheet;
  }
  
  // Review methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { 
      ...insertReview, 
      id,
      createdAt: new Date(),
    };
    this.reviewsData.set(id, review);
    
    // Update contractor's average rating
    const contractor = await this.getUser(review.contractorId);
    if (contractor) {
      const reviews = await this.getReviewsByContractor(contractor.id);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      await this.updateUser(contractor.id, {
        averageRating,
        reviewCount: reviews.length
      });
    }
    
    return review;
  }
  
  async getReviewsByContractor(contractorId: number): Promise<Review[]> {
    return Array.from(this.reviewsData.values())
      .filter(review => review.contractorId === contractorId);
  }
  
  async getReviewsByHomeowner(homeownerId: number): Promise<Review[]> {
    return Array.from(this.reviewsData.values())
      .filter(review => review.homeownerId === homeownerId);
  }
  
  async getReviewByJob(jobId: number): Promise<Review | undefined> {
    return Array.from(this.reviewsData.values())
      .find(review => review.jobId === jobId);
  }
  
  // Schedule Slot methods
  async createScheduleSlot(insertSlot: InsertScheduleSlot): Promise<ScheduleSlot> {
    const id = this.currentScheduleSlotId++;
    const slot: ScheduleSlot = { ...insertSlot, id };
    this.scheduleSlotsData.set(id, slot);
    return slot;
  }
  
  async getScheduleSlotsByContractor(contractorId: number): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlotsData.values())
      .filter(slot => slot.contractorId === contractorId);
  }
  
  async getAvailableSlotsByContractor(contractorId: number): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlotsData.values())
      .filter(slot => slot.contractorId === contractorId && !slot.isBooked);
  }
  
  async updateScheduleSlot(id: number, slotData: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined> {
    const slot = this.scheduleSlotsData.get(id);
    if (!slot) return undefined;
    
    const updatedSlot: ScheduleSlot = { ...slot, ...slotData };
    this.scheduleSlotsData.set(id, updatedSlot);
    return updatedSlot;
  }
  
  // Smart Distribution Algorithm
  async findMatchingContractors(jobId: number): Promise<User[]> {
    const job = await this.getJob(jobId);
    if (!job || !job.tradeId) return [];
    
    // Get all contractors with this trade
    const matchingContractors = await this.getContractorsByTrade(job.tradeId);
    
    // Sort by rating (highest first)
    return matchingContractors.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      // If ratings are equal, prioritize those with more reviews
      return b.reviewCount - a.reviewCount;
    });
  }
  
  async assignContractorToJob(jobId: number, contractorId: number): Promise<Job | undefined> {
    const job = await this.getJob(jobId);
    const contractor = await this.getUser(contractorId);
    
    if (!job || !contractor || contractor.role !== 'contractor') {
      return undefined;
    }
    
    return this.updateJob(jobId, {
      contractorId,
      status: "matched",
    });
  }
}

export const storage = new MemStorage();
