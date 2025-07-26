import { createSlice } from '@reduxjs/toolkit';

interface ReviewState {
  reviews: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  loading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = reviewSlice.actions;
export default reviewSlice.reducer;