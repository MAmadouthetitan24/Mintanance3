import { User, Job, ContractorTrade } from '@shared/schema';
import { storage } from '../storage';
import axios from 'axios';

interface GeoPoint {
  lat: number;
  lng: number;
}

class GeocodingError extends Error {
  code: string;
  details?: any;

  constructor(message: string) {
    super(message);
    this.name = 'GeocodingError';
    this.code = 'GEOCODING_ERROR';
  }
}

interface ContractorScore {
  contractor: User;
  score: number;
  distance: number;
}

interface DistributionConfig {
  maxRadius: number; // in kilometers
  minRating: number;
  maxContractors: number;
  initialBatchSize: number;
  waitTimePerBatch: number; // in hours
  qualityWeight: number;
  distanceWeight: number;
  activityWeight: number;
}

const DEFAULT_CONFIG: DistributionConfig = {
  maxRadius: 50, // 50km radius
  minRating: 3.0, // minimum 3-star rating
  maxContractors: 10, // maximum contractors to notify
  initialBatchSize: 3, // first batch size
  waitTimePerBatch: 4, // hours to wait before expanding search
  qualityWeight: 0.5,
  distanceWeight: 0.3,
  activityWeight: 0.2,
};

// Calculate distance between two points using Haversine formula
function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// Calculate contractor's activity score based on recent jobs and response times
async function calculateActivityScore(contractor: User): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get contractor's recent jobs
  const recentJobs = await storage.getJobsByContractor(contractor.id);
  const completedJobs = recentJobs.filter((job: Job) => 
    job.status === 'completed' && 
    job.updatedAt && new Date(job.updatedAt) >= thirtyDaysAgo
  );

  // Calculate completion rate
  const totalJobs = recentJobs.length || 1;
  const completionRate = completedJobs.length / totalJobs;

  // Calculate average response time (in hours)
  const responseTimeScores = await Promise.all(
    recentJobs.map(async (job: Job) => {
      const proposals = await storage.getAppointmentProposalsByJob(job.id);
      const contractorProposals = proposals.filter(p => p.status !== 'rejected');
      
      if (!contractorProposals.length || !job.createdAt) return null;
      
      // Get the first response time
      const jobCreatedAt = new Date(job.createdAt);
      const firstResponse = contractorProposals[0].createdAt 
        ? new Date(contractorProposals[0].createdAt)
        : null;
        
      if (!firstResponse) return null;
      
      const responseTime = (firstResponse.getTime() - jobCreatedAt.getTime()) / (1000 * 60 * 60); // hours
      
      // Score from 0-1, where 0 is 48+ hours and 1 is immediate response
      return Math.max(0, 1 - (responseTime / 48));
    })
  );

  // Calculate average response time score
  const validResponseScores = responseTimeScores.filter((score): score is number => score !== null);
  const averageResponseScore = validResponseScores.length > 0 
    ? validResponseScores.reduce((a, b) => a + b, 0) / validResponseScores.length
    : 0.5; // Default score for new contractors

  // Calculate job volume score (0-1)
  const volumeScore = Math.min(totalJobs / 10, 1);

  // Weighted activity score components
  const weights = {
    completionRate: 0.4,
    responseTime: 0.4,
    volume: 0.2
  };

  return (
    (completionRate * weights.completionRate) +
    (averageResponseScore * weights.responseTime) +
    (volumeScore * weights.volume)
  );
}

// Calculate overall contractor score
async function calculateContractorScore(
  contractor: User,
  jobLocation: GeoPoint,
  contractorLocation: GeoPoint,
  config: DistributionConfig
): Promise<ContractorScore> {
  const distance = calculateDistance(jobLocation, contractorLocation);
  
  // Calculate normalized scores (0-1 range)
  const qualityScore = (contractor.averageRating || 0) / 5;
  const distanceScore = Math.max(0, 1 - (distance / config.maxRadius));
  const activityScore = await calculateActivityScore(contractor);

  // Calculate weighted score
  const score = 
    (qualityScore * config.qualityWeight) +
    (distanceScore * config.distanceWeight) +
    (activityScore * config.activityWeight);

  return {
    contractor,
    score,
    distance
  };
}

// Get location from address string using Google Maps Geocoding API
async function getLocationFromAddress(address: string | null): Promise<GeoPoint> {
  if (!address) {
    throw new GeocodingError('No address provided');
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new GeocodingError(`Geocoding failed: ${response.data.status}`);
    }

    const location = response.data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng
    };
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }
    
    const geoError = new GeocodingError('Failed to geocode address');
    geoError.code = 'GEOCODING_ERROR';
    geoError.details = error;
    throw geoError;
  }
}

// Main distribution algorithm with enhanced error handling
export async function findMatchingContractors(
  job: Job,
  config: Partial<DistributionConfig> = {}
): Promise<User[]> {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Get job location
    let jobLocation: GeoPoint;
    try {
      jobLocation = await getLocationFromAddress(job.location);
    } catch (error) {
      console.error('Failed to geocode job location:', error);
      throw new Error('Unable to determine job location');
    }
    
    // Get all contractors with matching trade
    const contractorTrades = await storage.getContractorsByTrade(job.tradeId || 0);
    if (!contractorTrades.length) {
      throw new Error('No contractors found for the specified trade');
    }
    
    // Get contractor details and calculate scores
    const contractorScores = await Promise.all(
      contractorTrades.map(async (ct: ContractorTrade) => {
        try {
          const contractor = await storage.getUser(ct.contractorId);
          if (!contractor || !contractor.isActive || (contractor.averageRating || 0) < finalConfig.minRating) {
            return null;
          }

          let contractorLocation: GeoPoint;
          try {
            contractorLocation = await getLocationFromAddress(contractor.address);
          } catch (error) {
            console.error(`Failed to geocode contractor location for ${contractor.id}:`, error);
            return null;
          }

          return calculateContractorScore(contractor, jobLocation, contractorLocation, finalConfig);
        } catch (error) {
          console.error(`Error processing contractor ${ct.contractorId}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and sort by score
    const validScores = contractorScores
      .filter((score): score is ContractorScore => score !== null)
      .filter((score: ContractorScore) => score.distance <= finalConfig.maxRadius)
      .sort((a: ContractorScore, b: ContractorScore) => b.score - a.score);

    if (!validScores.length) {
      throw new Error('No eligible contractors found within the specified radius');
    }

    // Implement tiered access and fair rotation
    const selectedContractors = await implementTieredAccess(validScores, job, finalConfig);
    
    return selectedContractors;
  } catch (error) {
    console.error('Error in findMatchingContractors:', error);
    throw error;
  }
}

// Implement tiered access and fair rotation
async function implementTieredAccess(
  scores: ContractorScore[],
  job: Job,
  config: DistributionConfig
): Promise<User[]> {
  const selectedContractors: User[] = [];
  const now = new Date();

  // First tier: Top-rated contractors within close proximity
  const topTier = scores.filter(score => 
    (score.contractor.averageRating || 0) >= 4.5 && 
    score.distance <= config.maxRadius * 0.3
  );

  // Second tier: Good-rated contractors within medium proximity
  const secondTier = scores.filter(score =>
    (score.contractor.averageRating || 0) >= 4.0 &&
    score.distance <= config.maxRadius * 0.6 &&
    !topTier.includes(score)
  );

  // Third tier: All other qualifying contractors
  const thirdTier = scores.filter(score =>
    !topTier.includes(score) && !secondTier.includes(score)
  );

  // Function to add contractors from a tier
  const addFromTier = async (tier: ContractorScore[], count: number) => {
    // Sort by last job date to implement fair rotation
    const withLastJob = await Promise.all(
      tier.map(async (score) => {
        const lastJob = await storage.getLastJobByContractor(score.contractor.id);
        return {
          ...score,
          lastJobDate: lastJob?.createdAt ? new Date(lastJob.createdAt) : new Date(0)
        };
      })
    );

    // Prioritize contractors who haven't had recent jobs
    withLastJob.sort((a, b) => a.lastJobDate.getTime() - b.lastJobDate.getTime());

    // Add contractors up to the count
    for (let i = 0; i < Math.min(count, withLastJob.length); i++) {
      selectedContractors.push(withLastJob[i].contractor);
    }
  };

  // Add contractors in batches based on tiers
  await addFromTier(topTier, config.initialBatchSize);
  
  if (selectedContractors.length < config.maxContractors) {
    await addFromTier(secondTier, config.initialBatchSize);
  }
  
  if (selectedContractors.length < config.maxContractors) {
    await addFromTier(thirdTier, config.maxContractors - selectedContractors.length);
  }

  return selectedContractors;
}

// Notify contractors about new job opportunity with enhanced details
export async function notifyMatchingContractors(job: Job, contractors: User[]): Promise<void> {
  const jobOwner = await storage.getUser(job.homeownerId);
  const ownerName = jobOwner 
    ? `${jobOwner.firstName || ''} ${jobOwner.lastName || ''}`.trim()
    : '';
  
  for (const contractor of contractors) {
    // Calculate estimated travel time and distance
    const contractorLocation = await getLocationFromAddress(contractor.address);
    const jobLocation = await getLocationFromAddress(job.location);
    const distance = calculateDistance(contractorLocation, jobLocation);
    
    // Format distance for display
    const formattedDistance = distance < 1 
      ? `${Math.round(distance * 1000)}m`
      : `${Math.round(distance * 10) / 10}km`;

    // Create detailed notification
    await storage.createNotification({
      userId: contractor.id,
      type: 'job_request',
      title: `New Job Opportunity`,
      message: `A new job matching your expertise is available${ownerName ? ` from ${ownerName}` : ''}.`,
      data: {
        jobId: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        distance: formattedDistance,
        status: job.status,
        preferredDate: job.preferredDate,
        tradeId: job.tradeId,
        createdAt: job.createdAt
      },
      createdAt: new Date(),
      read: false
    });
  }
} 