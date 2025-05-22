// Environment-specific configuration
const ENV = {
  dev: {
    API_URL: 'http://localhost:3000',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_key_here',
    SOCKET_URL: 'ws://localhost:3000',
  },
  staging: {
    API_URL: 'https://staging-api.homefixconnector.com',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_key_here',
    SOCKET_URL: 'wss://staging-api.homefixconnector.com',
  },
  prod: {
    API_URL: 'https://api.homefixconnector.com',
    STRIPE_PUBLISHABLE_KEY: 'pk_live_your_key_here',
    SOCKET_URL: 'wss://api.homefixconnector.com',
  },
};

// Set the current environment
const currentEnv = __DEV__ ? 'dev' : 'prod';

// Export configuration for the current environment
export const {
  API_URL,
  STRIPE_PUBLISHABLE_KEY,
  SOCKET_URL,
} = ENV[currentEnv as keyof typeof ENV];

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  JOBS: {
    CREATE: '/jobs',
    LIST: '/jobs',
    DETAIL: (id: string) => `/jobs/${id}`,
    SUBMIT_BID: (id: string) => `/jobs/${id}/bids`,
    ACCEPT_BID: (jobId: string, bidId: string) => `/jobs/${jobId}/bids/${bidId}/accept`,
  },
  APPOINTMENTS: {
    CREATE: '/appointments',
    LIST: '/appointments',
    DETAIL: (id: string) => `/appointments/${id}`,
    UPDATE: (id: string) => `/appointments/${id}`,
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CONTRACTOR_PROFILE: (id: string) => `/users/contractors/${id}`,
  },
  PAYMENTS: {
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM_PAYMENT: '/payments/confirm',
    HISTORY: '/payments/history',
  },
  MESSAGING: {
    CONVERSATIONS: '/messages/conversations',
    MESSAGES: (conversationId: string) => `/messages/conversations/${conversationId}`,
  },
}; 