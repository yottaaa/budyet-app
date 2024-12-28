import express from 'express';
import {
  getAllExpense,
  createExpense,
  getTotalExpense,
  getMonthlyExpense,
  getAllTags
} from '../controllers/expenseController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("", protect, createExpense);
router.get("/total", protect, getTotalExpense);
router.post("/all", protect, getAllExpense);
router.post("/monthly", protect, getMonthlyExpense);
router.get("/tags", protect, getAllTags);

export default router;