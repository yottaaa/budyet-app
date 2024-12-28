import express from 'express';
import {
  getAllIncome,
  createIncome,
  getTotalIncome,
  getMonthlyIncome
} from '../controllers/incomeController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("", protect, createIncome);
router.get("/total", protect, getTotalIncome);
router.post("/all", protect, getAllIncome);
router.post("/monthly", protect, getMonthlyIncome);

export default router;