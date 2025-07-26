import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    public_id: string;
    alt?: string;
  };
  icon?: string;
  parent?: string;
  level: number;
  path: string;
  status: 'active' | 'inactive';
  featured: boolean;
  sortOrder: number;
  productCount: number;
  children?: Category[];
}

interface CategoryState {
  categories: Category[];
  categoryTree: Category[];
  featuredCategories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  categoryTree: [],
  featuredCategories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

// Get all categories
export const getCategories = createAsyncThunk(
  'categories/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/categories');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch categories'
      );
    }
  }
);

// Get category tree
export const getCategoryTree = createAsyncThunk(
  'categories/getCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/categories/tree');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch category tree'
      );
    }
  }
);

// Get featured categories
export const getFeaturedCategories = createAsyncThunk(
  'categories/getFeaturedCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/categories/featured');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch featured categories'
      );
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get categories
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get category tree
      .addCase(getCategoryTree.fulfilled, (state, action) => {
        state.categoryTree = action.payload;
      })
      .addCase(getCategoryTree.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get featured categories
      .addCase(getFeaturedCategories.fulfilled, (state, action) => {
        state.featuredCategories = action.payload;
      })
      .addCase(getFeaturedCategories.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentCategory, clearCurrentCategory } = categorySlice.actions;
export default categorySlice.reducer;