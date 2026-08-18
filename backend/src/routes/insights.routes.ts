// backend/src/routes/insights.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { brandIdQuerySchema, insightIdParamSchema } from '../utils/validation';
import {
  getInsights, markAsRead, markAllAsRead, generateInsights
} from '../controllers/insights.controller';

const router = Router();

router.get('/',              protect, validate(brandIdQuerySchema), getInsights);
router.patch('/read-all',    protect, validate(brandIdQuerySchema), markAllAsRead);
router.patch('/:id/read',    protect, validate(insightIdParamSchema), markAsRead);
router.post('/generate',    protect, generateInsights);

export default router;
