import { createAsyncThunk } from '@reduxjs/toolkit';

import { createCrudActions, getErrorData } from '../utils';
import { serverApi } from '../../api';

const {
	fetchAll: fetchUsers,
	fetchOne: fetchUser,
	create: createUser,
	update: updateUser,
	remove: deleteUser,
} = createCrudActions('users');

const changePassword = createAsyncThunk(
	'users/changePassword',
	async (password, { rejectWithValue }) => {
		try {
			const res = await serverApi.put('/users/change_password', {
				password,
			});
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export {
	fetchUsers,
	fetchUser,
	createUser,
	updateUser,
	deleteUser,
	changePassword,
};
