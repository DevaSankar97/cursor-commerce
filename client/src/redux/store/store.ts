import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../slices/authSlice';
import cartSlice from '../slices/cartSlice';
import productSlice from '../slices/productSlice';
import categorySlice from '../slices/categorySlice';
import orderSlice from '../slices/orderSlice';
import wishlistSlice from '../slices/wishlistSlice';
import addressSlice from '../slices/addressSlice';
import reviewSlice from '../slices/reviewSlice';
import uiSlice from '../slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    products: productSlice,
    categories: categorySlice,
    orders: orderSlice,
    wishlist: wishlistSlice,
    addresses: addressSlice,
    reviews: reviewSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;