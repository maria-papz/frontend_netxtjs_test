import { apiSlice } from './apiSlice';


export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tables
    getTables: builder.query({
      query: () => '/tables/',
      transformResponse: (response) => response,
    }),

    // Get indicator data
    getIndicator: builder.query({
      query: (id) => `/indicators/${id}/`,
      transformResponse: (response) => response,
    }),

    // Get indicator history
    getIndicatorHistory: builder.query({
      query: (id) => `/indicator/${id}/history/`,
      transformResponse: (response) => response,
    }),

    // Update indicator permissions
    updateIndicatorPermissions: builder.mutation({
      query: ({ id, data }) => ({
        url: `/indicators/${id}/permissions/`,
        method: 'POST',
        body: data,
      }),
    }),

    // Boolean filter for indicators
    booleanFilter: builder.mutation({
      query: (filterData) => ({
        url: '/boolean-filter/',
        method: 'POST',
        body: filterData,
      }),
    }),

    // Get followed users activity
    getFollowedUsersActivity: builder.query({
      query: (params) => ({
        url: '/users/me/following/activity/',
        params,
      }),
      transformResponse: (response) => response,
    }),

    // Get users the current user is following
    getUserFollowing: builder.query({
      query: () => '/users/me/following/',
      transformResponse: (response) => response,
    }),

    // Get favorite indicator activity
    getFavoriteIndicatorsActivity: builder.query({
      query: (params) => ({
        url: '/users/me/favourites/indicators/activity',
        params,
      }),
      transformResponse: (response) => response,
    }),

    // Get latest workflow run with indicator data
    getLatestWorkflowRun: builder.query({
      query: () => '/workflows/latest/',
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useGetTablesQuery,
  useGetIndicatorQuery,
  useGetIndicatorHistoryQuery,
  useUpdateIndicatorPermissionsMutation,
  useBooleanFilterMutation,
  useGetFollowedUsersActivityQuery,
  useGetUserFollowingQuery,
  useGetFavoriteIndicatorsActivityQuery,
  useGetLatestWorkflowRunQuery,
} = dashboardApiSlice;
