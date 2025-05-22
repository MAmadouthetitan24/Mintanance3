import { DatabaseStorage } from '../../server/dbStorage';
import { Job, Quote, Review, User, ContractorTrade, JobSheet } from '@shared/schema';
import EventEmitter from 'eventemitter3';

// Enhanced type definitions
type ContractorMetrics = {
  reliabilityScore: number;
  workloadScore: number;
  qualityScore: number;
  priceScore: number;
  matchScore: number;
  lastUpdated: Date;
};

type MetricChangeEvent = {
  contractorId: string;
  metricType: keyof ContractorMetrics;
  oldValue: number;
  newValue: number;
  timestamp: Date;
};

type CacheConfig = {
  ttl: number;
  maxSize: number;
  cleanupInterval: number;
  retryAttempts: number;
  retryDelay: number;
  staleWhileRevalidate: boolean;
  maxStaleTime: number;
};

type ErrorRecoveryStrategy = {
  maxRetries: number;
  backoffFactor: number;
  maxBackoff: number;
  shouldRetry: (error: Error) => boolean;
};

type QualityMetricsDetail = {
  workmanship: {
    attentionToDetail: number;
    materialQuality: number;
    finishQuality: number;
    complianceWithStandards: number;
  };
  safety: {
    safetyProtocols: number;
    incidentRate: number;
    equipmentMaintenance: number;
    trainingCompliance: number;
  };
  communication: {
    responseTime: number;
    clarity: number;
    professionalism: number;
    documentation: number;
  };
  customerSatisfaction: {
    overallRating: number;
    repeatBusiness: number;
    referralRate: number;
    complaintResolution: number;
  };
};

interface ContractorScore {
  contractorId: string;
  score: number;
  reliabilityScore: number;
  workloadScore: number;
  qualityScore: number;
  priceScore: number;
  matchScore: number;
  detailedMetrics: {
    responseTime: number;
    completionRate: number;
    customerSatisfaction: number;
    priceCompetitiveness: number;
    qualityMetrics: QualityMetricsDetail;
  };
  lastUpdated: Date;
}

interface PricePrediction {
  estimatedPrice: number;
  confidence: number;
  factors: {
    trade: number;
    location: number;
    complexity: number;
    seasonality: number;
  };
}

interface QualityMetrics {
  onTimeCompletion: number;
  customerSatisfaction: number;
  communicationScore: number;
  workmanshipScore: number;
  safetyCompliance: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastError?: Error;
  retryCount: number;
  staleAt?: number;
  isRevalidating: boolean;
}

export class ContractorMatchingService extends EventEmitter {
  private static instance: ContractorMatchingService;
  private db: DatabaseStorage;
  private cache: Map<string, CacheEntry<any>>;
  private metrics: Map<string, ContractorMetrics>;
  private readonly cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000, // Maximum number of cache entries
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    staleWhileRevalidate: true,
    maxStaleTime: 30 * 60 * 1000 // 30 minutes
  };
  private readonly errorRecovery: ErrorRecoveryStrategy = {
    maxRetries: 3,
    backoffFactor: 1.5,
    maxBackoff: 10000, // 10 seconds
    shouldRetry: (error: Error) => {
      // Retry on network errors, timeouts, and temporary failures
      return error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('temporary');
    }
  };
  private cleanupTimer: NodeJS.Timeout | undefined;
  private metricsUpdateTimer: NodeJS.Timeout | undefined;
  private revalidationTimer: NodeJS.Timeout | undefined;

  private constructor() {
    super();
    this.db = new DatabaseStorage();
    this.cache = new Map();
    this.metrics = new Map();
    this.startCacheCleanup();
    this.startMetricsUpdates();
    this.startCacheRevalidation();
  }

  public static getInstance(): ContractorMatchingService {
    if (!ContractorMatchingService.instance) {
      ContractorMatchingService.instance = new ContractorMatchingService();
    }
    return ContractorMatchingService.instance;
  }

  private startCacheCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupCache();
    }, this.cacheConfig.cleanupInterval);
  }

  private cleanupCache(): void {
    const now = Date.now();
    let entriesToDelete: string[] = [];

    // Find expired entries
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        entriesToDelete.push(key);
      }
    });

    // Delete expired entries
    entriesToDelete.forEach(key => {
      this.cache.delete(key);
    });

    // If still over max size, remove least accessed entries
    if (this.cache.size > this.cacheConfig.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);
      
      const entriesToRemove = sortedEntries
        .slice(0, this.cache.size - this.cacheConfig.maxSize)
        .map(([key]) => key);

      entriesToRemove.forEach(key => {
        this.cache.delete(key);
      });
    }
  }

  private startMetricsUpdates(): void {
    this.metricsUpdateTimer = setInterval(() => {
      this.updateMetrics();
    }, 5 * 60 * 1000); // Update metrics every 5 minutes
  }

  private startCacheRevalidation(): void {
    this.revalidationTimer = setInterval(() => {
      this.revalidateStaleEntries();
    }, this.cacheConfig.cleanupInterval / 2);
  }

  private async revalidateStaleEntries(): Promise<void> {
    const now = Date.now();
    const staleEntries = Array.from(this.cache.entries())
      .filter(([, entry]) => 
        entry.staleAt && 
        now > entry.staleAt && 
        !entry.isRevalidating
      );

    await Promise.all(
      staleEntries.map(async ([key, entry]) => {
        try {
          entry.isRevalidating = true;
          const newData = await this.fetchAndCacheData(key);
          this.emit('cacheRevalidated', { key, success: true });
        } catch (error) {
          console.error(`Failed to revalidate cache entry ${key}:`, error);
          this.emit('cacheRevalidated', { key, success: false, error });
        } finally {
          entry.isRevalidating = false;
        }
      })
    );
  }

  private async fetchAndCacheData<T>(key: string): Promise<T> {
    const fetchFn = this.getFetchFunctionForKey(key);
    if (!fetchFn) {
      throw new Error(`No fetch function found for key ${key}`);
    }

    const data = await this.executeWithRetry(() => fetchFn());
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheConfig.ttl,
      staleAt: Date.now() + this.cacheConfig.maxStaleTime,
      accessCount: 1,
      retryCount: 0,
      isRevalidating: false
    });
    return data;
  }

  private getFetchFunctionForKey(key: string): (() => Promise<any>) | null {
    if (key.startsWith('matching_contractors_')) {
      const jobId = parseInt(key.split('_')[2]);
      return () => this.findMatchingContractors(jobId);
    }
    // Add more key patterns as needed
    return null;
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = 1000; // Initial delay of 1 second

    for (let attempt = 0; attempt < this.errorRecovery.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (!this.errorRecovery.shouldRetry(lastError)) {
          throw lastError;
        }
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(delay, this.errorRecovery.maxBackoff))
        );
        delay *= this.errorRecovery.backoffFactor;
      }
    }
    throw lastError;
  }

  private async getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached) {
      if (now < cached.expiresAt) {
        // Fresh data
        cached.accessCount++;
        return cached.data;
      } else if (this.cacheConfig.staleWhileRevalidate && 
                cached.staleAt && 
                now < cached.staleAt && 
                !cached.isRevalidating) {
        // Stale but usable data
        cached.accessCount++;
        this.revalidateInBackground(key, fetchFn);
        return cached.data;
      }
    }

    // No valid cache entry, fetch fresh data
    return this.fetchAndCacheData(key);
  }

  private async revalidateInBackground<T>(key: string, fetchFn: () => Promise<T>): Promise<void> {
    const entry = this.cache.get(key);
    if (!entry || entry.isRevalidating) return;

    try {
      entry.isRevalidating = true;
      const newData = await this.executeWithRetry(fetchFn);
      this.cache.set(key, {
        data: newData,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.cacheConfig.ttl,
        staleAt: Date.now() + this.cacheConfig.maxStaleTime,
        accessCount: entry.accessCount,
        retryCount: 0,
        isRevalidating: false
      });
      this.emit('cacheRevalidated', { key, success: true });
    } catch (error) {
      console.error(`Background revalidation failed for ${key}:`, error);
      this.emit('cacheRevalidated', { key, success: false, error });
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      const contractors = await this.db.getContractorsByTrade(0);
      await Promise.all(
        contractors.map(async (contractor: User) => {
          try {
            const oldMetrics = this.metrics.get(contractor.id);
            const newMetrics = await this.calculateContractorMetrics(contractor.id);
            
            // Emit events for significant metric changes
            this.emitMetricChanges(contractor.id, oldMetrics, newMetrics);
            
            this.metrics.set(contractor.id, {
              ...newMetrics,
              lastUpdated: new Date()
            });
          } catch (error) {
            console.error(`Error updating metrics for contractor ${contractor.id}:`, error);
            this.emit('metricUpdateError', { contractorId: contractor.id, error });
          }
        })
      );
    } catch (error) {
      console.error('Error updating metrics:', error);
      this.emit('metricsUpdateError', { error });
    }
  }

  private emitMetricChanges(
    contractorId: string,
    oldMetrics: ContractorMetrics | undefined,
    newMetrics: ContractorMetrics
  ): void {
    if (!oldMetrics) return;

    const metricTypes: (keyof ContractorMetrics)[] = [
      'reliabilityScore',
      'workloadScore',
      'qualityScore',
      'priceScore',
      'matchScore'
    ];

    metricTypes.forEach(metricType => {
      const oldValue = Number(oldMetrics[metricType]);
      const newValue = Number(newMetrics[metricType]);
      const change = Math.abs(newValue - oldValue);

      // Emit event if change is significant (e.g., > 10%)
      if (change > 0.1) {
        this.emit('metricChanged', {
          contractorId,
          metricType,
          oldValue,
          newValue,
          timestamp: new Date()
        });
      }
    });
  }

  async findMatchingContractors(jobId: number): Promise<User[]> {
    const startTime = Date.now();
    console.log(`Starting contractor matching for job ${jobId}`);

    try {
      const job = await this.db.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }
      if (!job.tradeId) {
        throw new Error(`Job ${jobId} has no trade information`);
      }

      const cacheKey = `matching_contractors_${jobId}`;
      const result = await this.getCachedData(cacheKey, async () => {
        console.log(`Cache miss for job ${jobId}, fetching contractors`);
        const contractors = await this.db.getContractorsByTrade(job.tradeId!);
        
        if (!contractors.length) {
          console.warn(`No contractors found for trade ${job.tradeId}`);
          return [];
        }

        console.log(`Calculating scores for ${contractors.length} contractors`);
        const contractorScores = await Promise.all(
          contractors.map(async (contractor) => {
            try {
              const [
                reliabilityScore,
                workloadScore,
                qualityScore,
                priceScore
              ] = await Promise.all([
                this.calculateReliabilityScore(contractor.id),
                this.calculateWorkloadScore(contractor.id),
                this.calculateQualityScore(contractor.id),
                this.calculatePriceScore(contractor.id, job)
              ]);

              const matchScore = this.calculateMatchScore({
                reliabilityScore,
                workloadScore,
                qualityScore,
                priceScore,
              });

              return {
                contractorId: contractor.id,
                score: matchScore,
                reliabilityScore,
                workloadScore,
                qualityScore,
                priceScore,
                matchScore,
                detailedMetrics: await this.calculateDetailedMetrics(contractor.id, job)
              };
            } catch (error) {
              console.error(`Error calculating scores for contractor ${contractor.id}:`, error);
              return null;
            }
          })
        );

        const validScores = contractorScores.filter((score): score is ContractorScore => score !== null);
        if (!validScores.length) {
          console.warn(`No valid scores calculated for job ${jobId}`);
          return [];
        }

        const sortedScores = validScores.sort((a, b) => b.matchScore - a.matchScore);
        const topContractors = sortedScores
          .slice(0, 5)
          .map(score => contractors.find(c => c.id === score.contractorId)!);

        console.log(`Found ${topContractors.length} matching contractors for job ${jobId}`);
        return topContractors;
      });

      const duration = Date.now() - startTime;
      console.log(`Contractor matching completed for job ${jobId} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error finding matching contractors for job ${jobId} after ${duration}ms:`, error);
      throw new Error(`Failed to find matching contractors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateDetailedMetrics(contractorId: string, job: Job): Promise<ContractorScore['detailedMetrics']> {
    try {
      const [quotes, reviews, jobs] = await Promise.all([
        this.db.getQuotesByContractor(contractorId),
        this.db.getReviewsByContractor(contractorId),
        this.db.getJobsByContractor(contractorId)
      ]);

      const responseTime = await this.calculateAverageResponseTime(quotes);
      const completionRate = this.calculateCompletionRate(jobs);
      const customerSatisfaction = this.calculateCustomerSatisfaction(reviews);
      const priceCompetitiveness = await this.calculatePriceCompetitiveness(contractorId, job);
      const qualityMetrics = await this.calculateDetailedQualityMetrics(contractorId);

      return {
        responseTime,
        completionRate,
        customerSatisfaction,
        priceCompetitiveness,
        qualityMetrics
      };
    } catch (error) {
      console.error(`Error calculating detailed metrics for contractor ${contractorId}:`, error);
      throw error;
    }
  }

  private async calculateAverageResponseTime(quotes: Quote[]): Promise<number> {
    if (quotes.length === 0) return 0;

    const responseTimes = await Promise.all(
      quotes.map(async quote => {
        try {
          const job = await this.db.getJob(quote.jobId);
          if (!job || !quote.createdAt || !job.createdAt) return null;
          return Number(quote.createdAt.getTime() - job.createdAt.getTime());
        } catch (error) {
          console.error('Error calculating response time:', error);
          return null;
        }
      })
    );

    const validTimes = responseTimes.filter((time): time is number => time !== null);
    if (validTimes.length === 0) return 0;

    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }

  private calculateCompletionRate(jobs: Job[]): number {
    if (jobs.length === 0) return 0;
    const completedJobs = jobs.filter(job => job.status === 'completed');
    return completedJobs.length / jobs.length;
  }

  private async calculatePriceCompetitiveness(contractorId: string, job: Job): Promise<number> {
    try {
      const quotes = await this.db.getQuotesByContractor(contractorId);
      const similarQuotes = quotes.filter(quote => 
        quote.jobId && quote.jobId !== job.id
      );

      if (similarQuotes.length === 0) return 0.5;

      const averageQuote = similarQuotes.reduce((sum, quote) => 
        sum + (quote.amount || 0), 0
      ) / similarQuotes.length;

      const pricePrediction = await this.predictJobPrice(job.id);
      const priceDifference = Math.abs(averageQuote - pricePrediction.estimatedPrice);
      
      return Math.max(0, 1 - (priceDifference / pricePrediction.estimatedPrice));
    } catch (error) {
      console.error('Error calculating price competitiveness:', error);
      return 0.5;
    }
  }

  async predictJobPrice(jobId: number): Promise<PricePrediction> {
    const job = await this.db.getJob(jobId);
    if (!job || !job.tradeId) {
      throw new Error('Invalid job or missing trade information');
    }

    // Get historical quotes for similar jobs
    const similarJobs = await this.findSimilarJobs(job);
    const historicalQuotes = await this.getHistoricalQuotes(similarJobs);

    // Calculate price factors
    const tradeFactor = await this.calculateTradePriceFactor(job.tradeId);
    const locationFactor = await this.calculateLocationPriceFactor(job.location);
    const complexityFactor = this.calculateComplexityFactor(job);
    const seasonalityFactor = this.calculateSeasonalityFactor();

    // Calculate weighted average price
    const estimatedPrice = this.calculateWeightedPrice(
      historicalQuotes,
      tradeFactor,
      locationFactor,
      complexityFactor,
      seasonalityFactor
    );

    // Calculate confidence score
    const confidence = this.calculatePriceConfidence(historicalQuotes.length);

    return {
      estimatedPrice,
      confidence,
      factors: {
        trade: tradeFactor,
        location: locationFactor,
        complexity: complexityFactor,
        seasonality: seasonalityFactor,
      },
    };
  }

  private async calculateReliabilityScore(contractorId: string): Promise<number> {
    const jobs = await this.db.getJobsByContractor(contractorId);
    const reviews = await this.db.getReviewsByContractor(contractorId);
    const quotes = await this.db.getQuotesByContractor(contractorId);

    // Calculate various reliability metrics
    const onTimeCompletion = this.calculateOnTimeCompletion(jobs);
    const responseRate = await this.calculateResponseRate(quotes);
    const reviewScore = this.calculateReviewScore(reviews);
    const cancellationRate = this.calculateCancellationRate(jobs);

    // Weight and combine metrics
    return (
      onTimeCompletion * 0.3 +
      responseRate * 0.2 +
      reviewScore * 0.3 +
      (1 - cancellationRate) * 0.2
    );
  }

  private async calculateWorkloadScore(contractorId: string): Promise<number> {
    const jobs = await this.db.getJobsByContractor(contractorId);
    const activeJobs = jobs.filter(job => 
      job.status === 'in_progress' || job.status === 'scheduled'
    );

    // Calculate current workload
    const currentWorkload = activeJobs.length;
    const maxWorkload = 5; // Maximum concurrent jobs a contractor can handle

    // Calculate future workload based on scheduled jobs
    const scheduledJobs = jobs.filter(job => 
      job.status === 'scheduled' && 
      job.scheduledDate && 
      job.scheduledDate > new Date()
    );

    // Return a score between 0 and 1, where 1 means the contractor is available
    return Math.max(0, 1 - (currentWorkload / maxWorkload));
  }

  private async calculateQualityScore(contractorId: string): Promise<number> {
    const jobs = await this.db.getJobsByContractor(contractorId);
    const reviews = await this.db.getReviewsByContractor(contractorId);
    const jobSheets = await Promise.all(
      jobs.map(job => this.db.getJobSheetByJob(job.id))
    );

    const qualityMetrics: QualityMetrics = {
      onTimeCompletion: this.calculateOnTimeCompletion(jobs),
      customerSatisfaction: this.calculateCustomerSatisfaction(reviews),
      communicationScore: this.calculateCommunicationScore(jobs),
      workmanshipScore: this.calculateWorkmanshipScore(jobSheets),
      safetyCompliance: this.calculateSafetyCompliance(jobSheets),
    };

    // Weight and combine quality metrics
    return (
      qualityMetrics.onTimeCompletion * 0.25 +
      qualityMetrics.customerSatisfaction * 0.25 +
      qualityMetrics.communicationScore * 0.2 +
      qualityMetrics.workmanshipScore * 0.2 +
      qualityMetrics.safetyCompliance * 0.1
    );
  }

  private async calculatePriceScore(contractorId: string, job: Job): Promise<number> {
    const quotes = await this.db.getQuotesByContractor(contractorId);
    const similarQuotes = quotes.filter(quote => 
      quote.jobId && quote.jobId !== job.id
    );

    if (similarQuotes.length === 0) return 0.5; // Default score if no historical data

    // Calculate price competitiveness
    const averageQuote = similarQuotes.reduce((sum, quote) => 
      sum + (quote.amount || 0), 0
    ) / similarQuotes.length;

    const pricePrediction = await this.predictJobPrice(job.id);
    const priceDifference = Math.abs(averageQuote - pricePrediction.estimatedPrice);
    const priceScore = 1 - (priceDifference / pricePrediction.estimatedPrice);

    return Math.max(0, Math.min(1, priceScore));
  }

  private calculateMatchScore(scores: {
    reliabilityScore: number;
    workloadScore: number;
    qualityScore: number;
    priceScore: number;
  }): number {
    // Weight and combine all scores
    return (
      scores.reliabilityScore * 0.3 +
      scores.workloadScore * 0.2 +
      scores.qualityScore * 0.3 +
      scores.priceScore * 0.2
    );
  }

  private async findSimilarJobs(job: Job): Promise<Job[]> {
    const allJobs = await this.db.getAllJobs();
    return allJobs.filter(j => 
      j.tradeId === job.tradeId &&
      j.status === 'completed' &&
      j.id !== job.id
    );
  }

  private async getHistoricalQuotes(jobs: Job[]): Promise<Quote[]> {
    const quotes: Quote[] = [];
    for (const job of jobs) {
      const jobQuotes = await this.db.getQuotesByJob(job.id);
      quotes.push(...jobQuotes);
    }
    return quotes;
  }

  private async calculateTradePriceFactor(tradeId: number): Promise<number> {
    const jobs = await this.db.getAllJobs();
    const tradeJobs = jobs.filter(job => job.tradeId === tradeId);
    const completedJobs = tradeJobs.filter(job => job.status === 'completed');
    
    if (completedJobs.length === 0) return 1;

    const averagePrice = completedJobs.reduce((sum, job) => 
      sum + (job.actualCost || 0), 0
    ) / completedJobs.length;

    const globalAverage = jobs.reduce((sum, job) => 
      sum + (job.actualCost || 0), 0
    ) / jobs.length;

    return averagePrice / globalAverage;
  }

  private async calculateLocationPriceFactor(location: string | null): Promise<number> {
    if (!location) return 1;
    
    const jobs = await this.db.getAllJobs();
    const locationJobs = jobs.filter(job => 
      job.location === location && job.status === 'completed'
    );
    
    if (locationJobs.length === 0) return 1;

    const locationAverage = locationJobs.reduce((sum, job) => 
      sum + (job.actualCost || 0), 0
    ) / locationJobs.length;

    const globalAverage = jobs.reduce((sum, job) => 
      sum + (job.actualCost || 0), 0
    ) / jobs.length;

    return locationAverage / globalAverage;
  }

  private calculateComplexityFactor(job: Job): number {
    // Implement complexity scoring based on job description, requirements, etc.
    // This is a simplified version
    const complexityKeywords = [
      'urgent', 'emergency', 'complex', 'extensive', 'multiple',
      'specialized', 'technical', 'detailed', 'custom'
    ];

    const description = job.description.toLowerCase();
    const keywordCount = complexityKeywords.filter(keyword => 
      description.includes(keyword)
    ).length;

    return 1 + (keywordCount * 0.1); // 10% increase per complexity keyword
  }

  private calculateSeasonalityFactor(): number {
    const month = new Date().getMonth();
    // Higher prices during peak seasons (summer for outdoor work, winter for heating)
    const seasonalFactors = {
      5: 1.2,  // June
      6: 1.2,  // July
      7: 1.2,  // August
      11: 1.1, // December
      0: 1.1,  // January
      1: 1.1,  // February
    };

    return seasonalFactors[month as keyof typeof seasonalFactors] || 1;
  }

  private calculateWeightedPrice(
    historicalQuotes: Quote[],
    tradeFactor: number,
    locationFactor: number,
    complexityFactor: number,
    seasonalityFactor: number
  ): number {
    if (historicalQuotes.length === 0) return 0;

    const averageQuote = historicalQuotes.reduce((sum, quote) => 
      sum + (quote.amount || 0), 0
    ) / historicalQuotes.length;

    return averageQuote * tradeFactor * locationFactor * complexityFactor * seasonalityFactor;
  }

  private calculatePriceConfidence(sampleSize: number): number {
    // Confidence increases with sample size, maxing out at 0.95
    return Math.min(0.95, 0.5 + (sampleSize * 0.05));
  }

  private calculateOnTimeCompletion(jobs: Job[]): number {
    const completedJobs = jobs.filter(job => job.status === 'completed');
    if (completedJobs.length === 0) return 0;

    const onTimeJobs = completedJobs.filter(job => {
      const estimatedDate = job.scheduledDate;
      const completedDate = job.paidAt;
      if (!estimatedDate || !completedDate) return true;
      return completedDate <= estimatedDate;
    });

    return onTimeJobs.length / completedJobs.length;
  }

  private async calculateResponseRate(quotes: Quote[]): Promise<number> {
    try {
      if (quotes.length === 0) return 0;

      const quickResponses = await Promise.all(
        quotes.map(async quote => {
          try {
            const job = await this.db.getJob(quote.jobId);
            if (!job || !quote.createdAt || !job.createdAt) return false;
            
            const responseTime = Number(quote.createdAt.getTime() - job.createdAt.getTime());
            const isQuickResponse = responseTime <= 24 * 60 * 60 * 1000; // 24 hours
            
            // Additional metrics for response quality
            const hasDetailedQuote = quote.description && quote.description.length > 50;
            const hasPriceBreakdown = quote.amount !== null;
            
            return isQuickResponse && hasDetailedQuote && hasPriceBreakdown;
          } catch (error) {
            console.error('Error processing quote response:', error);
            return false;
          }
        })
      );

      return quickResponses.filter(Boolean).length / quotes.length;
    } catch (error) {
      console.error('Error calculating response rate:', error);
      return 0;
    }
  }

  private calculateReviewScore(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length / 5;
  }

  private calculateCancellationRate(jobs: Job[]): number {
    if (jobs.length === 0) return 0;
    const cancelledJobs = jobs.filter(job => job.status === 'cancelled');
    return cancelledJobs.length / jobs.length;
  }

  private calculateCustomerSatisfaction(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length / 5;
  }

  private calculateCommunicationScore(jobs: Job[]): number {
    // Implement communication scoring based on message response times, clarity, etc.
    // This is a simplified version
    return 0.8; // Default score
  }

  private calculateWorkmanshipScore(jobSheets: (JobSheet | undefined)[]): number {
    // Implement workmanship scoring based on job sheet quality, completion details, etc.
    // This is a simplified version
    return 0.8; // Default score
  }

  private calculateSafetyCompliance(jobSheets: (JobSheet | undefined)[]): number {
    // Implement safety compliance scoring based on safety checks, incident reports, etc.
    // This is a simplified version
    return 0.9; // Default score
  }

  private async calculateDetailedQualityMetrics(contractorId: string): Promise<QualityMetricsDetail> {
    const [jobs, reviews, jobSheets] = await Promise.all([
      this.db.getJobsByContractor(contractorId),
      this.db.getReviewsByContractor(contractorId),
      Promise.all((await this.db.getJobsByContractor(contractorId))
        .map(job => this.db.getJobSheetByJob(job.id)))
    ]);

    const quotes = await this.db.getQuotesByContractor(contractorId);

    return {
      workmanship: {
        attentionToDetail: this.calculateWorkmanshipScore(jobSheets),
        materialQuality: this.calculateWorkmanshipScore(jobSheets),
        finishQuality: this.calculateWorkmanshipScore(jobSheets),
        complianceWithStandards: this.calculateSafetyCompliance(jobSheets)
      },
      safety: {
        safetyProtocols: this.calculateSafetyCompliance(jobSheets),
        incidentRate: this.calculateSafetyCompliance(jobSheets),
        equipmentMaintenance: this.calculateSafetyCompliance(jobSheets),
        trainingCompliance: this.calculateSafetyCompliance(jobSheets)
      },
      communication: {
        responseTime: await this.calculateAverageResponseTime(quotes),
        clarity: this.calculateCommunicationScore(jobs),
        professionalism: this.calculateCommunicationScore(jobs),
        documentation: this.calculateCommunicationScore(jobs)
      },
      customerSatisfaction: {
        overallRating: this.calculateCustomerSatisfaction(reviews),
        repeatBusiness: this.calculateCustomerSatisfaction(reviews),
        referralRate: this.calculateCustomerSatisfaction(reviews),
        complaintResolution: this.calculateCustomerSatisfaction(reviews)
      }
    };
  }

  private async calculateContractorMetrics(contractorId: string): Promise<ContractorMetrics> {
    const [reliabilityScore, workloadScore, qualityScore, priceScore] = await Promise.all([
      this.calculateReliabilityScore(contractorId),
      this.calculateWorkloadScore(contractorId),
      this.calculateQualityScore(contractorId),
      this.calculatePriceScore(contractorId, {} as Job)
    ]);

    const matchScore = this.calculateMatchScore({
      reliabilityScore,
      workloadScore,
      qualityScore,
      priceScore,
    });

    return {
      reliabilityScore,
      workloadScore,
      qualityScore,
      priceScore,
      matchScore,
      lastUpdated: new Date()
    };
  }

  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    if (this.metricsUpdateTimer) {
      clearInterval(this.metricsUpdateTimer);
      this.metricsUpdateTimer = undefined;
    }
    if (this.revalidationTimer) {
      clearInterval(this.revalidationTimer);
      this.revalidationTimer = undefined;
    }
    this.cache.clear();
    this.metrics.clear();
    this.removeAllListeners();
  }
} 