import api from './auth';

export const applicationAPI = {
  getApplications: async (filters?: any) => {
    return api.get('/applications', { params: filters });
  },

  getApplicationById: async (applicationId: string) => {
    return api.get(`/applications/${applicationId}`);
  },

  withdrawApplication: async (applicationId: string) => {
    return api.post(`/applications/${applicationId}/withdraw`);
  },

  getStatistics: async () => {
    return api.get('/applications/statistics');
  },

  updateApplication: async (applicationId: string, data: any) => {
    return api.put(`/applications/${applicationId}`, data);
  },
};