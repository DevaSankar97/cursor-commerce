import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  loading: boolean;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchModalOpen: boolean;
  cartModalOpen: boolean;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  };
  modal: {
    show: boolean;
    type: string | null;
    data: any;
  };
}

const initialState: UiState = {
  loading: false,
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchModalOpen: false,
  cartModalOpen: false,
  toast: {
    show: false,
    message: '',
    type: 'info',
  },
  modal: {
    show: false,
    type: null,
    data: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    setSearchModalOpen: (state, action: PayloadAction<boolean>) => {
      state.searchModalOpen = action.payload;
    },
    setCartModalOpen: (state, action: PayloadAction<boolean>) => {
      state.cartModalOpen = action.payload;
    },
    showToast: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
    }>) => {
      state.toast = {
        show: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      state.toast.show = false;
    },
    showModal: (state, action: PayloadAction<{
      type: string;
      data?: any;
    }>) => {
      state.modal = {
        show: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    hideModal: (state) => {
      state.modal = {
        show: false,
        type: null,
        data: null,
      };
    },
  },
});

export const {
  setLoading,
  setSidebarOpen,
  setMobileMenuOpen,
  setSearchModalOpen,
  setCartModalOpen,
  showToast,
  hideToast,
  showModal,
  hideModal,
} = uiSlice.actions;

export default uiSlice.reducer;