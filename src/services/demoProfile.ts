export interface DemoProfile {
  id: string;
  name: string;
  email: string;
  role: 'homeowner' | 'contractor';
  avatar?: string;
  phone?: string;
  address?: string;
  rating?: number;
  completedJobs?: number;
  trades?: string[];
  bio?: string;
}

export const DEMO_PROFILES: { [key: string]: DemoProfile } = {
  homeowner: {
    id: 'demo-homeowner',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'homeowner',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  contractor: {
    id: 'demo-contractor',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'contractor',
    phone: '+1 (555) 987-6543',
    address: '456 Oak Ave, Los Angeles, CA',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 4.8,
    completedJobs: 127,
    trades: ['Plumbing', 'Electrical', 'HVAC'],
    bio: 'Professional contractor with over 10 years of experience in plumbing, electrical, and HVAC services.',
  }
};

export function getDemoProfile(role: 'homeowner' | 'contractor' = 'homeowner'): DemoProfile {
  return DEMO_PROFILES[role];
} 