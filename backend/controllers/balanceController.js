import asyncHandler from "express-async-handler";
import Income from "../models/incomeModel.js";
import Expense from "../models/expenseModel.js";
import Balance from "../models/balanceModel.js";
import { toCamelCase, toDecimal128 } from "../utils/helper.js";

// @desc    Get all balance
// route    GET /api/balances
// @access  Private
const getAllBalance = asyncHandler(async (req, res) => {
  try {
    const { page, size } = req.params;
    const { startDate, endDate, sortBy, q } = req.body;
    const userId = req.user._id;

    const pageNum = parseInt(page || "1", 10);
    const sizeNum = parseInt(size || "10", 10);
    const offset = (pageNum - 1) * sizeNum;

    // Build the query object
    const query = { user: userId }; // Filter by userId by default

    // Handle date filters if present
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter for 'q'
    if (q && q !== "") {
      // First, find matching Income and Expense documents
      const [matchingIncomes, matchingExpenses] = await Promise.all([
        Income.find({ 
          user: userId,
          source: { $regex: q, $options: "i" }
        }).select('_id'),
        Expense.find({ 
          user: userId,
          tag: { $regex: q, $options: "i" }
        }).select('_id')
      ]);

      // Add conditions to find Balance documents that reference these matches
      query.$or = [
        { income: { $in: matchingIncomes.map(i => i._id) } },
        { expense: { $in: matchingExpenses.map(e => e._id) } }
      ];
    }

    // Sorting logic
    const sortOrder = sortBy?.orderBy?.toUpperCase() === "ASC" ? 1 : -1;
    const sortColumn = sortBy?.column ? toCamelCase(sortBy.column) : "createdAt";

    const balances = await Balance.find(query)
      .sort({ [sortColumn]: sortOrder })
      .skip(offset)
      .limit(sizeNum)
      .populate("income", "source")
      .populate("expense", "tag");

    const totalRecords = await Balance.countDocuments(query);

    const formattedResult = balances
      ? balances.map((item) => ({
          _id: item._id,
          start: item.start.toString(),
          in: item.in.toString(),
          out: item.out.toString(),
          end: item.end.toString(),
          income: item.income ? item.income.source : null,
          expense: item.expense ? item.expense.tag : null,
          user: item.user._id,
          createdAt: item.createdAt,
        }))
      : [];

    res.status(200).json({
      data: formattedResult,
      metadata: {
        totalRecords,
        page: pageNum,
        size: sizeNum,
        totalPages: Math.ceil(totalRecords / sizeNum),
      },
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occurred. Please try again.");
  }
});

// @desc    Get total balance
// route    GET /api/balances/total
// @access  Private
const getTotalBalance = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    const latestBalance = await Balance.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      totalBalance: latestBalance ? latestBalance.end.toString() : "0.00",
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occured. Please try again");
  }
});

// @desc    Get monthly balance
// route    GET /api/balances/monthly
// @access  Private
const getMonthlyBalance = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    // Aggregation pipeline
    const monthlyBalance = await Balance.aggregate([
      {
        $match: {
          user: userId,
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalIncome: { $sum: "$in" },
          totalExpense: { $sum: "$out" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }, // Sort by year and month
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                  { $subtract: ["$_id.month", 1] },
                ],
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          totalIncome: { $toString: "$totalIncome" },
          totalExpense: { $toString: "$totalExpense" },
        },
      },
    ]);

    // Format result for months with zero data
    const result = [];
    let currentDate = new Date(startDate);

    // Normalize currentDate to the first day of the month
    currentDate.setDate(1);

    while (currentDate <= new Date(endDate)) {
      const monthYear = `${currentDate.toLocaleString("default", {
        month: "short",
      })} ${currentDate.getFullYear()}`;

      const monthData = monthlyBalance.find((item) => item.month === monthYear);

      result.push({
        month: monthYear,
        income: monthData ? monthData.totalIncome : "0.00",
        expense: monthData ? monthData.totalExpense : "0.00",
        total: monthData
          ? (
              parseFloat(monthData.totalIncome) -
              parseFloat(monthData.totalExpense)
            ).toFixed(2)
          : "0.00",
      });

      // Move to the next month (always set to the 1st to avoid rollover issues)
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occured. Please try again");
  }
});

export { getAllBalance, getTotalBalance, getMonthlyBalance };
