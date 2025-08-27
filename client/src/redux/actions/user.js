import { createAsyncThunk } from '@reduxjs/toolkit';

import { createCrudActions, getErrorData } from '../utils';
import { serverApi } from '../../api';

export const {
	fetchAll: fetchUsers,
	fetchOne: fetchUser,
	create: createUser,
	update: updateUser,
	remove: deleteUser,
	removeAll: deleteAllUsers,
} = createCrudActions('users');

export const changePassword = createAsyncThunk(
	'users/changePassword',
	async (data, { rejectWithValue }) => {
		try {
			const res = await serverApi.put('/users/change_password', data);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	},
);
