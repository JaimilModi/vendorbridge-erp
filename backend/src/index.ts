import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// APIs
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`VendorBridge ERP backend server is running on port ${PORT}`);
});

export default app;
