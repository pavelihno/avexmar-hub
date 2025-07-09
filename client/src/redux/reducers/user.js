import { createSlice } from '@reduxjs/toolkit';

import {
	fetchUsers,
	fetchUser,
	createUser,
	updateUser,
	deleteUser,
	changePassword,
} from '../actions/user';
import { addCrudCases, handlePending, handleRejected } from '../utils';

const initialState = {
	users: [],
	user: null,
	isLoading: false,
	errors: null,
};

const userSlice = createSlice({
	name: 'users',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchUsers,
				fetchOne: fetchUser,
				create: createUser,
				update: updateUser,
				remove: deleteUser,
			},
			'users',
			'user'
		);

		builder
			.addCase(changePassword.pending, handlePending)
			.addCase(changePassword.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(changePassword.rejected, handleRejected);
	},
});

export default userSlice.reducer;
