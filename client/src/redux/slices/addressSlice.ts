import { createSlice } from '@reduxjs/toolkit';

interface AddressState {
  addresses: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
};

const addressSlice = createSlice({
  name: 'addresses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = addressSlice.actions;
export default addressSlice.reducer;