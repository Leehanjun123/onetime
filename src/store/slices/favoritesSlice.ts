import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FavoriteJob {
  id: string;
  title: string;
  company: string;
  location: string;
  hourlyPay: number;
  category: string;
  savedAt: string;
}

export interface FavoriteCompany {
  id: string;
  name: string;
  rating: number;
  totalJobs: number;
  savedAt: string;
}

interface FavoritesState {
  jobs: FavoriteJob[];
  companies: FavoriteCompany[];
  searches: string[];
  loading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  jobs: [],
  companies: [],
  searches: [],
  loading: false,
  error: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // 일자리 즐겨찾기
    addFavoriteJob: (state, action: PayloadAction<FavoriteJob>) => {
      const exists = state.jobs.some(job => job.id === action.payload.id);
      if (!exists) {
        state.jobs.unshift(action.payload);
        // 로컬 스토리지 저장
        localStorage.setItem('favorite_jobs', JSON.stringify(state.jobs));
      }
    },
    removeFavoriteJob: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload);
      localStorage.setItem('favorite_jobs', JSON.stringify(state.jobs));
    },
    
    // 회사 즐겨찾기
    addFavoriteCompany: (state, action: PayloadAction<FavoriteCompany>) => {
      const exists = state.companies.some(company => company.id === action.payload.id);
      if (!exists) {
        state.companies.unshift(action.payload);
        localStorage.setItem('favorite_companies', JSON.stringify(state.companies));
      }
    },
    removeFavoriteCompany: (state, action: PayloadAction<string>) => {
      state.companies = state.companies.filter(company => company.id !== action.payload);
      localStorage.setItem('favorite_companies', JSON.stringify(state.companies));
    },
    
    // 검색어 저장
    addSearchKeyword: (state, action: PayloadAction<string>) => {
      if (!state.searches.includes(action.payload)) {
        state.searches.unshift(action.payload);
        if (state.searches.length > 10) {
          state.searches = state.searches.slice(0, 10);
        }
        localStorage.setItem('favorite_searches', JSON.stringify(state.searches));
      }
    },
    removeSearchKeyword: (state, action: PayloadAction<string>) => {
      state.searches = state.searches.filter(search => search !== action.payload);
      localStorage.setItem('favorite_searches', JSON.stringify(state.searches));
    },
    clearSearchHistory: (state) => {
      state.searches = [];
      localStorage.removeItem('favorite_searches');
    },
    
    // 초기 데이터 로드
    loadFavorites: (state) => {
      const jobs = localStorage.getItem('favorite_jobs');
      const companies = localStorage.getItem('favorite_companies');
      const searches = localStorage.getItem('favorite_searches');
      
      if (jobs) state.jobs = JSON.parse(jobs);
      if (companies) state.companies = JSON.parse(companies);
      if (searches) state.searches = JSON.parse(searches);
    },
    
    // 전체 초기화
    clearAllFavorites: (state) => {
      state.jobs = [];
      state.companies = [];
      state.searches = [];
      localStorage.removeItem('favorite_jobs');
      localStorage.removeItem('favorite_companies');
      localStorage.removeItem('favorite_searches');
    },
  },
});

export const {
  addFavoriteJob,
  removeFavoriteJob,
  addFavoriteCompany,
  removeFavoriteCompany,
  addSearchKeyword,
  removeSearchKeyword,
  clearSearchHistory,
  loadFavorites,
  clearAllFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;