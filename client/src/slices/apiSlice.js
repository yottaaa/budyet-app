import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL, // Replace with your API's base URL, e.g., import.meta.env.VITE_API_URL
  credentials: 'include', // Include cookies with every request
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User'], // Use appropriate tag types for cache invalidation
  endpoints: (builder) => ({}),
});