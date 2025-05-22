import { DatabaseStorage } from '../../server/dbStorage';
import { Job, Quote, Review, Message } from '@shared/schema';

export interface ContractorMetrics {
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  totalRevenue: number;
  responseTime: number; // in hours
  customerSatisfaction: number; // 0-100
  repeatCustomers: number;
  onTimeCompletion: number; // percentage
}

export interface CustomerSatisfactionMetrics {
  averageRating: number;
  responseRate: number;
  complaintResolution: number;
  customerRetention: number;
  netPromoterScore: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueByTrade: Record<string, number>;
  revenueByMonth: Record<string, number>;
  averageJobValue: number;
  growthRate: number;
}

export interface MarketTrends {
  popularTrades: Array<{ trade: string; count: number }>;
  seasonalTrends: Record<string, number>;
  locationDemand: Record<string, number>;
  priceTrends: Record<string, number>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private db: DatabaseStorage;

  private constructor() {
    this.db = new DatabaseStorage();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async getContractorMetrics(contractorId: string): Promise<ContractorMetrics> {
    const jobs = await this.db.getJobsByContractor(contractorId);
    const reviews = await this.db.getReviewsByContractor(contractorId);
    const quotes = await this.db.getQuotesByContractor(contractorId);

    const completedJobs = jobs.filter(job => job.status === 'completed');
    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.paymentInfo?.amount || 0), 0);
    const averageRating = reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / (reviews.length || 1);

    // Calculate response time (average time between job creation and first quote)
    const responseTimes = jobs.map(job => {
      const jobQuotes = quotes.filter(quote => quote.jobId === job.id);
      if (jobQuotes.length > 0 && job.createdAt) {
        const firstQuote = jobQuotes.reduce((earliest, quote) => 
          (quote.createdAt && earliest.createdAt && quote.createdAt < earliest.createdAt) ? quote : earliest
        );
        if (firstQuote.createdAt) {
          return (firstQuote.createdAt.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60);
        }
      }
      return 0;
    }).filter(time => time > 0);

    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / (responseTimes.length || 1);

    // Calculate on-time completion rate
    const onTimeJobs = completedJobs.filter(job => {
      const estimatedCompletionDate = job.scheduledDate;
      const completedAt = job.paidAt;
      if (!estimatedCompletionDate) return true;
      return completedAt && completedAt <= estimatedCompletionDate;
    });

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      averageRating,
      totalRevenue,
      responseTime: averageResponseTime,
      customerSatisfaction: averageRating * 20, // Convert 5-star rating to 0-100 scale
      repeatCustomers: this.calculateRepeatCustomers(jobs),
      onTimeCompletion: (onTimeJobs.length / completedJobs.length) * 100 || 0
    };
  }

  async getCustomerSatisfactionMetrics(): Promise<CustomerSatisfactionMetrics> {
    const reviews = await this.db.getReviewsByContractor('all');
    const jobs = await this.db.getAllJobs();
    const messages = await this.db.getMessagesByUser('all');

    const averageRating = reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / (reviews.length || 1);
    
    // Calculate response rate (percentage of messages responded to within 24 hours)
    const responseRate = this.calculateResponseRate(messages);

    // Calculate complaint resolution rate
    const complaints = messages.filter((msg: Message) => 
      msg.content.toLowerCase().includes('complaint') || 
      msg.content.toLowerCase().includes('issue')
    );
    const resolvedComplaints = complaints.filter((complaint: Message) => {
      const followUpMessages = messages.filter((msg: Message) => 
        msg.jobId === complaint.jobId && 
        msg.createdAt && complaint.createdAt &&
        msg.createdAt > complaint.createdAt
      );
      return followUpMessages.length > 0;
    });

    // Calculate customer retention
    const retentionRate = this.calculateRetentionRate(jobs);

    // Calculate Net Promoter Score (NPS)
    const promoters = reviews.filter((review: Review) => review.rating >= 4).length;
    const detractors = reviews.filter((review: Review) => review.rating <= 2).length;
    const nps = ((promoters - detractors) / reviews.length) * 100;

    return {
      averageRating,
      responseRate,
      complaintResolution: (resolvedComplaints.length / complaints.length) * 100 || 0,
      customerRetention: retentionRate,
      netPromoterScore: nps
    };
  }

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const jobs = await this.db.getAllJobs();
    const completedJobs = jobs.filter(job => job.status === 'completed');
    
    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.actualCost || 0), 0);
    
    // Calculate revenue by trade
    const revenueByTrade: Record<string, number> = {};
    completedJobs.forEach(job => {
      if (job.tradeId) {
        const trade = job.tradeId.toString();
        revenueByTrade[trade] = (revenueByTrade[trade] || 0) + (job.actualCost || 0);
      }
    });

    // Calculate revenue by month
    const revenueByMonth: Record<string, number> = {};
    completedJobs.forEach(job => {
      const completedAt = job.paidAt;
      if (completedAt) {
        const month = completedAt.toISOString().slice(0, 7); // YYYY-MM format
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (job.actualCost || 0);
      }
    });

    // Calculate growth rate
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    
    const currentMonthRevenue = revenueByMonth[currentMonth] || 0;
    const lastMonthRevenue = revenueByMonth[lastMonthStr] || 0;
    const growthRate = lastMonthRevenue ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return {
      totalRevenue,
      revenueByTrade,
      revenueByMonth,
      averageJobValue: totalRevenue / completedJobs.length || 0,
      growthRate
    };
  }

  async getMarketTrends(): Promise<MarketTrends> {
    const jobs = await this.db.getAllJobs();
    const quotes = await this.db.getQuotesByContractor('all');

    // Calculate popular trades
    const tradeCounts: Record<string, number> = {};
    jobs.forEach(job => {
      if (job.tradeId) {
        const trade = job.tradeId.toString();
        tradeCounts[trade] = (tradeCounts[trade] || 0) + 1;
      }
    });

    const popularTrades = Object.entries(tradeCounts)
      .map(([trade, count]) => ({ trade, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate seasonal trends
    const seasonalTrends: Record<string, number> = {};
    jobs.forEach(job => {
      if (job.createdAt) {
        const month = job.createdAt.getMonth();
        seasonalTrends[month] = (seasonalTrends[month] || 0) + 1;
      }
    });

    // Calculate location demand
    const locationDemand: Record<string, number> = {};
    jobs.forEach(job => {
      if (job.location) {
        locationDemand[job.location] = (locationDemand[job.location] || 0) + 1;
      }
    });

    // Calculate price trends
    const priceTrends: Record<string, { sum: number; count: number }> = {};
    quotes.forEach((quote: Quote) => {
      if (quote.createdAt && quote.amount) {
        const month = quote.createdAt.toISOString().slice(0, 7);
        if (!priceTrends[month]) {
          priceTrends[month] = { sum: 0, count: 0 };
        }
        priceTrends[month].sum += quote.amount;
        priceTrends[month].count += 1;
      }
    });

    // Calculate average prices
    const averagePrices: Record<string, number> = {};
    Object.entries(priceTrends).forEach(([month, data]) => {
      averagePrices[month] = data.sum / data.count;
    });

    return {
      popularTrades,
      seasonalTrends,
      locationDemand,
      priceTrends: averagePrices
    };
  }

  private calculateRepeatCustomers(jobs: Job[]): number {
    const customerJobs = jobs.reduce((acc: Record<string, number>, job: Job) => {
      acc[job.homeownerId] = (acc[job.homeownerId] || 0) + 1;
      return acc;
    }, {});

    return Object.values(customerJobs).filter((count: number) => count > 1).length;
  }

  private calculateResponseRate(messages: Message[]): number {
    const messagePairs = messages.reduce((acc: Record<number, Message[]>, message: Message) => {
      if (!acc[message.jobId]) {
        acc[message.jobId] = [];
      }
      acc[message.jobId].push(message);
      return acc;
    }, {});

    let respondedCount = 0;
    let totalCount = 0;

    Object.values(messagePairs).forEach((jobMessages: Message[]) => {
      if (jobMessages.length >= 2) {
        totalCount++;
        const sortedMessages = jobMessages.sort((a: Message, b: Message) => 
          (a.createdAt && b.createdAt) ? a.createdAt.getTime() - b.createdAt.getTime() : 0
        );
        
        for (let i = 1; i < sortedMessages.length; i++) {
          if (sortedMessages[i].createdAt && sortedMessages[i-1].createdAt) {
            const timeDiff = (sortedMessages[i].createdAt!.getTime() - 
              sortedMessages[i-1].createdAt!.getTime()) / (1000 * 60 * 60);
            
            if (timeDiff <= 24) {
              respondedCount++;
              break;
            }
          }
        }
      }
    });

    return totalCount ? (respondedCount / totalCount) * 100 : 0;
  }

  private calculateRetentionRate(jobs: Job[]): number {
    const customerJobs = jobs.reduce((acc: Record<string, { firstJob: Date; lastJob: Date; count: number }>, job: Job) => {
      if (!job.createdAt) return acc;
      
      if (!acc[job.homeownerId]) {
        acc[job.homeownerId] = {
          firstJob: job.createdAt,
          lastJob: job.createdAt,
          count: 1
        };
      } else {
        acc[job.homeownerId].lastJob = job.createdAt;
        acc[job.homeownerId].count++;
      }
      return acc;
    }, {});

    const activeCustomers = Object.values(customerJobs).filter(customer => {
      const monthsSinceLastJob = (new Date().getTime() - customer.lastJob.getTime()) / 
        (1000 * 60 * 60 * 24 * 30);
      return monthsSinceLastJob <= 6; // Consider customers active if they've had a job in the last 6 months
    });

    return (activeCustomers.length / Object.keys(customerJobs).length) * 100;
  }
} 