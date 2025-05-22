export const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_123',
      client_secret: 'mock_client_secret',
    }),
  },
  refunds: {
    create: jest.fn().mockResolvedValue({
      id: 're_123',
      status: 'succeeded',
    }),
  },
  charges: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'ch_123',
      receipt_url: 'https://receipt.stripe.com/test',
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockImplementation((body, signature, secret) => {
      if (!signature) {
        throw new Error('No signature provided');
      }
      return body;
    }),
  },
  errors: {
    StripeError: class StripeError extends Error {
      constructor(message?: string) {
        super(message);
        this.name = 'StripeError';
      }
      type = 'StripeError';
      statusCode = 500;
    },
    StripeCardError: class StripeCardError extends Error {
      constructor(message?: string) {
        super(message || 'Card error');
        this.name = 'StripeCardError';
      }
      type = 'card_error';
      statusCode = 402;
      code = 'card_declined';
      decline_code = 'generic_decline';
    },
    StripeInvalidRequestError: class StripeInvalidRequestError extends Error {
      constructor(message?: string) {
        super(message || 'Invalid request');
        this.name = 'StripeInvalidRequestError';
      }
      type = 'invalid_request_error';
      statusCode = 400;
    },
  },
}; 