import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Job, JobFilters, PaginationParams } from '../../types';

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  nearbyJobs: Job[];
  recommendedJobs: Job[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  filters: JobFilters;
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  nearbyJobs: [],
  recommendedJobs: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  page: 1,
  filters: {},
};

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async ({ page = 1, filters = {} }: { page?: number; filters?: JobFilters }) => {
    const params: PaginationParams & JobFilters = {
      page,
      limit: 20,
      ...filters,
    };
    
    const response = await api.get<{
      jobs: Job[];
      total: number;
      hasMore: boolean;
    }>('/jobs', { params });
    
    return {
      jobs: response.jobs,
      hasMore: response.hasMore,
      page,
    };
  }
);

export const fetchJobDetail = createAsyncThunk(
  'jobs/fetchJobDetail',
  async (jobId: string) => {
    const job = await api.get<Job>(`/jobs/${jobId}`);
    return job;
  }
);

export const fetchNearbyJobs = createAsyncThunk(
  'jobs/fetchNearbyJobs',
  async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    const jobs = await api.get<Job[]>('/jobs/nearby', {
      params: { latitude, longitude, radius: 5000 },
    });
    return jobs;
  }
);

export const fetchRecommendedJobs = createAsyncThunk(
  'jobs/fetchRecommendedJobs',
  async () => {
    const jobs = await api.get<Job[]>('/jobs/recommended');
    return jobs;
  }
);

export const applyToJob = createAsyncThunk(
  'jobs/applyToJob',
  async ({ jobId, message }: { jobId: string; message?: string }) => {
    const application = await api.post(`/jobs/${jobId}/apply`, { message });
    return { jobId, application };
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: Partial<Job>) => {
    const job = await api.post<Job>('/jobs', jobData);
    return job;
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, data }: { jobId: string; data: Partial<Job> }) => {
    const job = await api.put<Job>(`/jobs/${jobId}`, data);
    return job;
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string) => {
    await api.delete(`/jobs/${jobId}`);
    return jobId;
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<JobFilters>) => {
      state.filters = action.payload;
      state.page = 1;
      state.jobs = [];
      state.hasMore = true;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.page = 1;
      state.jobs = [];
      state.hasMore = true;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Jobs
    builder
      .addCase(fetchJobs.pending, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.isLoading = true;
        } else {
          state.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        
        if (action.payload.page === 1) {
          state.jobs = action.payload.jobs;
        } else {
          state.jobs = [...state.jobs, ...action.payload.jobs];
        }
        
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.error.message || '일자리 목록을 불러오는데 실패했습니다.';
      });
    
    // Fetch Job Detail
    builder
      .addCase(fetchJobDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
        state.error = null;
      })
      .addCase(fetchJobDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '일자리 정보를 불러오는데 실패했습니다.';
      });
    
    // Fetch Nearby Jobs
    builder
      .addCase(fetchNearbyJobs.fulfilled, (state, action) => {
        state.nearbyJobs = action.payload;
      });
    
    // Fetch Recommended Jobs
    builder
      .addCase(fetchRecommendedJobs.fulfilled, (state, action) => {
        state.recommendedJobs = action.payload;
      });
    
    // Apply to Job
    builder
      .addCase(applyToJob.fulfilled, (state, action) => {
        const job = state.jobs.find(j => j.id === action.payload.jobId);
        if (job) {
          job.currentApplicants += 1;
        }
        if (state.currentJob?.id === action.payload.jobId) {
          state.currentJob.currentApplicants += 1;
        }
      });
    
    // Create Job
    builder
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload);
      });
    
    // Update Job
    builder
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(j => j.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      });
    
    // Delete Job
    builder
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(j => j.id !== action.payload);
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null;
        }
      });
  },
});

export const { setFilters, clearFilters, clearCurrentJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;