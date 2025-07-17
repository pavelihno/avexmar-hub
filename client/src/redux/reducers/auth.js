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
			.addCase(login.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})
			.addCase(login.rejected, handleRejected)

			// Register
			.addCase(register.pending, handlePending)
			.addCase(register.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})
			.addCase(register.rejected, handleRejected)

			// Auth verification
			.addCase(auth.pending, handlePending)
			.addCase(auth.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})
			.addCase(auth.rejected, handleRejected)

			// Logout
			.addCase(logout.pending, handlePending)
			.addCase(logout.fulfilled, (state) => {
				state.currentUser = null;
				state.isLoading = false;
			})
			.addCase(logout.rejected, handleRejected)

			// Change password
                        .addCase(changePassword.pending, handlePending)
                        .addCase(changePassword.fulfilled, (state) => {
                                state.isLoading = false;
                        })
                        .addCase(changePassword.rejected, handleRejected)

                        // Reset password
                        .addCase(resetPassword.pending, handlePending)
                        .addCase(resetPassword.fulfilled, (state, action) => {
                                state.currentUser = action.payload;
                                state.isLoading = false;
                        })
                        .addCase(resetPassword.rejected, handleRejected);
        },
});

export const { setCurrentUser, setErrors } = authSlice.actions;
export const selectIsAuth = (state) => !!state.auth.currentUser;
export const selectIsAdmin = (state) =>
	!!state.auth.currentUser && state.auth.currentUser.role === 'admin';

export const isDev = () => process.env.REACT_APP_APP_ENV in ('dev', 'test');

export default authSlice.reducer;
