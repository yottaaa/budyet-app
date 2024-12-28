import { apiSlice } from "./apiSlice";

const USERS_URL = `/api/users`;

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (data) => ({
        url: USERS_URL,
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/login`,
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/logout`,
        method: "POST",
        body: data,
      }),
    }),
    getUserProfile: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/profile`,
        method: "GET"
      }),
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: "PUT",
        body: data
      }),
    }),
  }),
});

export const { 
  useRegisterUserMutation, 
  useLoginMutation, 
  useLogoutMutation,
  useGetUserProfileMutation,
  useUpdateUserProfileMutation
} = usersApiSlice;
