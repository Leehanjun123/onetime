import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { applicationAPI } from '@/services/api/application';

interface Application {
  id: string;
  jobId: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
  userId: string;
  status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  coverLetter?: string;
  resume?: string;
  appliedAt: string;
  updatedAt: string;
  interviewDate?: string;
  feedback?: string;
}

interface ApplicationState {
  applications: Application[];
  selectedApplication: Application | null;
  statistics: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: ApplicationState = {
  applications: [],
  selectedApplication: null,
  statistics: {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchApplications = createAsyncThunk(
  'application/fetchApplications',
  async (filters?: { status?: string; jobId?: string }) => {
    const response = await applicationAPI.getApplications(filters);
    return response.data;
  }
);

export const fetchApplicationById = createAsyncThunk(
  'application/fetchApplicationById',
  async (applicationId: string) => {
    const response = await applicationAPI.getApplicationById(applicationId);
    return response.data;
  }
);

export const withdrawApplication = createAsyncThunk(
  'application/withdrawApplication',
  async (applicationId: string) => {
    await applicationAPI.withdrawApplication(applicationId);
    return applicationId;
  }
);

export const fetchApplicationStatistics = createAsyncThunk(
  'application/fetchStatistics',
  async () => {
    const response = await applicationAPI.getStatistics();
    return response.data;
  }
);

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setSelectedApplication: (state, action: PayloadAction<Application | null>) => {
      state.selectedApplication = action.payload;
    },
    updateApplicationStatus: (
      state,
      action: PayloadAction<{ id: string; status: Application['status'] }>
    ) => {
      const application = state.applications.find(app => app.id === action.payload.id);
      if (application) {
        application.status = action.payload.status;
      }
      if (state.selectedApplication?.id === action.payload.id) {
        state.selectedApplication.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch applications
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload.applications;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch applications';
      });

    // Fetch application by ID
    builder
      .addCase(fetchApplicationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedApplication = action.payload;
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch application details';
      });

    // Withdraw application
    builder
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        const index = state.applications.findIndex(app => app.id === action.payload);
        if (index !== -1) {
          state.applications[index].status = 'WITHDRAWN';
        }
        if (state.selectedApplication?.id === action.payload) {
          state.selectedApplication.status = 'WITHDRAWN';
        }
      });

    // Fetch statistics
    builder
      .addCase(fetchApplicationStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  },
});

export const { setSelectedApplication, updateApplicationStatus } = applicationSlice.actions;
export default applicationSlice.reducer;