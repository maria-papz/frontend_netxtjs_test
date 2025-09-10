import { apiSlice } from './apiSlice';

export const tablesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new table
    createTable: builder.mutation({
      query: (tableData) => ({
        url: '/tables/',
        method: 'POST',
        body: tableData,
      }),
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),

    // Get all tables data
    getAllTables: builder.query({
      query: () => '/tables/',
      transformResponse: (response) => response,
    }),

    // Add indicators to table
    addIndicatorsToTable: builder.mutation({
      query: ({ tableId, indicators }) => ({
        url: `/tables/${tableId}/indicators`,
        method: 'POST',
        body: indicators,
      }),
    }),

    // Add table to favourites
    addTableToFavourites: builder.mutation({
      query: (tableId) => ({
        url: `/tables/${tableId}/favourites/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }, { type: 'Favourites', id: 'LIST' }],
    }),

    // Remove table from favourites
    removeTableFromFavourites: builder.mutation({
      query: (tableId) => ({
        url: `/tables/${tableId}/favourites/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }, { type: 'Favourites', id: 'LIST' }],
    }),

    // Get user's favourite tables
    getUserFavouriteTables: builder.query({
      query: () => '/users/me/favourite-tables/',
      transformResponse: (response) => response,
      providesTags: [{ type: 'Tables', id: 'LIST' }, { type: 'Favourites', id: 'LIST' }],
    }),

    // Delete table
    deleteTable: builder.mutation({
      query: (id) => ({
        url: `/tables/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),

    // Delete indicator from table
    deleteIndicatorFromTable: builder.mutation({
      query: ({ tableId, indicatorId }) => ({
        url: `/tables/${tableId}/indicators/${indicatorId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),

    // Update table
    updateTable: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tables/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: [{ type: 'Tables', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateTableMutation,
  useGetAllTablesQuery,
  useAddIndicatorsToTableMutation,
  useAddTableToFavouritesMutation,
  useRemoveTableFromFavouritesMutation,
  useGetUserFavouriteTablesQuery,
  useDeleteTableMutation,
  useDeleteIndicatorFromTableMutation,
  useUpdateTableMutation,
} = tablesApiSlice;
