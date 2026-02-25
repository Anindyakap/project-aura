// src/routes/metrics.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getMetricsSummary, getMetricsChart } from '../controllers/metrics.controller';

const router = Router();

// All metrics routes require login
router.get('/summary', protect, getMetricsSummary);
router.get('/chart',   protect, getMetricsChart);

export default router;