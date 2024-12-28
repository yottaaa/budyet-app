import { apiSlice } from "./apiSlice";

const EXPENSE_URL = "/api/expenses";

export const expenseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllExpense: builder.mutation({
      query: ({body = {}, params}) => {
        const queryString = new URLSearchParams(params).toString();
        return {
          url: `${EXPENSE_URL}/all?${queryString}`,
          method: "POST",
          body,
        };
      },
    }),
    getMonthlyExpense: builder.mutation({
      query: ({body = {}}) => {
        return {
          url: `${EXPENSE_URL}/monthly`,
          method: "POST",
          body,
        };
      },
    }),
    createExpense: builder.mutation({
      query: (data) => {
        return {
          url: `${EXPENSE_URL}`,
          method: "POST",
          body: data,
        };
      },
    }),
    getAllTags: builder.mutation({
      query: ({ params }) => {
        const queryString = new URLSearchParams(params).toString();
        return {
          url: `${EXPENSE_URL}/tags?${queryString}`,
          method: "GET",
        };
      },
    }),
    getTotalExpense: builder.mutation({
      query: () => {
        return {
          url: `${EXPENSE_URL}/total`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useCreateExpenseMutation, useGetAllExpenseMutation, useGetMonthlyExpenseMutation, useGetAllTagsMutation, useGetTotalExpenseMutation } = expenseApiSlice;
