import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { User, LoginRequest, RegisterRequest, AuthTokens } from '../../types';
import { STORAGE_KEYS } from '../../config/constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest) => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>(
      '/auth/login',
      credentials
    );
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN,
      response.tokens.accessToken
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.REFRESH_TOKEN,
      response.tokens.refreshToken
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(response.user)
    );
    
    return response.user;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest) => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>(
      '/auth/register',
      userData
    );
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN,
      response.tokens.accessToken
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.REFRESH_TOKEN,
      response.tokens.refreshToken
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(response.user)
    );
    
    return response.user;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  }
  
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_DATA,
  ]);
});

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) {
    throw new Error('No token found');
  }
  
  const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (userData) {
    return JSON.parse(userData) as User;
  }
  
  const user = await api.get<User>('/auth/me');
  await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  return user;
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>) => {
    const user = await api.put<User>('/auth/profile', profileData);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '로그인에 실패했습니다.';
      });
    
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '회원가입에 실패했습니다.';
      });
    
    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
    
    // Load User
    builder
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
    
    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '프로필 업데이트에 실패했습니다.';
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;