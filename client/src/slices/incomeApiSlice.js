import { apiSlice } from "./apiSlice";

const INCOME_URL = `/api/incomes`;

export const incomeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllIncome: builder.mutation({
      query: ({body = {}, params}) => {
        const queryString = new URLSearchParams(params).toString();
        return {
          url: `${INCOME_URL}/all?${queryString}`,
          method: "POST",
          body,
        };
      },
    }),
    getMonthlyIncome: builder.mutation({
      query: ({body = {}}) => {
        return {
          url: `${INCOME_URL}/monthly`,
          method: "POST",
          body,
        };
      },
    }),
    createIncome: builder.mutation({
      query: (data) => {
        return {
          url: `${INCOME_URL}`,
          method: "POST",
          body: data,
        };
      },
    }),
    getTotalIncome: builder.mutation({
      query: () => {
        return {
          url: `${INCOME_URL}/total`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useGetAllIncomeMutation, useGetMonthlyIncomeMutation, useCreateIncomeMutation, useGetTotalIncomeMutation } = incomeApiSlice;
