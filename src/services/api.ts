import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000/api',
});

export interface Job {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'pending';
  location: string;
  date: string;
  description?: string;
  budget?: number;
  clientId?: string;
  contractorId?: string;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  jobId: string;
  contractorId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  contractor?: {
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
  };
}

export interface Stats {
  activeJobs: number;
  completedJobs: number;
  earnings: number;
  activeJobsTrend: number;
  completedJobsTrend: number;
  earningsTrend: number;
}

export const fetchJobs = async (filter: string): Promise<Job[]> => {
  const { data } = await api.get(`/jobs?filter=${filter}`);
  return data;
};

export const fetchStats = async (): Promise<Stats> => {
  const { data } = await api.get('/stats');
  return data;
};

export const createJob = async (job: Omit<Job, 'id'>): Promise<Job> => {
  const { data } = await api.post('/jobs', job);
  return data;
};

export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job> => {
  const { data } = await api.patch(`/jobs/${id}`, updates);
  return data;
};

export const deleteJob = async (id: string): Promise<void> => {
  await api.delete(`/jobs/${id}`);
};

// Bidding endpoints
export const createBid = async (jobId: string, bid: Omit<Bid, 'id' | 'jobId' | 'status' | 'createdAt'>): Promise<Bid> => {
  const { data } = await api.post(`/jobs/${jobId}/bids`, bid);
  return data;
};

export const updateBid = async (jobId: string, bidId: string, status: 'accepted' | 'rejected'): Promise<Bid> => {
  const { data } = await api.patch(`/jobs/${jobId}/bids/${bidId}`, { status });
  return data;
};

export const fetchBidsForJob = async (jobId: string): Promise<Bid[]> => {
  const { data } = await api.get(`/jobs/${jobId}/bids`);
  return data;
};

export const fetchMyBids = async (): Promise<Bid[]> => {
  const { data } = await api.get('/bids/me');
  return data;
}; 