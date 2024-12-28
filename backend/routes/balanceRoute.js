import express from 'express';
import {
  getAllBalance,
  getMonthlyBalance,
  getTotalBalance
} from '../controllers/balanceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/total", protect, getTotalBalance);
router.post("/all", protect, getAllBalance);
router.post("/monthly", protect, getMonthlyBalance);

export default router;