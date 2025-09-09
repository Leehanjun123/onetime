import api from './auth';

export const jobAPI = {
  getJobs: async (params?: any) => {
    return api.get('/jobs', { params });
  },

  getJobById: async (jobId: string) => {
    return api.get(`/jobs/${jobId}`);
  },

  searchJobs: async (query: string) => {
    return api.get('/jobs/search', { params: { q: query } });
  },

  createJob: async (jobData: any) => {
    return api.post('/jobs', jobData);
  },

  updateJob: async (jobId: string, jobData: any) => {
    return api.put(`/jobs/${jobId}`, jobData);
  },

  deleteJob: async (jobId: string) => {
    return api.delete(`/jobs/${jobId}`);
  },

  saveJob: async (jobId: string) => {
    return api.post(`/jobs/${jobId}/save`);
  },

  unsaveJob: async (jobId: string) => {
    return api.delete(`/jobs/${jobId}/save`);
  },

  getSavedJobs: async () => {
    return api.get('/jobs/saved');
  },

  applyToJob: async (jobId: string, applicationData: any) => {
    return api.post(`/jobs/${jobId}/apply`, applicationData);
  },

  getJobApplications: async (jobId: string) => {
    return api.get(`/jobs/${jobId}/applications`);
  },

  getRecommendations: async () => {
    return api.get('/jobs/recommendations');
  },

  getJobStatistics: async (jobId: string) => {
    return api.get(`/jobs/${jobId}/statistics`);
  },
};