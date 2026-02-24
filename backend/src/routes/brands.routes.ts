// src/routes/brands.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getBrands, createBrand } from '../controllers/brands.controller';

const router = Router();

// All brand routes require login
router.get('/', protect, getBrands);
router.post('/', protect, createBrand);

export default router;
