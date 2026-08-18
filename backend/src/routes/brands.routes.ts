// src/routes/brands.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getBrands, createBrand } from '../controllers/brands.controller';
import { validate } from '../middleware/validate';
import { createBrandSchema } from '../utils/validation';

const router = Router();

// All brand routes require login
router.get('/', protect, getBrands);
router.post('/', protect, validate(createBrandSchema), createBrand);

export default router;
