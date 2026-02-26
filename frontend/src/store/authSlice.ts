import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: 'DRIVER' | 'FREIGHT_COMPANY' | 'PRODUCER' | 'TERMINAL_ADMIN';
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
