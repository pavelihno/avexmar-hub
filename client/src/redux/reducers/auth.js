import { createSlice } from '@reduxjs/toolkit';

import { login, register, auth, logout } from '../actions/auth';
import { changePassword } from '../actions/user';

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
			.addCase(login.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})
			.addCase(login.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
			})
			.addCase(register.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(register.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})
			.addCase(register.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
			})
			.addCase(auth.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(auth.fulfilled, (state, action) => {
				state.currentUser = action.payload;
				state.isLoading = false;
			})
			.addCase(auth.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
			})
			.addCase(logout.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(logout.fulfilled, (state) => {
				state.currentUser = null;
				state.isLoading = false;
			})
			.addCase(logout.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
			})
			.addCase(changePassword.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(changePassword.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(changePassword.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
			});
	},
});

export const { setCurrentUser, setErrors } = authSlice.actions;
export const selectIsAuth = (state) => !!state.auth.currentUser;
export const selectIsAdmin = (state) => !!state.auth.currentUser && state.auth.currentUser.role == 'admin';

export default authSlice.reducer;
