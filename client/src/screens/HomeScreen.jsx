import React, { useEffect, useState } from "react";
import Statistics from "../components/Statistics";
import CustomDataTable from "../components/CustomDataTable";
import { formatInTimeZone } from "date-fns-tz";
import {
  useGetAllBalanceMutation,
  useGetMonthlyBalanceMutation,
  useGetTotalBalanceMutation,
} from "../slices/balanceApiSlice";
import { useGetTotalIncomeMutation } from "../slices/incomeApiSlice";
import {
  useGetTotalExpenseMutation,
  useGetAllTagsMutation,
} from "../slices/expenseApiSlice";
import { convertToUTCWithLocalTimezone, formatNumber } from "../utils/stringUtils";
import { toast } from "react-toastify";

const columns = [
  {
    name: "Start",
    selector: (row) => row.start,
    cell: (row) => formatNumber(row.start),
  },
  {
    name: "In",
    selector: (row) => parseFloat(row.in),
    cell: (row) => formatNumber(row.in), // Display the string value
  },
  {
    name: "Out",
    selector: (row) => parseFloat(row.out),
    cell: (row) => formatNumber(row.out),
  },
  {
    name: "End",
    selector: (row) => row.end,
    cell: (row) => formatNumber(row.end),
  },
  {
    name: "Income",
    selector: (row) => row.income,
    cell: (row) =>
      row.income === null || row.income === "" ? "N/A" : row.income,
  },
  {
    name: "Expense",
    selector: (row) => row.expense,
    cell: (row) =>
      row.expense === null || row.expense === "" ? "N/A" : row.expense,
  },
  {
    name: "Created At",
    width: "250px",
    selector: (row) => row.createdAt,
    cell: (row) => {
      const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return formatInTimeZone(
        new Date(row.createdAt),
        localTimeZone,
        "d MMM yyyy | hh:mm:ss a"
      );
    },
  },
];

const HomeScreen = () => {
  const [statNumbers, setStatNumbers] = useState({
    totalBalance: "",
    totalIncome: "",
    totalExpense: "",
  });
  const [monthlyBalance, setMonthlyBalance] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [paginationData, setPaginationData] = useState({
    page: 1,
    totalRows: 0,
    perPage: 10,
  });

  const [getAllBalance, { isLoading: isAllBalanceLoading }] =
    useGetAllBalanceMutation();
  const [getTotalBalance, { isLoading: isTotalBalanceLoading }] =
    useGetTotalBalanceMutation();
  const [getTotalIncome, { isLoading: isTotalIncomeLoading }] =
    useGetTotalIncomeMutation();
  const [getTotalExpense, { isLoading: isTotalExpenseLoading }] =
    useGetTotalExpenseMutation();
  const [getMonthlyBalance, { isLoading: isMonthlyBalanceLoading }] =
    useGetMonthlyBalanceMutation();
  const [getAllTags, { isLoading: isAllTagsLoading }] = useGetAllTagsMutation();

  const fetchAllTotals = async () => {
    try {
      const totalBalanceRes = await getTotalBalance().unwrap();
      const totalExpenseRes = await getTotalExpense().unwrap();
      const totalIncomeRes = await getTotalIncome().unwrap();

      setStatNumbers({
        totalBalance: formatNumber(totalBalanceRes.totalBalance),
        totalExpense: formatNumber(totalExpenseRes.totalExpense),
        totalIncome: formatNumber(totalIncomeRes.totalIncome),
      });
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  const fetchMonthlyBalance = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;

    try {
      const monthlyBalanceRes = await getMonthlyBalance({
        body: { startDate, endDate },
      }).unwrap();
      setMonthlyBalance(monthlyBalanceRes);
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  const fetchAllTags = async () => {
    try {
      const allTags = await getAllTags({
        params: { sortBy: "amount" },
      }).unwrap();
      setTopItems(allTags);
    } catch (error) {
      toast.error(error?.data?.message || error.message);
    }
  };

  const fetchAllBalance = async (body = {}, params = { page: 1, size: 10 }) => {
    try {
      // Validate and convert dates if provided
      if (body.startDate && body.endDate) {

        // Convert to UTC
        body.startDate = convertToUTCWithLocalTimezone(body.startDate, true);
        body.endDate = convertToUTCWithLocalTimezone(body.endDate, false);
      }

      const allBalance = await getAllBalance({
        body,
        params
      }).unwrap();
      setRows(allBalance.data);
      setPaginationData({
        page: params.page,
        totalRows: allBalance.metadata.totalRecords,
        perPage: params.size,
      })
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchAllTotals();
    fetchMonthlyBalance();
    fetchAllTags();
    fetchAllBalance();
  }, [setStatNumbers, setMonthlyBalance, setTopItems, setRows]);

  return (
    <div>
      <Statistics data={{ monthlyBalance, topItems, statNumbers }} />
      <CustomDataTable
        data={{ columns, rows }}
        fetchData={fetchAllBalance}
        paginationData={paginationData}
        title="Balance Data"
        pending={isAllBalanceLoading}
        searchParams={["Income","Expense"]}
      />
    </div>
  );
};

export default HomeScreen;
