import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Modal {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  modals: Modal[];
  toasts: Toast[];
  loadingStates: Record<string, boolean>;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

const initialState: UIState = {
  theme: 'system',
  sidebarOpen: true,
  mobileMenuOpen: false,
  modals: [],
  toasts: [],
  loadingStates: {},
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    showModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.modals.push(modal);
    },
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload);
    },
    hideAllModals: (state) => {
      state.modals = [];
    },
    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        duration: 5000,
        ...action.payload,
        id: Date.now().toString(),
      };
      state.toasts.push(toast);
      
      // Auto-remove toast after duration
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const index = state.toasts.findIndex(t => t.id === toast.id);
          if (index !== -1) {
            state.toasts.splice(index, 1);
          }
        }, toast.duration);
      }
    },
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    setLoading: (
      state,
      action: PayloadAction<{ key: string; value: boolean }>
    ) => {
      state.loadingStates[action.payload.key] = action.payload.value;
    },
    setBreadcrumbs: (
      state,
      action: PayloadAction<Array<{ label: string; href?: string }>>
    ) => {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  showModal,
  hideModal,
  hideAllModals,
  showToast,
  hideToast,
  setLoading,
  setBreadcrumbs,
} = uiSlice.actions;

export default uiSlice.reducer;