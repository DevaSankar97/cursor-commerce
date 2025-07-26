import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: {
    url: string;
    public_id: string;
  } | null;
  role: 'user' | 'admin' | 'vendor';
  addresses: Address[];
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  accountStatus: 'active' | 'inactive' | 'suspended';
  loyaltyPoints: number;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    language: string;
  };
}

interface Address {
  _id: string;
  type: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isEmailVerificationSent: boolean;
  isPhoneVerificationSent: boolean;
  twoFactorRequired: boolean;
  passwordResetEmailSent: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  isEmailVerificationSent: false,
  isPhoneVerificationSent: false,
  twoFactorRequired: false,
  passwordResetEmailSent: false,
};

// Set up axios defaults
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

// Set auth token
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data.data;
      setAuthToken(token);
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Registration failed'
      );
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: {
    email: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      const { token, user, twoFactorRequired } = response.data.data;
      
      if (twoFactorRequired) {
        return { twoFactorRequired: true };
      }
      
      setAuthToken(token);
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Login failed'
      );
    }
  }
);

// Load user from token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
    
    try {
      const response = await axios.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      setAuthToken(null);
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to load user'
      );
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/logout');
      setAuthToken(null);
      return true;
    } catch (error: any) {
      setAuthToken(null);
      return rejectWithValue(
        error.response?.data?.error?.message || 'Logout failed'
      );
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put('/auth/update-password', passwordData);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Password update failed'
      );
    }
  }
);

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to send reset email'
      );
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData: {
    token: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/auth/reset-password/${resetData.token}`, {
        password: resetData.password
      });
      const { token, user } = response.data.data;
      setAuthToken(token);
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Password reset failed'
      );
    }
  }
);

// Verify email
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/auth/verify-email/${token}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Email verification failed'
      );
    }
  }
);

// Resend email verification
export const resendEmailVerification = createAsyncThunk(
  'auth/resendEmailVerification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/resend-verification-email');
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to resend verification email'
      );
    }
  }
);

// Verify phone
export const verifyPhone = createAsyncThunk(
  'auth/verifyPhone',
  async (otp: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/verify-phone', { otp });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Phone verification failed'
      );
    }
  }
);

// Resend phone verification
export const resendPhoneVerification = createAsyncThunk(
  'auth/resendPhoneVerification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/resend-phone-verification');
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to resend phone verification'
      );
    }
  }
);

// Enable two-factor authentication
export const enableTwoFactor = createAsyncThunk(
  'auth/enableTwoFactor',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/enable-2fa');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to enable two-factor authentication'
      );
    }
  }
);

// Disable two-factor authentication
export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (password: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/disable-2fa', { password });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to disable two-factor authentication'
      );
    }
  }
);

// Verify two-factor code
export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/verify-2fa', { code });
      const { token, user } = response.data.data;
      setAuthToken(token);
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Two-factor verification failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.isEmailVerificationSent = false;
      state.isPhoneVerificationSent = false;
      state.passwordResetEmailSent = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setTwoFactorRequired: (state, action: PayloadAction<boolean>) => {
      state.twoFactorRequired = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.twoFactorRequired) {
          state.twoFactorRequired = true;
        } else {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.twoFactorRequired = false;
        }
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.twoFactorRequired = false;
      })
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
        state.twoFactorRequired = false;
      })
      // Update password
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.passwordResetEmailSent = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.passwordResetEmailSent = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify email
      .addCase(verifyEmail.fulfilled, (state, action) => {
        if (state.user) {
          state.user.emailVerified = true;
        }
        state.isEmailVerificationSent = false;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Resend email verification
      .addCase(resendEmailVerification.fulfilled, (state) => {
        state.isEmailVerificationSent = true;
        state.error = null;
      })
      .addCase(resendEmailVerification.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Verify phone
      .addCase(verifyPhone.fulfilled, (state) => {
        if (state.user) {
          state.user.phoneVerified = true;
        }
        state.isPhoneVerificationSent = false;
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Resend phone verification
      .addCase(resendPhoneVerification.fulfilled, (state) => {
        state.isPhoneVerificationSent = true;
        state.error = null;
      })
      .addCase(resendPhoneVerification.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Enable two-factor
      .addCase(enableTwoFactor.fulfilled, (state) => {
        if (state.user) {
          state.user.twoFactorEnabled = true;
        }
      })
      .addCase(enableTwoFactor.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Disable two-factor
      .addCase(disableTwoFactor.fulfilled, (state) => {
        if (state.user) {
          state.user.twoFactorEnabled = false;
        }
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Verify two-factor
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.twoFactorRequired = false;
        state.error = null;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearMessages, updateUser, setTwoFactorRequired } = authSlice.actions;
export default authSlice.reducer;