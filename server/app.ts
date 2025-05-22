import express, { ErrorRequestHandler } from 'express';
import { paymentErrorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

// Add routes here
// app.use('/api/payments', paymentRoutes);
// app.use('/api/refunds', refundRoutes);

// Error handling
app.use(paymentErrorHandler as ErrorRequestHandler);

export { app }; 