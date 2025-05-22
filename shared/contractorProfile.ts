export interface Certification {
  name: string;
  issuingBody: string;
  issueDate: Date;
  expiryDate?: Date;
  verificationUrl?: string;
  verified: boolean;
}

export interface Experience {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
}

export interface ContractorProfile {
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

export type InsertContractorProfile = Omit<ContractorProfile, 'badges' | 'profileStatus' | 'moderationNotes' | 'lastModerated' | 'moderatedBy'> & {
  badges?: Partial<ContractorProfile['badges']>;
  profileStatus?: ContractorProfile['profileStatus'];
}; 