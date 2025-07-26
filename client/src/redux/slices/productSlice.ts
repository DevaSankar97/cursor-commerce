import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  brand: string;
  images: Array<{
    url: string;
    public_id: string;
    alt?: string;
    isMain: boolean;
  }>;
  price: {
    selling: number;
    mrp: number;
    discount: number;
  };
  inventory: {
    stock: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
  };
  specifications: {
    weight?: {
      value: number;
      unit: string;
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    color?: string;
    size?: string;
    material?: string;
    features?: string[];
    warranty?: {
      duration: number;
      unit: string;
      description: string;
    };
  };
  rating: {
    average: number;
    count: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  tags: string[];
  status: 'active' | 'inactive' | 'draft' | 'discontinued';
  featured: boolean;
  trending: boolean;
  bestseller: boolean;
  newArrival: boolean;
  onSale: boolean;
  salesCount: number;
  viewCount: number;
  wishlistCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  features?: string[];
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  trending?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
}

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  featuredProducts: Product[];
  trendingProducts: Product[];
  bestsellerProducts: Product[];
  newArrivalProducts: Product[];
  relatedProducts: Product[];
  searchResults: Product[];
  filters: ProductFilters;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  itemsPerPage: number;
  sortBy: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  trendingProducts: [],
  bestsellerProducts: [],
  newArrivalProducts: [],
  relatedProducts: [],
  searchResults: [],
  filters: {},
  currentPage: 1,
  totalPages: 0,
  totalProducts: 0,
  itemsPerPage: 20,
  sortBy: '-createdAt',
  searchQuery: '',
  loading: false,
  error: null,
};

// Get products with filters and pagination
export const getProducts = createAsyncThunk(
  'products/getProducts',
  async (params: {
    page?: number;
    limit?: number;
    sort?: string;
    category?: string;
    subcategory?: string;
    search?: string;
    filters?: ProductFilters;
  }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.category) queryParams.append('category', params.category);
      if (params.subcategory) queryParams.append('subcategory', params.subcategory);
      if (params.search) queryParams.append('search', params.search);
      
      // Add filter parameters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else if (typeof value === 'object') {
              Object.entries(value).forEach(([subKey, subValue]) => {
                queryParams.append(`${key}[${subKey}]`, subValue.toString());
              });
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await axios.get(`/products?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch products'
      );
    }
  }
);

// Get single product by slug
export const getProductBySlug = createAsyncThunk(
  'products/getProductBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/products/slug/${slug}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch product'
      );
    }
  }
);

// Get featured products
export const getFeaturedProducts = createAsyncThunk(
  'products/getFeaturedProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/products/featured?limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch featured products'
      );
    }
  }
);

// Get trending products
export const getTrendingProducts = createAsyncThunk(
  'products/getTrendingProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/products/trending?limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch trending products'
      );
    }
  }
);

// Get bestseller products
export const getBestsellerProducts = createAsyncThunk(
  'products/getBestsellerProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/products/bestsellers?limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch bestseller products'
      );
    }
  }
);

// Get new arrival products
export const getNewArrivalProducts = createAsyncThunk(
  'products/getNewArrivalProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/products/new-arrivals?limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch new arrival products'
      );
    }
  }
);

// Get related products
export const getRelatedProducts = createAsyncThunk(
  'products/getRelatedProducts',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/products/${productId}/related`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch related products'
      );
    }
  }
);

// Search products
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (params: {
    query: string;
    page?: number;
    limit?: number;
    filters?: ProductFilters;
  }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('search', params.query);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add filter parameters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else if (typeof value === 'object') {
              Object.entries(value).forEach(([subKey, subValue]) => {
                queryParams.append(`${key}[${subKey}]`, subValue.toString());
              });
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await axios.get(`/products/search?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Search failed'
      );
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<ProductFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    incrementViewCount: (state, action: PayloadAction<string>) => {
      // Optimistically increment view count for current product
      if (state.currentProduct && state.currentProduct._id === action.payload) {
        state.currentProduct.viewCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get products
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 0;
        state.totalProducts = action.payload.totalProducts || 0;
        state.error = null;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get product by slug
      .addCase(getProductBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(getProductBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get featured products
      .addCase(getFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload || [];
      })
      .addCase(getFeaturedProducts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get trending products
      .addCase(getTrendingProducts.fulfilled, (state, action) => {
        state.trendingProducts = action.payload || [];
      })
      .addCase(getTrendingProducts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get bestseller products
      .addCase(getBestsellerProducts.fulfilled, (state, action) => {
        state.bestsellerProducts = action.payload || [];
      })
      .addCase(getBestsellerProducts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get new arrival products
      .addCase(getNewArrivalProducts.fulfilled, (state, action) => {
        state.newArrivalProducts = action.payload || [];
      })
      .addCase(getNewArrivalProducts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get related products
      .addCase(getRelatedProducts.fulfilled, (state, action) => {
        state.relatedProducts = action.payload || [];
      })
      .addCase(getRelatedProducts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.products || [];
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 0;
        state.totalProducts = action.payload.totalProducts || 0;
        state.error = null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSortBy,
  setSearchQuery,
  setCurrentPage,
  clearCurrentProduct,
  clearSearchResults,
  incrementViewCount,
} = productSlice.actions;

export default productSlice.reducer;