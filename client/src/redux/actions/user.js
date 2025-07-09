import { createAsyncThunk } from '@reduxjs/toolkit';

import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const changePassword = createAsyncThunk(
	'user/changePassword',
	async (password, { rejectWithValue }) => {
		try {
			const res = await serverApi.put('/users/change-password', { password });
			const user = res.data;
			return user;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
