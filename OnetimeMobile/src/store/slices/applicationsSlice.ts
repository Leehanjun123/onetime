import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Application } from '../../types';

interface ApplicationsState {
  applications: Application[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ApplicationsState = {
  applications: [],
  isLoading: false,
  error: null,
};

export const fetchApplications = createAsyncThunk(
  'applications/fetchApplications',
  async () => {
    const applications = await api.get<Application[]>('/applications');
    return applications;
  }
);

export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async (applicationId: string) => {
    await api.delete(`/applications/${applicationId}`);
    return applicationId;
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '지원 내역을 불러오는데 실패했습니다.';
      })
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter(
          a => a.id !== action.payload
        );
      });
  },
});

export const { clearError } = applicationsSlice.actions;
export default applicationsSlice.reducer;