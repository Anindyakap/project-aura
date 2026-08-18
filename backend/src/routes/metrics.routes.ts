// src/routes/metrics.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getMetricsSummary, getMetricsChart } from '../controllers/metrics.controller';
import { validate } from '../middleware/validate';
import { metricsChartSchema, metricsSummarySchema } from '../utils/validation';

const router = Router();

// All metrics routes require login
router.get('/summary', protect, validate(metricsSummarySchema), getMetricsSummary);
router.get('/chart',   protect, validate(metricsChartSchema), getMetricsChart);

export default router;
