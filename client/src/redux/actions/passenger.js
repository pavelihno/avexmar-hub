import { createCrudActions, getErrorData } from '../utils';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';

export const {
	fetchAll: fetchPassengers,
	fetchOne: fetchPassenger,
	create: createPassenger,
	update: updatePassenger,
	remove: deletePassenger,
	removeAll: deleteAllPassengers,
	removeFiltered: deleteFilteredPassengers,
} = createCrudActions('passengers');

export const fetchUserPassengers = createAsyncThunk(
	'passengers/fetchUserPassengers',
	async (userId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/users/${userId}/passengers`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const createUserPassenger = createAsyncThunk(
	'passengers/createUserPassenger',
	async ({ userId, data }, { rejectWithValue }) => {
		try {
			const res = await serverApi.post(`/users/${userId}/passengers`, data);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
