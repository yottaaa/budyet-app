import asyncHandler from "express-async-handler";
import Expense from "../models/expenseModel.js";
import Income from "../models/incomeModel.js";
import Balance from "../models/balanceModel.js";
import { toDecimal128 } from "../utils/helper.js";

// @desc    Get all expense
// route    POST /api/expenses
// @access  Private
const getAllExpense = asyncHandler(async (req, res) => {
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
      query.$or = [
        { tag: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    // Sorting logic
    const sortOrder = sortBy?.orderBy?.toUpperCase() === "ASC" ? 1 : -1;
    const sortColumn = sortBy?.column
      ? toCamelCase(sortBy.column)
      : "createdAt";

    // Query the database
    const expenses = await Expense.find(query)
      .sort({ [sortColumn]: sortOrder })
      .skip(offset)
      .limit(sizeNum);

    const totalRecords = await Expense.countDocuments(query);

    const formattedResult = expenses.map((item) => ({
      _id: item._id,
      description: item.description,
      tag: item.tag,
      amount: item.amount.toString(),
      user: item.user._id,
      createdAt: item.createdAt,
    }));

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
    throw new Error(error.message || "An error occured. Please try again");
  }
});

// @desc    Create new expense
// route    POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  try {
    const { description, amount, tag } = req.body;
    const userId = req.user._id;

    // validation
    if (!userId) throw new Error("Invalid user");
    if (!description && !amount) throw new Error("Invalid request");

    // check if there is a balance
    const latestBalance = await Balance.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    if (latestBalance) {
      const isValid =
        parseFloat(latestBalance.end.toString()) >
        parseFloat(amount.toString());
      if (!isValid) throw new Error("Insufficient balance");
    }

    // saving expense data
    const newExpense = new Expense({
      amount: toDecimal128(parseFloat(amount)),
      tag,
      description,
      user: userId,
    });

    const createdExpense = await newExpense.save();

    // saving balance data
    let startAmount = toDecimal128(parseFloat(latestBalance.end.toString()));
    let inAmount = toDecimal128(parseFloat("0.00"));
    let outAmount = toDecimal128(parseFloat(createdExpense.amount.toString()));
    // calculation for balance
    const endAmount =
      parseFloat(startAmount.toString()) +
      parseFloat(inAmount.toString()) -
      parseFloat(outAmount.toString());

    const balance = new Balance({
      start: startAmount,
      in: inAmount,
      out: outAmount,
      end: toDecimal128(endAmount.toString()),
      user: userId,
      expense: createdExpense._id,
      income: null,
    });
    await balance.save();

    res.status(201).json({
      _id: createdExpense._id,
      description: createdExpense.description,
      tag: createdExpense.tag,
      amount: createdExpense.amount.toString(),
      user: createdExpense.user._id,
      createdAt: createdExpense.createdAt,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occured. Please try again");
  }
});

// @desc    Get total expense
// route    GET /api/expense/total
// @access  Private
const getTotalExpense = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    const totalAmount = await Expense.aggregate([
      {
        $match: { user: userId },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $toDouble: "$amount" } },
        },
      },
      {
        $project: { totalAmount: 1, _id: 0 },
      },
    ]).then((res) => (res.length > 0 ? res[0].totalAmount.toFixed(2) : "0.00"));

    res.status(200).json({
      totalExpense: totalAmount,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occured. Please try again");
  }
});

// @desc    Get monthly expense
// route    POST /api/expenses/monthly
// @access  Private
const getMonthlyExpense = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    // Aggregation pipeline
    const monthlyIncome = await Expense.aggregate([
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
          total: { $sum: "$amount" },
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
          total: { $toString: "$total" },
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

      const monthData = monthlyIncome.find((item) => item.month === monthYear);

      result.push({
        month: monthYear,
        total: monthData ? monthData.total : "0.00",
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

// @desc    Get all tags
// route    GET /api/expense/tags
// @access  Private
const getAllTags = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    const { sortBy } = req.query;
    const sortField = sortBy === "amount" ? "totalAmount" : "count";

    const tags = await Expense.aggregate([
      { $match: { user: userId } },

      // Group by tag and calculate count and total amount
      {
        $group: {
          _id: "$tag",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },

      // Sort dynamically based on the chosen field
      { $sort: { [sortField]: -1 } },

      // Project the final output
      {
        $project: {
          tag: "$_id",
          count: 1,
          totalAmount: { $toString: "$totalAmount" },
          _id: 0,
        },
      },
    ]);

    res.status(200).json(tags);
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occurred. Please try again");
  }
});

export {
  getAllExpense,
  createExpense,
  getTotalExpense,
  getMonthlyExpense,
  getAllTags,
};
