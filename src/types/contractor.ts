export interface ContractorRating {
  average: number;
  count: number;
  breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ContractorLocation {
  latitude: number;
  longitude: number;
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: ContractorLocation;
  rating: ContractorRating;
  specialties: string[];
  completionRate: number;
  responseTime: number; // in minutes
  activeJobs: number;
  availability: {
    start: string;
    end: string;
    days: string[];
  };
  verified: boolean;
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
} 