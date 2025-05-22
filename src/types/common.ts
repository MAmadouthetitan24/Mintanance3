export interface Location {
  latitude: number;
  longitude: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface TimeWindow {
  start: Date;
  end: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

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

export interface WorkingHours {
  monday: TimeWindow[];
  tuesday: TimeWindow[];
  wednesday: TimeWindow[];
  thursday: TimeWindow[];
  friday: TimeWindow[];
  saturday: TimeWindow[];
  sunday: TimeWindow[];
}

export interface Notification {
  id: string;
  type: 'job_request' | 'job_update' | 'payment' | 'message';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  jobId: string;
  customerId: string;
  createdAt: Date;
}

export interface ContactInfo {
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone' | 'both';
}

export interface ServiceArea {
  center: Location;
  radius: number; // in kilometers
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface Availability {
  date: Date;
  timeSlots: TimeWindow[];
  isFullyBooked: boolean;
  specialHours?: TimeWindow[];
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'card' | 'bank_transfer' | 'cash';
  transactionId?: string;
  receiptUrl?: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

export interface SuccessResponse<T> {
  data: T;
  message?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimatedCost: number;
  actualCost?: number;
  contractor?: {
    id: string;
    name: string;
    email: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  completedDate?: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
} 