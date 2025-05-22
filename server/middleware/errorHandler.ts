import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { sendNotification } from '../services/notifications';

// Custom error classes
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public data?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class RefundError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public data?: any
  ) {
    super(message);
    this.name = 'RefundError';
  }
}

// Error recovery functions
async function handleFailedPayment(jobId: string, error: any) {
  try {
    // Update job status
    await storage.jobs.update({
      where: { id: jobId },
      data: {
        paymentStatus: 'failed',
        updatedAt: new Date(),
        paymentInfo: {
          transactionId: 'failed',
          amount: 0,
          currency: 'gbp',
          status: 'failed',
          method: 'card',
          error: error.message,
        },
      },
    });

    // Get job details for notification
    const job = await storage.getJob(parseInt(jobId));
    if (job?.homeownerId) {
      // Notify customer about failed payment
      await sendNotification(job.homeownerId, {
        type: 'payment',
        title: 'Payment Failed',
        message: `Your payment for job #${jobId} has failed. Please try again.`,
        data: { jobId, error: error.message },
      });
    }
  } catch (recoveryError) {
    console.error('Error in payment failure recovery:', recoveryError);
  }
}

async function handleFailedRefund(refundRequestId: number, error: any) {
  try {
    // Update refund request status
    await storage.updateRefundRequest(refundRequestId, {
      status: 'failed',
      processedAt: new Date(),
      error: error.message,
    });

    // Get refund request details for notification
    const refundRequest = await storage.getRefundRequest(refundRequestId);
    if (refundRequest?.userId) {
      // Notify user about failed refund
      await sendNotification(refundRequest.userId, {
        type: 'payment',
        title: 'Refund Failed',
        message: `Your refund request for job #${refundRequest.jobId} has failed. Our team will review this.`,
        data: { jobId: refundRequest.jobId, error: error.message },
      });

      // Notify admin about failed refund
      await sendNotification('admin', {
        type: 'payment',
        title: 'Refund Failed - Action Required',
        message: `Refund failed for job #${refundRequest.jobId}. Manual review needed.`,
        data: { refundRequestId, jobId: refundRequest.jobId, error: error.message },
      });
    }
  } catch (recoveryError) {
    console.error('Error in refund failure recovery:', recoveryError);
  }
}

// Main error handler middleware
export const paymentErrorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Payment Error:', error);

  // Handle Stripe errors
  if (error instanceof Stripe.errors.StripeError) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An error occurred with the payment service';

    // Handle specific Stripe error types
    switch (error.type) {
      case 'StripeCardError':
      case 'StripeInvalidRequestError':
        res.status(400).json({
          error: {
            code: error.code,
            message: error.message,
            param: (error as any).param,
          },
        });
        return;

      case 'StripeRateLimitError':
        res.status(429).json({
          error: {
            code: 'rate_limit_exceeded',
            message: 'Too many requests. Please try again later.',
          },
        });
        return;

      case 'StripeAuthenticationError':
        res.status(401).json({
          error: {
            code: 'authentication_failed',
            message: 'Payment service authentication failed.',
          },
        });
        return;

      default:
        res.status(statusCode).json({
          error: {
            code: error.code || 'payment_error',
            message,
          },
        });
        return;
    }
  }

  // Handle custom payment errors
  if (error instanceof PaymentError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    });
    return;
  }

  // Handle custom refund errors
  if (error instanceof RefundError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    });
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    error: {
      code: 'internal_server_error',
      message: 'An unexpected error occurred',
    },
  });
  return;
};

export {
  handleFailedPayment,
  handleFailedRefund,
}; 