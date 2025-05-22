import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { index } from "drizzle-orm/pg-core";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - for both homeowners and contractors
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Use Replit Auth ID
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  role: text("role").notNull().default("homeowner"), // homeowner or contractor
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  averageRating: real("average_rating").default(0),
  reviewCount: integer("review_count").default(0),
  // Stripe related fields for contractors
  stripeCustomerId: text("stripe_customer_id"),
  stripeAccountId: text("stripe_account_id"), // For receiving payments as a contractor
  stripeAccountStatus: text("stripe_account_status"), // pending, verified, rejected
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Notification preferences
  pushTokens: text("push_tokens").array(),
  notificationPreferences: jsonb("notification_preferences"),
});

// Trade categories for contractors
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
});

// Contractor specializations
export const contractorTrades = pgTable("contractor_trades", {
  id: serial("id").primaryKey(),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  tradeId: integer("trade_id").notNull().references(() => trades.id),
  yearsOfExperience: integer("years_of_experience").default(0),
  isVerified: boolean("is_verified").default(false),
});

// Job statuses enum
export const jobStatuses = ["pending", "matched", "scheduled", "in_progress", "completed", "cancelled"] as const;

// Payment info type
export const paymentInfoSchema = z.object({
  transactionId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  method: z.string(),
  receiptUrl: z.string().optional(),
  error: z.string().optional(),
  refundId: z.string().optional(),
});

export type PaymentInfo = z.infer<typeof paymentInfoSchema>;

// Job table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  homeownerId: varchar("homeowner_id").notNull().references(() => users.id),
  contractorId: varchar("contractor_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tradeId: integer("trade_id").references(() => trades.id),
  location: text("location"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  scheduledDate: timestamp("scheduled_date"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  estimatedCost: integer("estimated_cost"), // in cents
  actualCost: integer("actual_cost"), // in cents
  photos: text("photos").array(),
  // Payment fields
  isPaid: boolean("is_paid").default(false),
  paymentId: text("payment_id"), // Stripe payment intent ID
  paidAt: timestamp("paid_at"),
  paymentStatus: text("payment_status").default("pending"), // pending, completed, refunded, failed
  paymentInfo: jsonb("payment_info").$type<PaymentInfo>(),
});

// Job quotes provided by contractors
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // in cents
  description: text("description"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
});

// Messages between contractors and homeowners
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

// Job sheets (documentation of work done)
export const jobSheets = pgTable("job_sheets", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  contractorNotes: text("contractor_notes"),
  materialsUsed: text("materials_used"),
  timeSpent: varchar("time_spent", { length: 50 }),
  additionalCosts: integer("additional_costs").default(0),
  photos: text("photos").array(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLocation: jsonb("check_in_location"),
  checkOutLocation: jsonb("check_out_location"),
  signature: text("signature"),
  status: varchar("status", { length: 20 }).notNull().default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews from homeowners about contractors
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  homeownerId: varchar("homeowner_id").notNull().references(() => users.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schedule slots for contractors
export const scheduleSlots = pgTable("schedule_slots", {
  id: serial("id").primaryKey(),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
  jobId: integer("job_id").references(() => jobs.id),
  title: text("title"),
  description: text("description"),
  location: text("location"),
  status: text("status").default("available"), // available, proposed, confirmed, cancelled
  externalCalendarId: text("external_calendar_id"), // For syncing with external calendars
  externalCalendarType: text("external_calendar_type"), // google, apple, outlook
});

// Calendar integration preferences
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // google, apple, outlook
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  calendarId: text("calendar_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointment proposals for scheduling negotiation
export const appointmentProposals = pgTable("appointment_proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  proposerId: varchar("proposer_id").notNull().references(() => users.id), // Who proposed this time (contractor or homeowner)
  slotId: integer("slot_id").references(() => scheduleSlots.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, countered
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // job_request, job_update, payment, message
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(), // pending, succeeded, failed
  method: text("method").notNull(), // credit_card, bank_transfer, etc.
  transactionId: text("transaction_id"), // External payment provider's transaction ID
  receiptUrl: text("receipt_url"),
  error: text("error"),
  refundId: text("refund_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Refund requests table
export const refundRequests = pgTable("refund_requests", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  paymentId: integer("payment_id").notNull().references(() => payments.id),
  paymentIntentId: text("payment_intent_id").notNull(), // Stripe payment intent ID
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  amount: integer("amount").notNull(), // in cents
  processedAt: timestamp("processed_at"),
  error: text("error"),
  refundId: text("refund_id"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Refunds table
export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => payments.id),
  refundRequestId: integer("refund_request_id").references(() => refundRequests.id),
  amount: numeric("amount").notNull(),
  status: text("status").notNull(), // pending, succeeded, failed
  transactionId: text("transaction_id"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// INSERT SCHEMAS
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  averageRating: true, 
  reviewCount: true,
  createdAt: true,
  updatedAt: true
});
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true });
export const insertContractorTradeSchema = createInsertSchema(contractorTrades).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true, contractorId: true, status: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, status: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true });
export const insertJobSheetSchema = createInsertSchema(jobSheets).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertScheduleSlotSchema = createInsertSchema(scheduleSlots).omit({ id: true });
export const insertCalendarIntegrationSchema = createInsertSchema(calendarIntegrations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppointmentProposalSchema = createInsertSchema(appointmentProposals).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRefundSchema = createInsertSchema(refunds).omit({ id: true, createdAt: true, updatedAt: true });

// Type helper to transform null to undefined
type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null
    ? undefined
    : T[K] extends (infer U)[]
      ? NullToUndefined<U>[]
      : Exclude<T[K], null> | (null extends T[K] ? undefined : never);
};

// Export types with null transformed to undefined
export type JobSheet = NullToUndefined<typeof jobSheets.$inferSelect>;
export type InsertJobSheet = z.infer<typeof insertJobSheetSchema>;

// TYPES
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type ContractorTrade = typeof contractorTrades.$inferSelect;
export type InsertContractorTrade = z.infer<typeof insertContractorTradeSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ScheduleSlot = typeof scheduleSlots.$inferSelect;
export type InsertScheduleSlot = z.infer<typeof insertScheduleSlotSchema>;

export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;

export type AppointmentProposal = typeof appointmentProposals.$inferSelect;
export type InsertAppointmentProposal = z.infer<typeof insertAppointmentProposalSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = typeof refundRequests.$inferInsert;

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = typeof refunds.$inferInsert;

// Extended user profile schema for additional info after sign up
export const userProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  role: z.enum(["homeowner", "contractor"]).default("homeowner"),
  bio: z.string().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Login schema - needed for our routes file
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUser = z.infer<typeof loginSchema>;

// Registration schema - needed for our routes file
export const registerUserSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
