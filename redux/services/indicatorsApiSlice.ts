import { apiSlice } from './apiSlice';

export const indicatorsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all indicators
    getIndicators: builder.query({
      query: () => '/indicators/',
      transformResponse: (response) => response,
    }),

    // Get all indicators with metadata
    getAllIndicators: builder.query({
      query: () => '/indicators/',
      transformResponse: (response) => response,
      providesTags: [{ type: 'Indicators' }, { type: 'Favourites' }],
    }),

    // Get single indicator
    getIndicator: builder.query({
      query: (id) => `/indicators/${id}/`,
      transformResponse: (response) => response,
    }),

    // Create indicator
    createIndicator: builder.mutation({
      query: (indicatorData) => ({
        url: '/indicators/',
        method: 'POST',
        body: indicatorData,
      }),
    }),

    // Update indicator
    updateIndicator: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/indicators/${id}/`,
        method: 'POST',
        body: data,
      }),
    }),

    // Update indicator data
    updateIndicatorData: builder.mutation({
      query: ({ id, data }) => ({
        url: `/data/${id}/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Indicators' }, { type: 'IndicatorData' }],
    }),

    // Get indicator codes
    getIndicatorCodes: builder.query({
      query: () => '/indicator/codes/',
      transformResponse: (response) => response,
    }),

    // Create custom indicator formula
    createCustomIndicatorFormula: builder.mutation({
      query: ({ id, formula }) => ({
        url: `/custom_indicators/${id}/`,
        method: 'POST',
        body: { formula },
      }),
    }),

    // Get indicator regions
    getRegions: builder.query({
      query: () => '/regions/',
      transformResponse: (response) => response,
    }),

    // Get countries
    getCountries: builder.query({
      query: () => '/countries/',
      transformResponse: (response) => response,
    }),

    // Get country codes
    getCountryCodes: builder.query({
      query: () => '/countries/codes/',
      transformResponse: (response) => response,
    }),

    // Create region
    createRegion: builder.mutation({
      query: (regionData) => ({
        url: '/regions/',
        method: 'POST',
        body: regionData,
      }),
    }),

    // Create country
    createCountry: builder.mutation({
      query: (countryData) => ({
        url: '/countries/',
        method: 'POST',
        body: countryData,
      }),
    }),

    // Create category
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/categories/',
        method: 'POST',
        body: categoryData,
      }),
    }),

    // Get categories
    getCategories: builder.query({
      query: () => '/categories/',
      transformResponse: (response) => response,
    }),

    // Create unit
    createUnit: builder.mutation({
      query: (unitData) => ({
        url: '/units/',
        method: 'POST',
        body: unitData,
      }),
    }),

    // Get units
    getUnits: builder.query({
      query: () => '/units/',
      transformResponse: (response) => response,
    }),

    // Get users
    getUsers: builder.query({
      query: () => '/users/list/',
      transformResponse: (response) => response,
    }),

    // User activity
    getUserActivity: builder.query({
      query: (id) => `/users/${id}/activity/`,
      transformResponse: (response) => response,
    }),

    // Indicator data
    getIndicatorData: builder.query({
      query: (id) => `/indicators/${id}/`,
      transformResponse: (response) => response,
    }),

    // Indicator history
    getIndicatorHistory: builder.query({
      query: (id) => `/indicator/${id}/history/`,
      transformResponse: (response) => response,
    }),

    // Table data
    getTableData: builder.query({
      query: (id) => `/tables/${id}/`,
      transformResponse: (response) => response,
    }),

    // Indicator permissions
    getIndicatorPermissions: builder.query({
      query: (id) => `/indicators/${id}/permissions`,
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

    // Add indicator to favourites
    addIndicatorToFavourites: builder.mutation({
      query: (indicatorId) => ({
        url: `/indicators/${indicatorId}/favourites/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Indicators' }, { type: 'Favourites' }],
    }),

    // Remove indicator from favourites
    removeIndicatorFromFavourites: builder.mutation({
      query: (indicatorId) => ({
        url: `/indicators/${indicatorId}/favourites/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Indicators' }, { type: 'Favourites' }],
    }),

    // Get user's favourite indicators
    getUserFavouriteIndicators: builder.query({
      query: () => '/users/me/favourite-indicators/',
      transformResponse: (response) => response,
      providesTags: [{ type: 'Indicators' }, { type: 'Favourites' }],
    }),

    // Delete indicator
    deleteIndicator: builder.mutation({
      query: (id) => ({
        url: `/indicators/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Indicators' }, { type: 'Favourites' }],
    }),

  dataRestore: builder.mutation({
    query: ({ id, timestamp, type, entries }) => ({
      url: `/indicators/${id}/restore-data`,
      method: 'POST',
      body: { timestamp, type, entries },
    }),
    invalidatesTags: [{ type: 'Indicators' }, { type: 'IndicatorData' }],
  }),
  }),

});

export const {
  useGetIndicatorsQuery,
  useGetAllIndicatorsQuery,
  useGetIndicatorQuery,
  useCreateIndicatorMutation,
  useUpdateIndicatorMutation,
  useUpdateIndicatorDataMutation,
  useGetIndicatorCodesQuery,
  useCreateCustomIndicatorFormulaMutation,
  useGetRegionsQuery,
  useGetCountriesQuery,
  useGetCountryCodesQuery,
  useCreateRegionMutation,
  useCreateCountryMutation,
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  useCreateUnitMutation,
  useGetUnitsQuery,
  useGetUsersQuery,
  useGetUserActivityQuery,
  useGetIndicatorDataQuery,
  useGetIndicatorHistoryQuery,
  useGetTableDataQuery,
  useGetIndicatorPermissionsQuery,
  useUpdateIndicatorPermissionsMutation,
  useAddIndicatorToFavouritesMutation,
  useRemoveIndicatorFromFavouritesMutation,
  useGetUserFavouriteIndicatorsQuery,
  useDataRestoreMutation,
  useDeleteIndicatorMutation,
} = indicatorsApiSlice;
