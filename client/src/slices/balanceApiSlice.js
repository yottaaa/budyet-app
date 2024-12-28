import { apiSlice } from "./apiSlice";

const BALANCE_URL = `/api/balances`;

export const balanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllBalance: builder.mutation({
      query: ({body = {}, params}) => {
        const queryString = new URLSearchParams(params).toString();
        return {
          url: `${BALANCE_URL}/all?${queryString}`,
          method: "POST",
          body,
        };
      },
    }),
    getMonthlyBalance: builder.mutation({
      query: ({body = {}}) => {
        return {
          url: `${BALANCE_URL}/monthly`,
          method: "POST",
          body,
        };
      },
    }),
    getTotalBalance: builder.mutation({
      query: () => {
        return {
          url: `${BALANCE_URL}/total`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useGetAllBalanceMutation, useGetMonthlyBalanceMutation, useGetTotalBalanceMutation } = balanceApiSlice;
