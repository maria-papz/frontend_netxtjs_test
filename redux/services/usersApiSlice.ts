import { apiSlice } from './apiSlice';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users
    getUsers: builder.query({
      query: () => '/users/list/',
      transformResponse: (response) => response,
      providesTags: ['Users'],
    }),

    // Get user activity
    getUserActivity: builder.query({
      query: (id) => `/users/${id}/activity/`,
      transformResponse: (response) => response,
    }),

    // Get current user
    getCurrentUser: builder.query({
      query: () => '/users/me/',
      transformResponse: (response) => response,
      providesTags: ['CurrentUser'],
    }),

    // Follow a user
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/follow/`,
        method: 'POST',
      }),
      // Invalidate the following list when following a user
      invalidatesTags: ['Following'],
    }),

    // Unfollow a user
    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/follow/`,
        method: 'DELETE',
      }),
      // Invalidate the following list when unfollowing a user
      invalidatesTags: ['Following'],
    }),

    // Get user's following list
    getUserFollowing: builder.query({
      query: () => '/users/me/following/',
      transformResponse: (response) => response,
      providesTags: ['Following'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserActivityQuery,
  useGetCurrentUserQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserFollowingQuery,
} = usersApiSlice;
