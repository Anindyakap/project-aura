// backend/src/routes/insights.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getInsights, markAsRead, markAllAsRead, generateInsights
} from '../controllers/insights.controller';

const router = Router();

router.get('/',              protect, getInsights);
router.patch('/read-all',    protect, markAllAsRead);
router.patch('/:id/read',   protect, markAsRead);
router.post('/generate',    protect, generateInsights);

export default router;