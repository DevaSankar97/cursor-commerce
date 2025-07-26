import { createSlice } from '@reduxjs/toolkit';

interface WishlistState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = wishlistSlice.actions;
export default wishlistSlice.reducer;