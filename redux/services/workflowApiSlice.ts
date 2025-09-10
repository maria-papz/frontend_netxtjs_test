import { apiSlice } from './apiSlice';

// Define types for the API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface WorkflowIndicator {
  id: number;
  code?: string;
  name?: string;
}

interface WorkflowRun {
  id?: number;
  workflow_id?: number;
  workflow_name?: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
  indicators: WorkflowIndicator[];
}

interface IndicatorTimeSeriesPoint {
  period: string;
  value: number;
}

export const workflowApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all workflows
    getWorkflows: builder.query({
      query: () => '/workflows/',
      providesTags: ['Workflows'],
    }),

    // Get workflows by indicator ID
    getWorkflowsByIndicator: builder.query<any[], string>({
      query: (indicatorId) => `/workflows/indicator/${indicatorId}/`,
      providesTags: (result, error, id) => [{ type: 'Workflows', id }],
      // Handle API errors gracefully
      transformErrorResponse: (response) => {
        console.error("Error fetching workflows for indicator:", response);
        return [];
      },
      // Ensure we always return an array
      transformResponse: (response: any) => {
        if (!response || !Array.isArray(response)) {
          console.warn("Invalid workflow response format:", response);
          return [];
        }
        return response;
      },
    }),

    // Create a workflow
    createWorkflow: builder.mutation({
      query: (workflowData) => ({
        url: '/workflows/',
        method: 'POST',
        body: workflowData,
      }),
      invalidatesTags: ['Workflows'],
    }),

    // Update a workflow
    updateWorkflow: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/workflows/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Workflows'],
    }),

    // Delete a workflow
    deleteWorkflow: builder.mutation({
      query: (id) => ({
        url: `/workflows/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workflows'],
    }),

    // Toggle workflow active state
    toggleWorkflowActive: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `/workflows/${id}/toggle/`,
        method: 'POST',
        body: { is_active },
      }),
      invalidatesTags: ['Workflows'],
    }),

    // Run a workflow manually - Corrected URL to match your urls.py
    runWorkflow: builder.mutation({
      query: (id) => ({
        url: `/workflows/${id}/run/`,
        method: 'POST',
      }),
      invalidatesTags: ['Workflows'],
    }),

    // Configure CyStat workflow - Corrected URL to match your urls.py
    configureCystatWorkflow: builder.mutation({
      query: (configData) => ({
        url: '/cystat-workflow-config/',
        method: 'POST',
        body: configData,
      }),
    }),

    // Create CyStat indicator mappings - Corrected URL to match your urls.py
    createCystatIndicatorMapping: builder.mutation({
      query: (mappingData) => ({
        url: '/cystat-indicator-mapping/',
        method: 'POST',
        body: mappingData,
      }),
    }),

    // Fetch CyStat structure - Corrected URL to match your urls.py
    fetchCystatStructure: builder.mutation({
      query: (urlData) => ({
        url: '/fetch-cystat-structure/',
        method: 'POST',
        body: urlData,
      }),
    }),

    // Configure ECB workflow
    configureEcbWorkflow: builder.mutation({
      query: (configData) => ({
        url: '/ecb-workflow-config/',
        method: 'POST',
        body: configData,
      }),
    }),

    // Fetch ECB structure
    fetchEcbStructure: builder.mutation({
      query: (data) => ({
        url: '/fetch-ecb-structure/',
        method: 'POST',
        body: data,
      }),
    }),

    // Map indicators
    mapIndicators: builder.mutation({
      query: (mappingData) => ({
        url: '/cystat-indicator-mapping/',
        method: 'POST',
        body: mappingData,
      }),
    }),

    // Get a specific workflow with all details
    getWorkflowDetails: builder.query({
      query: (id) => `/workflows/${id}/`, // Use the dedicated detailed endpoint
      providesTags: (result, error, id) => [{ type: 'Workflows', id }],
      // Add better error handling
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          console.log("Workflow details fetched successfully:", result.data);
        } catch (err) {
          console.error("Error fetching workflow details:", err);
        }
      },
      // Transform the response to include correct data types
      transformResponse: (response: any) => {
        console.log("Raw API response:", response);

        // Ensure indicator_mappings is always an array
        if (response && !response.indicator_mappings) {
          response.indicator_mappings = [];
        }

        // Ensure indicators is always an array
        if (response && !response.indicators) {
          response.indicators = [];
        }

        // Ensure key_indices is an object for each mapping
        if (response?.indicator_mappings?.length > 0) {
          response.indicator_mappings = response.indicator_mappings.map((mapping: any) => {
            return {
              ...mapping,
              key_indices: mapping.key_indices || {}
            };
          });
        }

        return response;
      },
    }),

    // Get workflow run history
    getWorkflowRunHistory: builder.query<any, number>({
      query: (workflowId) => `/workflows/${workflowId}/run_history/`,
      transformResponse: (response: any) => {
        // Process the response if needed
        return response;
      }
    }),

    // Eurostat-specific endpoints
    fetchEurostatStructure: builder.mutation({
      query: (payload) => ({
        url: '/fetch-eurostat-structure/',
        method: 'POST',
        body: payload,
      }),
    }),

    configureEurostatWorkflow: builder.mutation({
      query: (payload) => ({
        url: '/eurostat-workflow-config/',
        method: 'POST',
        body: payload,
      }),
    }),

    createEurostatIndicatorMapping: builder.mutation({
      query: (payload) => ({
        url: '/eurostat-indicator-mapping/',
        method: 'POST',
        body: payload,
      }),
    }),

    // New endpoints

    // Get the latest workflow run with changes
    getLatestWorkflowRun: builder.query<WorkflowRun, void>({
      query: () => '/api/workflows/latest-with-changes/',
      transformResponse: (response: ApiResponse<WorkflowRun>) => response.data,
    }),

    // Get time series data for multiple indicators
    getIndicatorDataSeries: builder.query<Record<string, IndicatorTimeSeriesPoint[]>, { indicator_ids: number[] }>({
      query: (params) => ({
        url: '/api/indicators/timeseries/',
        method: 'POST',
        body: { indicator_ids: params.indicator_ids }
      }),
      transformResponse: (response: ApiResponse<Record<string, IndicatorTimeSeriesPoint[]>>) => response.data,
    }),
  }),
});

export const {
  useGetWorkflowsQuery,
  useGetWorkflowsByIndicatorQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useToggleWorkflowActiveMutation,
  useRunWorkflowMutation,
  useConfigureCystatWorkflowMutation,
  useCreateCystatIndicatorMappingMutation,
  useFetchCystatStructureMutation,
  useConfigureEcbWorkflowMutation,
  useFetchEcbStructureMutation,
  useMapIndicatorsMutation,
  useGetWorkflowDetailsQuery,
  useGetWorkflowRunHistoryQuery,
  useFetchEurostatStructureMutation,
  useConfigureEurostatWorkflowMutation,
  useCreateEurostatIndicatorMappingMutation,
  useGetLatestWorkflowRunQuery,
  useGetIndicatorDataSeriesQuery,
} = workflowApiSlice;
