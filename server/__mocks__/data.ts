export const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  token: 'mock_token',
  adminToken: 'mock_admin_token',
};

export const mockJob = {
  id: 'job_123',
  title: 'Test Job',
  description: 'Test job description',
  status: 'pending',
  estimatedCost: 1000,
  clientId: 'user_123',
  contractorId: 'contractor_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  paymentStatus: 'pending',
};

export const mockPaymentIntent = {
  id: 'pi_123',
  amount: 1000,
  currency: 'gbp',
  status: 'succeeded',
  client_secret: 'mock_client_secret',
  metadata: {
    jobId: 'job_123',
    userId: 'user_123',
  },
  latest_charge: 'ch_123',
}; 