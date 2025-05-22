import { ContractorRating } from '../types/contractor';

interface Location {
  latitude: number;
  longitude: number;
}

interface Contractor {
  id: string;
  location: Location;
  rating: ContractorRating;
  specialties: string[];
  completionRate: number;
  responseTime: number; // in minutes
  activeJobs: number;
}

interface Job {
  id: string;
  location: Location;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in hours
}

export class JobBiddingService {
  private static readonly MAX_DISTANCE_KM = 50;
  private static readonly QUALITY_WEIGHT = 0.4;
  private static readonly DISTANCE_WEIGHT = 0.3;
  private static readonly WORKLOAD_WEIGHT = 0.3;

  /**
   * Calculate contractor score based on multiple factors
   */
  private calculateContractorScore(
    contractor: Contractor,
    job: Job,
    currentTime: Date
  ): number {
    // Quality Score (40%)
    const qualityScore =
      (contractor.rating.average * 0.5 +
        contractor.completionRate * 0.3 +
        (1 - contractor.responseTime / 60) * 0.2) *
      JobBiddingService.QUALITY_WEIGHT;

    // Distance Score (30%)
    const distance = this.calculateDistance(contractor.location, job.location);
    const distanceScore =
      (1 - distance / JobBiddingService.MAX_DISTANCE_KM) * JobBiddingService.DISTANCE_WEIGHT;

    // Workload Score (30%)
    const workloadScore =
      (1 - contractor.activeJobs / 5) * JobBiddingService.WORKLOAD_WEIGHT;

    return qualityScore + distanceScore + workloadScore;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Distribute job to contractors based on smart ranking
   */
  async distributeJob(
    job: Job,
    availableContractors: Contractor[]
  ): Promise<Contractor[]> {
    const currentTime = new Date();
    
    // Filter contractors by distance and calculate scores
    const rankedContractors = availableContractors
      .filter(contractor => {
        const distance = this.calculateDistance(
          contractor.location,
          job.location
        );
        return distance <= JobBiddingService.MAX_DISTANCE_KM;
      })
      .map(contractor => ({
        contractor,
        score: this.calculateContractorScore(contractor, job, currentTime),
      }))
      .sort((a, b) => b.score - a.score);

    // Implement tiered access - top contractors get first access
    const tiers = [
      rankedContractors.slice(0, 3), // Tier 1: Top 3
      rankedContractors.slice(3, 8), // Tier 2: Next 5
      rankedContractors.slice(8), // Tier 3: Rest
    ];

    return tiers.flat().map(({ contractor }) => contractor);
  }

  /**
   * Update contractor metrics after job completion
   */
  async updateContractorMetrics(
    contractorId: string,
    jobId: string,
    metrics: {
      completionTime: number;
      customerRating: number;
      responseTime: number;
    }
  ): Promise<void> {
    // Implementation would update contractor metrics in the database
    // This would affect their future job distribution priority
  }
} 