import asyncHandler from "express-async-handler";
import Income from "../models/incomeModel.js";
import Balance from "../models/balanceModel.js";
import { toDecimal128 } from "../utils/helper.js";

// @desc    Get all income
// route    GET /api/incomes
// @access  Private
const getAllIncome = asyncHandler(async (req, res) => {
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
      query.$or = [{ source: { $regex: q, $options: "i" } }];
    }

    // Sorting logic
    const sortOrder = sortBy?.orderBy?.toUpperCase() === "ASC" ? 1 : -1;
    const sortColumn = sortBy?.column
      ? toCamelCase(sortBy.column)
      : "createdAt";

    // Query the database
    const incomes = await Income.find(query)
      .sort({ [sortColumn]: sortOrder })
      .skip(offset)
      .limit(sizeNum);

    const totalRecords = await Income.countDocuments(query);

    const formattedResult = incomes.map((item) => ({
      _id: item._id,
      source: item.source,
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

// @desc    Create new income
// route    POST /api/incomes
// @access  Private
const createIncome = asyncHandler(async (req, res) => {
  try {
    const { source, amount } = req.body;
    const userId = req.user._id;

    // validation
    if (!userId) throw new Error("Invalid user");
    if (!source && !amount) throw new Error("Invalid request");

    // saving income data
    const newIncome = new Income({
      amount: toDecimal128(parseFloat(amount)),
      source,
      user: userId,
    });

    const createdIncome = await newIncome.save();

    // saving balance data
    let startAmount = toDecimal128(parseFloat("0.00"));
    let inAmount = toDecimal128(parseFloat(createdIncome.amount.toString()));
    let outAmount = toDecimal128(parseFloat("0.00"));
    const latestBalance = await Balance.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (latestBalance)
      startAmount = toDecimal128(parseFloat(latestBalance.end.toString()));
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
      income: createdIncome._id,
      expense: null,
    });
    await balance.save();

    res.status(201).json({
      _id: createdIncome._id,
      source: createdIncome.source,
      amount: createdIncome.amount.toString(),
      user: createdIncome.user._id,
      createdAt: createdIncome.createdAt,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occured. Please try again");
  }
});

// @desc    Get total income
// route    GET /api/incomes/total
// @access  Private
const getTotalIncome = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    const totalAmount = await Income.aggregate([
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
      totalIncome: totalAmount,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "An error occured. Please try again");
  }
});

// @desc    Get monthly income
// route    GET /api/incomes/monthly
// @access  Private
const getMonthlyIncome = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user._id;
    if (!userId) throw new Error("Invalid user");

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    // Aggregation pipeline
    const monthlyIncome = await Income.aggregate([
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

export { getAllIncome, createIncome, getTotalIncome, getMonthlyIncome };
