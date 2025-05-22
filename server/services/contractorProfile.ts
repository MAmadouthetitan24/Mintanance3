import { storage } from '../storage';
import { User, ContractorTrade, Review, Job } from '@shared/schema';

interface Certification {
  name: string;
  issuingBody: string;
  issueDate: Date;
  expiryDate?: Date;
  verificationUrl?: string;
  verified: boolean;
}

interface Experience {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
}

interface ContractorProfile {
  userId: string;
  bio: string;
  yearsOfExperience: number;
  specializations: string[];
  certifications: Certification[];
  experience: Experience[];
  education: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
    coverageAmount: number;
    verified: boolean;
  };
  badges: {
    topRated: boolean;
    verified: boolean;
    premiumContractor: boolean;
    backgroundChecked: boolean;
  };
  profileStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  moderationNotes?: string;
  lastModerated?: Date;
  moderatedBy?: string;
}

export async function createContractorProfile(userId: string, profile: Partial<ContractorProfile>): Promise<ContractorProfile> {
  // Verify user is a contractor
  const user = await storage.getUser(userId);
  if (!user || user.role !== 'contractor') {
    throw new Error('Only contractors can create profiles');
  }

  // Create default profile structure
  const newProfile = {
    userId,
    bio: profile.bio || '',
    yearsOfExperience: profile.yearsOfExperience || 0,
    specializations: profile.specializations || [],
    certifications: profile.certifications || [],
    experience: profile.experience || [],
    education: profile.education || [],
    badges: {
      topRated: false,
      verified: false,
      premiumContractor: false,
      backgroundChecked: false
    },
    profileStatus: 'pending' as const
  };

  return await storage.createContractorProfile(newProfile);
}

export async function updateContractorProfile(
  userId: string, 
  updates: Partial<ContractorProfile>
): Promise<ContractorProfile> {
  const profile = await storage.getContractorProfile(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Don't allow updating certain fields directly
  const safeUpdates = { ...updates };
  delete safeUpdates.badges;
  delete safeUpdates.profileStatus;
  delete safeUpdates.moderationNotes;
  delete safeUpdates.lastModerated;
  delete safeUpdates.moderatedBy;

  return await storage.updateContractorProfile(userId, safeUpdates);
}

export async function moderateProfile(
  profileId: string,
  moderatorId: string,
  decision: 'approved' | 'rejected' | 'suspended',
  notes?: string
): Promise<ContractorProfile> {
  const moderator = await storage.getUser(moderatorId);
  if (!moderator || moderator.role !== 'admin') {
    throw new Error('Only administrators can moderate profiles');
  }

  return await storage.updateContractorProfile(profileId, {
    profileStatus: decision,
    moderationNotes: notes,
    lastModerated: new Date(),
    moderatedBy: moderatorId
  });
}

export async function getVisibleContractorProfile(
  contractorId: string,
  homeownerId: string
): Promise<ContractorProfile | null> {
  // Check if homeowner has any jobs with this contractor
  const jobs = await storage.getJobsByHomeowner(homeownerId);
  const hasAssignedJob = jobs.some((job: Job) => 
    job.contractorId === contractorId && 
    ['assigned', 'in_progress', 'completed'].includes(job.status)
  );

  if (!hasAssignedJob) {
    return null;
  }

  return await storage.getContractorProfile(contractorId);
}

export async function awardBadge(
  contractorId: string,
  badge: keyof ContractorProfile['badges']
): Promise<ContractorProfile> {
  const profile = await storage.getContractorProfile(contractorId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Verify badge eligibility
  if (badge === 'topRated') {
    const reviews = await storage.getReviewsByContractor(contractorId);
    const averageRating = reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length;
    if (averageRating < 4.5 || reviews.length < 10) {
      throw new Error('Contractor does not qualify for top rated badge');
    }
  }

  // Update badge
  const updatedBadges = {
    ...profile.badges,
    [badge]: true
  };

  return await storage.updateContractorProfile(contractorId, { badges: updatedBadges });
}

export async function verifyContractorCredentials(
  contractorId: string,
  certificationId: string,
  adminId: string,
  verified: boolean
): Promise<ContractorProfile> {
  const profile = await storage.getContractorProfile(contractorId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  const admin = await storage.getUser(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Only administrators can verify credentials');
  }

  const updatedCertifications = profile.certifications.map((cert: Certification) => 
    cert.name === certificationId ? { ...cert, verified } : cert
  );

  return await storage.updateContractorProfile(contractorId, {
    certifications: updatedCertifications
  });
} 