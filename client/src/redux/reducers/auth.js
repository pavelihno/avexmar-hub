import { createSlice } from '@reduxjs/toolkit';

import { login, register, auth, logout, resetPassword } from '../actions/auth';
import { changePassword } from '../actions/user';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	currentUser: null,
	errors: null,
	isLoading: false,
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setCurrentUser(state, action) {
			state.currentUser = action.payload;
		},
		setErrors(state, action) {
			state.errors = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			// Login
			.addCase(login.pending, handlePending)
			.addCase(login.rejected, handleRejected)
			.addCase(login.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})

			// Register
			.addCase(register.pending, handlePending)
			.addCase(register.rejected, handleRejected)
			.addCase(register.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})

			// Auth verification
			.addCase(auth.pending, handlePending)
			.addCase(auth.rejected, handleRejected)
			.addCase(auth.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})

			// Logout
			.addCase(logout.pending, handlePending)
			.addCase(logout.rejected, handleRejected)
			.addCase(logout.fulfilled, (state) => {
				state.currentUser = null;
				state.isLoading = false;
			})

			// Change password
			.addCase(changePassword.pending, handlePending)
			.addCase(changePassword.rejected, handleRejected)
			.addCase(changePassword.fulfilled, (state) => {
				state.isLoading = false;
			})

			// Reset password
			.addCase(resetPassword.pending, handlePending)
			.addCase(resetPassword.rejected, handleRejected)
			.addCase(resetPassword.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			});
	},
});

export const { setCurrentUser, setErrors } = authSlice.actions;
export const selectIsAuth = (state) => !!state.auth.currentUser;
export const selectIsAdmin = (state) => !!state.auth.currentUser && state.auth.currentUser.role === 'admin';

export const isDev = () => process.env.REACT_APP_APP_ENV in ('dev', 'test');

export default authSlice.reducer;
