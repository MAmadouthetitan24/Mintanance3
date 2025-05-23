import {
  users, type User, type UpsertUser,
  trades, type Trade, type InsertTrade,
  contractorTrades, type ContractorTrade, type InsertContractorTrade,
  jobs, type Job, type InsertJob,
  quotes, type Quote, type InsertQuote,
  messages, type Message, type InsertMessage,
  jobSheets, type JobSheet, type InsertJobSheet,
  reviews, type Review, type InsertReview,
  scheduleSlots, type ScheduleSlot, type InsertScheduleSlot,
  appointmentProposals, type AppointmentProposal, type InsertAppointmentProposal,
  calendarIntegrations, type CalendarIntegration, type InsertCalendarIntegration
} from "@shared/schema";
import { type NullToUndefined } from "@shared/types";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getContractorsByTrade(tradeId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users,
      })
      .from(users)
      .innerJoin(
        contractorTrades,
        and(
          eq(contractorTrades.contractorId, users.id),
          eq(contractorTrades.tradeId, tradeId)
        )
      )
      .where(eq(users.role, "contractor"));
    
    return result.map(row => row.user);
  }

  // Trade operations
  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [result] = await db.insert(trades).values(trade).returning();
    return result;
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async getAllTrades(): Promise<Trade[]> {
    return await db.select().from(trades);
  }

  // Contractor trade operations
  async createContractorTrade(contractorTrade: InsertContractorTrade): Promise<ContractorTrade> {
    const [result] = await db.insert(contractorTrades).values(contractorTrade).returning();
    return result;
  }

  async getContractorTrades(contractorId: string): Promise<ContractorTrade[]> {
    return await db
      .select()
      .from(contractorTrades)
      .where(eq(contractorTrades.contractorId, contractorId));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [result] = await db
      .insert(jobs)
      .values({
        ...job,
        status: "pending",
      })
      .returning();
    return result;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    const [result] = await db
      .update(jobs)
      .set({
        ...jobData,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id))
      .returning();
    return result;
  }

  async getJobsByHomeowner(homeownerId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.homeownerId, homeownerId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByContractor(contractorId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.contractorId, contractorId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, status))
      .orderBy(desc(jobs.createdAt));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  // Quote operations
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [result] = await db
      .insert(quotes)
      .values({
        ...quote,
        status: "pending",
      })
      .returning();
    return result;
  }

  async getQuotesByJob(jobId: number): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.jobId, jobId))
      .orderBy(desc(quotes.createdAt));
  }

  async getQuotesByContractor(contractorId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.contractorId, contractorId))
      .orderBy(desc(quotes.createdAt));
  }

  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const [result] = await db
      .update(quotes)
      .set(quoteData)
      .where(eq(quotes.id, id))
      .returning();
    return result;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values({
        ...message,
        isRead: false,
      })
      .returning();
    return result;
  }

  async getMessagesByJob(jobId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.jobId, jobId))
      .orderBy(desc(messages.createdAt));
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(jobId: number, user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.jobId, jobId),
          or(
            and(
              eq(messages.senderId, user1Id),
              eq(messages.receiverId, user2Id)
            ),
            and(
              eq(messages.senderId, user2Id),
              eq(messages.receiverId, user1Id)
            )
          )
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Helper function to transform null to undefined
  private transformNullToUndefined<T extends Record<string, any>>(obj: T | null): NullToUndefined<T> | undefined {
    if (obj === null) return undefined;
    const transformed = { ...obj } as Record<string, any>;
    for (const [key, value] of Object.entries(transformed)) {
      if (value === null) {
        transformed[key] = undefined;
      } else if (Array.isArray(value)) {
        transformed[key] = value.map(item => 
          item === null ? undefined : item
        );
      }
    }
    return transformed as NullToUndefined<T>;
  }

  // Job Sheets operations
  async createJobSheet(jobSheet: InsertJobSheet): Promise<JobSheet> {
    const [result] = await db.insert(jobSheets).values(jobSheet).returning();
    return this.transformNullToUndefined(result)!;
  }

  async getJobSheet(id: number): Promise<JobSheet | undefined> {
    const [jobSheet] = await db.select().from(jobSheets).where(eq(jobSheets.id, id));
    return this.transformNullToUndefined(jobSheet);
  }

  async getJobSheetByJob(jobId: number): Promise<JobSheet | undefined> {
    const [jobSheet] = await db.select().from(jobSheets).where(eq(jobSheets.jobId, jobId));
    return this.transformNullToUndefined(jobSheet);
  }

  async updateJobSheet(id: number, jobSheetData: Partial<JobSheet>): Promise<JobSheet | undefined> {
    const [result] = await db
      .update(jobSheets)
      .set({
        ...jobSheetData,
        updatedAt: new Date(),
      })
      .where(eq(jobSheets.id, id))
      .returning();
    return this.transformNullToUndefined(result);
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [result] = await db.insert(reviews).values(review).returning();
    
    // Update contractor's average rating
    await this.updateContractorRating(review.contractorId);
    
    return result;
  }

  private async updateContractorRating(contractorId: string): Promise<void> {
    const result = await db
      .select({
        averageRating: sql<number>`AVG(${reviews.rating})`,
        reviewCount: sql<number>`COUNT(*)`
      })
      .from(reviews)
      .where(eq(reviews.contractorId, contractorId));
      
    if (result.length > 0) {
      const { averageRating, reviewCount } = result[0];
      await db
        .update(users)
        .set({ 
          averageRating, 
          reviewCount,
          updatedAt: new Date()
        })
        .where(eq(users.id, contractorId));
    }
  }

  async getReviewsByContractor(contractorId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.contractorId, contractorId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByHomeowner(homeownerId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.homeownerId, homeownerId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewByJob(jobId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.jobId, jobId));
    return review;
  }

  // Schedule slots operations
  async createScheduleSlot(slot: InsertScheduleSlot): Promise<ScheduleSlot> {
    const [result] = await db.insert(scheduleSlots).values(slot).returning();
    return result;
  }

  async getScheduleSlotsByContractor(contractorId: string): Promise<ScheduleSlot[]> {
    return await db
      .select()
      .from(scheduleSlots)
      .where(eq(scheduleSlots.contractorId, contractorId))
      .orderBy(scheduleSlots.startTime);
  }

  async getAvailableSlotsByContractor(contractorId: string): Promise<ScheduleSlot[]> {
    return await db
      .select()
      .from(scheduleSlots)
      .where(
        and(
          eq(scheduleSlots.contractorId, contractorId),
          eq(scheduleSlots.isBooked, false)
        )
      )
      .orderBy(scheduleSlots.startTime);
  }

  async updateScheduleSlot(id: number, slotData: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined> {
    const [result] = await db
      .update(scheduleSlots)
      .set(slotData)
      .where(eq(scheduleSlots.id, id))
      .returning();
    return result;
  }

  // Smart Distribution Algorithm
  async findMatchingContractors(jobId: number): Promise<User[]> {
    const job = await this.getJob(jobId);
    if (!job || !job.tradeId) return [];

    // Find contractors with the right trade
    const contractorTradesResult = await db
      .select({
        contractorId: contractorTrades.contractorId,
        yearsOfExperience: contractorTrades.yearsOfExperience,
        isVerified: contractorTrades.isVerified
      })
      .from(contractorTrades)
      .where(eq(contractorTrades.tradeId, job.tradeId));

    if (contractorTradesResult.length === 0) return [];

    const contractorIds = contractorTradesResult.map(ct => ct.contractorId);
    const tradeExperienceMap = new Map(
      contractorTradesResult.map(ct => [ct.contractorId, {
        yearsOfExperience: ct.yearsOfExperience || 0,
        isVerified: ct.isVerified || false
      }])
    );

    // Find available contractors (based on schedule)
    const now = new Date();
    const availableContractorIds = new Set<string>();
    
    // Check which contractors have available slots in the next 3 days
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const availabilityResults = await db
      .select({
        contractorId: scheduleSlots.contractorId
      })
      .from(scheduleSlots)
      .where(
        and(
          sql`${scheduleSlots.contractorId} IN (${contractorIds})`,
          eq(scheduleSlots.isBooked, false),
          sql`${scheduleSlots.startTime} > ${now}`,
          sql`${scheduleSlots.startTime} < ${threeDaysFromNow}`
        )
      )
      .groupBy(scheduleSlots.contractorId);
    
    availabilityResults.forEach(result => {
      availableContractorIds.add(result.contractorId);
    });
    
    // If no contractors are available in the next 3 days, include all contractors
    const contractorIdsToInclude = availableContractorIds.size > 0 
      ? Array.from(availableContractorIds)
      : contractorIds;

    // Find contractors with their ratings and additional details
    const contractors = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "contractor"),
          sql`${users.id} IN (${contractorIdsToInclude})`
        )
      );

    // Calculate proximity score if location data is available
    const contractorsWithScores = contractors.map(contractor => {
      const tradeInfo = tradeExperienceMap.get(contractor.id) || { 
        yearsOfExperience: 0, 
        isVerified: false 
      };
      
      // Calculate base score from ratings and reviews
      const ratingScore = contractor.averageRating || 0; // 0-5 scale
      const reviewCountScore = Math.min((contractor.reviewCount || 0) / 10, 1); // Scale 0-1 based on review count, max at 10 reviews
      
      // Experience score based on years in the trade (0-1 scale, max at 10 years)
      const experienceScore = Math.min(tradeInfo.yearsOfExperience / 10, 1);
      
      // Verification bonus
      const verificationBonus = tradeInfo.isVerified ? 0.5 : 0;
      
      // Availability bonus for contractors with immediate availability
      const availabilityBonus = availableContractorIds.has(contractor.id) ? 0.5 : 0;
      
      // Calculate proximity score based on available location data
      let proximityScore = 0.5; // Default middle score when no location data is available
      
      // If we have location data, use it to refine the proximity score
      if (contractor.city && contractor.city.length > 0 && job.location) {
        if (job.location.toLowerCase().includes(contractor.city.toLowerCase())) {
          proximityScore = 1.0; // Perfect match when city is found in location
        } else if (contractor.state && job.location.toLowerCase().includes(contractor.state.toLowerCase())) {
          proximityScore = 0.7; // Good match when state is found in location
        }
      }
      
      // Combined score calculation (weighted formula)
      const totalScore = (
        (ratingScore * 0.30) + // 30% weight to ratings
        (reviewCountScore * 0.15) + // 15% weight to review volume
        (experienceScore * 0.20) + // 20% weight to experience
        (verificationBonus * 0.10) + // 10% weight to verification
        (availabilityBonus * 0.10) + // 10% weight to availability
        (proximityScore * 0.15) // 15% weight to proximity
      );
      
      return {
        contractor,
        score: totalScore
      };
    });

    // Sort contractors by total score (highest first)
    return contractorsWithScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.contractor);
  }

  async assignContractorToJob(jobId: number, contractorId: string): Promise<Job | undefined> {
    return await this.updateJob(jobId, {
      contractorId,
      status: "matched",
    });
  }

  // Schedule Slots Methods
  async getScheduleSlot(id: number): Promise<ScheduleSlot | undefined> {
    const [slot] = await db
      .select()
      .from(scheduleSlots)
      .where(eq(scheduleSlots.id, id));
    return slot;
  }

  async deleteScheduleSlot(id: number): Promise<void> {
    await db
      .delete(scheduleSlots)
      .where(eq(scheduleSlots.id, id));
  }

  // Appointment Proposals Methods
  async createAppointmentProposal(proposal: InsertAppointmentProposal): Promise<AppointmentProposal> {
    const [newProposal] = await db
      .insert(appointmentProposals)
      .values(proposal)
      .returning();
    return newProposal;
  }

  async getAppointmentProposal(id: number): Promise<AppointmentProposal | undefined> {
    const [proposal] = await db
      .select()
      .from(appointmentProposals)
      .where(eq(appointmentProposals.id, id));
    return proposal;
  }

  async getAppointmentProposalsByJob(jobId: number): Promise<AppointmentProposal[]> {
    return db
      .select()
      .from(appointmentProposals)
      .where(eq(appointmentProposals.jobId, jobId));
  }

  async getAppointmentProposalsByUser(userId: string): Promise<AppointmentProposal[]> {
    // Find all jobs where the user is either homeowner or contractor
    const userJobs = await db
      .select()
      .from(jobs)
      .where(
        or(
          eq(jobs.homeownerId, userId),
          eq(jobs.contractorId, userId)
        )
      );
    
    // Get all job IDs
    const jobIds = userJobs.map(job => job.id);
    
    if (jobIds.length === 0) {
      return [];
    }
    
    // Get all proposals for these jobs
    return db
      .select()
      .from(appointmentProposals)
      .where(sql`${appointmentProposals.jobId} IN (${jobIds})`);
  }

  async updateAppointmentProposal(id: number, data: Partial<AppointmentProposal>): Promise<AppointmentProposal | undefined> {
    const [updatedProposal] = await db
      .update(appointmentProposals)
      .set(data)
      .where(eq(appointmentProposals.id, id))
      .returning();
    return updatedProposal;
  }

  // Calendar Integrations Methods
  async createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration> {
    const [newIntegration] = await db
      .insert(calendarIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.id, id));
    return integration;
  }

  async getCalendarIntegrationsByUser(userId: string): Promise<CalendarIntegration[]> {
    return db
      .select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.userId, userId));
  }

  async updateCalendarIntegration(id: number, data: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(calendarIntegrations)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(calendarIntegrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteCalendarIntegration(id: number): Promise<void> {
    await db
      .delete(calendarIntegrations)
      .where(eq(calendarIntegrations.id, id));
  }
}