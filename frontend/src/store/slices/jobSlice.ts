import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { jobAPI } from '@/services/api/job';

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  location: string;
  salary: number;
  description: string;
  requirements: string[];
  benefits?: string[];
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  category: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  applicationsCount?: number;
}

interface JobFilters {
  keyword?: string;
  location?: string;
  category?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  sortBy?: 'createdAt' | 'salary' | 'applicationsCount';
  sortOrder?: 'asc' | 'desc';
}

interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  savedJobs: string[];
  filters: JobFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const initialState: JobState = {
  jobs: [],
  selectedJob: null,
  savedJobs: [],
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

// Async thunks
export const fetchJobs = createAsyncThunk(
  'job/fetchJobs',
  async ({ filters, page = 1 }: { filters?: JobFilters; page?: number }) => {
    const response = await jobAPI.getJobs({ ...filters, page });
    return response.data;
  }
);

export const fetchJobById = createAsyncThunk(
  'job/fetchJobById',
  async (jobId: string) => {
    const response = await jobAPI.getJobById(jobId);
    return response.data;
  }
);

export const searchJobs = createAsyncThunk(
  'job/searchJobs',
  async (query: string) => {
    const response = await jobAPI.searchJobs(query);
    return response.data;
  }
);

export const saveJob = createAsyncThunk(
  'job/saveJob',
  async (jobId: string) => {
    await jobAPI.saveJob(jobId);
    return jobId;
  }
);

export const unsaveJob = createAsyncThunk(
  'job/unsaveJob',
  async (jobId: string) => {
    await jobAPI.unsaveJob(jobId);
    return jobId;
  }
);

export const fetchSavedJobs = createAsyncThunk(
  'job/fetchSavedJobs',
  async () => {
    const response = await jobAPI.getSavedJobs();
    return response.data;
  }
);

export const applyToJob = createAsyncThunk(
  'job/applyToJob',
  async ({ jobId, coverLetter }: { jobId: string; coverLetter?: string }) => {
    const response = await jobAPI.applyToJob(jobId, { coverLetter });
    return response.data;
  }
);

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<JobFilters>) => {
      state.filters = action.payload;
      state.pagination.page = 1;
    },
    updateFilter: (
      state,
      action: PayloadAction<{ key: keyof JobFilters; value: any }>
    ) => {
      state.filters[action.payload.key] = action.payload.value;
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
    resetJobs: (state) => {
      state.jobs = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    // Fetch jobs
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
        
        if (action.meta.arg.page === 1) {
          state.jobs = action.payload.jobs;
        } else {
          state.jobs = [...state.jobs, ...action.payload.jobs];
        }
        
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      });

    // Fetch job by ID
    builder
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch job details';
      });

    // Search jobs
    builder
      .addCase(searchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.jobs;
        state.pagination.total = action.payload.total;
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Search failed';
      });

    // Save/Unsave job
    builder
      .addCase(saveJob.fulfilled, (state, action) => {
        if (!state.savedJobs.includes(action.payload)) {
          state.savedJobs.push(action.payload);
        }
      })
      .addCase(unsaveJob.fulfilled, (state, action) => {
        state.savedJobs = state.savedJobs.filter(id => id !== action.payload);
      });

    // Fetch saved jobs
    builder
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.savedJobs = action.payload.map((job: Job) => job.id);
      });

    // Apply to job
    builder
      .addCase(applyToJob.fulfilled, (state, action) => {
        if (state.selectedJob && state.selectedJob.id === action.meta.arg.jobId) {
          state.selectedJob.applicationsCount = 
            (state.selectedJob.applicationsCount || 0) + 1;
        }
        
        const jobIndex = state.jobs.findIndex(job => job.id === action.meta.arg.jobId);
        if (jobIndex !== -1) {
          state.jobs[jobIndex].applicationsCount = 
            (state.jobs[jobIndex].applicationsCount || 0) + 1;
        }
      });
  },
});

export const {
  setFilters,
  updateFilter,
  clearFilters,
  setSelectedJob,
  resetJobs,
} = jobSlice.actions;

export default jobSlice.reducer;