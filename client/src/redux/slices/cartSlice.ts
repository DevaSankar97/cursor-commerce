import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
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
    brand: string;
    category: string;
    inventory: {
      stock: number;
      trackQuantity: boolean;
    };
    status: string;
  };
  quantity: number;
  price: number;
  specifications: {
    size?: string;
    color?: string;
    variant?: string;
  };
  addedAt: string;
}

interface SavedItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
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
    brand: string;
    category: string;
    inventory: {
      stock: number;
      trackQuantity: boolean;
    };
    status: string;
  };
  specifications: {
    size?: string;
    color?: string;
    variant?: string;
  };
  savedAt: string;
}

interface Pricing {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  appliedAt: string;
}

interface CartState {
  items: CartItem[];
  savedForLater: SavedItem[];
  pricing: Pricing;
  coupon: Coupon | null;
  estimatedDelivery: {
    date: string | null;
    slot: {
      start: string;
      end: string;
    } | null;
  };
  loading: boolean;
  error: string | null;
  itemsCount: number;
  uniqueItemsCount: number;
  lastModified: string | null;
}

const initialState: CartState = {
  items: [],
  savedForLater: [],
  pricing: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  },
  coupon: null,
  estimatedDelivery: {
    date: null,
    slot: null,
  },
  loading: false,
  error: null,
  itemsCount: 0,
  uniqueItemsCount: 0,
  lastModified: null,
};

// Get cart
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/cart');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch cart'
      );
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (itemData: {
    productId: string;
    quantity: number;
    specifications?: {
      size?: string;
      color?: string;
      variant?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart/add', itemData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to add item to cart'
      );
    }
  }
);

// Update item quantity
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async (updateData: {
    productId: string;
    quantity: number;
    specifications?: {
      size?: string;
      color?: string;
      variant?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put('/cart/update', updateData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to update cart item'
      );
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (removeData: {
    productId: string;
    specifications?: {
      size?: string;
      color?: string;
      variant?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await axios.delete('/cart/remove', { data: removeData });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to remove item from cart'
      );
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete('/cart/clear');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to clear cart'
      );
    }
  }
);

// Save item for later
export const saveForLater = createAsyncThunk(
  'cart/saveForLater',
  async (saveData: {
    productId: string;
    specifications?: {
      size?: string;
      color?: string;
      variant?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart/save-for-later', saveData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to save item for later'
      );
    }
  }
);

// Move from saved for later to cart
export const moveToCart = createAsyncThunk(
  'cart/moveToCart',
  async (moveData: {
    productId: string;
    specifications?: {
      size?: string;
      color?: string;
      variant?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart/move-to-cart', moveData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to move item to cart'
      );
    }
  }
);

// Remove from saved for later
export const removeFromSaved = createAsyncThunk(
  'cart/removeFromSaved',
  async (removeData: {
    productId: string;
    specifications?: {
      size?: string;
      color?: string;
      variant?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await axios.delete('/cart/remove-saved', { data: removeData });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to remove saved item'
      );
    }
  }
);

// Apply coupon
export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart/apply-coupon', { couponCode });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to apply coupon'
      );
    }
  }
);

// Remove coupon
export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete('/cart/remove-coupon');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to remove coupon'
      );
    }
  }
);

// Validate cart before checkout
export const validateCart = createAsyncThunk(
  'cart/validateCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart/validate');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Cart validation failed'
      );
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocalCart: (state, action: PayloadAction<{
      productId: string;
      quantity: number;
      specifications?: {
        size?: string;
        color?: string;
        variant?: string;
      };
    }>) => {
      // For local cart updates without API call
      const { productId, quantity, specifications = {} } = action.payload;
      const existingItemIndex = state.items.findIndex(item => 
        item.product._id === productId &&
        JSON.stringify(item.specifications) === JSON.stringify(specifications)
      );

      if (existingItemIndex > -1) {
        if (quantity <= 0) {
          state.items.splice(existingItemIndex, 1);
        } else {
          state.items[existingItemIndex].quantity = quantity;
        }
      }

      // Recalculate totals
      state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.uniqueItemsCount = state.items.length;
      state.pricing.subtotal = state.items.reduce(
        (total, item) => total + (item.price * item.quantity), 0
      );
    },
    setEstimatedDelivery: (state, action: PayloadAction<{
      date: string;
      slot: { start: string; end: string };
    }>) => {
      state.estimatedDelivery = action.payload;
    },
    resetCart: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get cart
      .addCase(getCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.savedForLater = action.payload.savedForLater || [];
        state.pricing = action.payload.pricing || initialState.pricing;
        state.coupon = action.payload.coupon || null;
        state.estimatedDelivery = action.payload.estimatedDelivery || initialState.estimatedDelivery;
        state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.uniqueItemsCount = state.items.length;
        state.lastModified = action.payload.lastModified;
        state.error = null;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.pricing = action.payload.pricing || state.pricing;
        state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.uniqueItemsCount = state.items.length;
        state.lastModified = action.payload.lastModified;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.pricing = action.payload.pricing || state.pricing;
        state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.uniqueItemsCount = state.items.length;
        state.lastModified = action.payload.lastModified;
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove from cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.pricing = action.payload.pricing || state.pricing;
        state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.uniqueItemsCount = state.items.length;
        state.lastModified = action.payload.lastModified;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Clear cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.savedForLater = [];
        state.pricing = initialState.pricing;
        state.coupon = null;
        state.itemsCount = 0;
        state.uniqueItemsCount = 0;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Save for later
      .addCase(saveForLater.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.savedForLater = action.payload.savedForLater || [];
        state.pricing = action.payload.pricing || state.pricing;
        state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.uniqueItemsCount = state.items.length;
        state.lastModified = action.payload.lastModified;
        state.error = null;
      })
      .addCase(saveForLater.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Move to cart
      .addCase(moveToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.savedForLater = action.payload.savedForLater || [];
        state.pricing = action.payload.pricing || state.pricing;
        state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.uniqueItemsCount = state.items.length;
        state.lastModified = action.payload.lastModified;
        state.error = null;
      })
      .addCase(moveToCart.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove from saved
      .addCase(removeFromSaved.fulfilled, (state, action) => {
        state.savedForLater = action.payload.savedForLater || [];
        state.error = null;
      })
      .addCase(removeFromSaved.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Apply coupon
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.coupon = action.payload.coupon;
        state.pricing = action.payload.pricing || state.pricing;
        state.error = null;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove coupon
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.coupon = null;
        state.pricing = action.payload.pricing || state.pricing;
        state.error = null;
      })
      .addCase(removeCoupon.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Validate cart
      .addCase(validateCart.fulfilled, (state, action) => {
        // Update cart with any price changes or availability updates
        state.items = action.payload.items || state.items;
        state.pricing = action.payload.pricing || state.pricing;
        state.error = null;
      })
      .addCase(validateCart.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  updateLocalCart, 
  setEstimatedDelivery, 
  resetCart 
} = cartSlice.actions;

export default cartSlice.reducer;