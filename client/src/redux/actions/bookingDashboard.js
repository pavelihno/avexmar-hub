import { createAsyncThunk } from '@reduxjs/toolkit';

import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const fetchBookingDashboard = createAsyncThunk(
	'bookingDashboard/fetch',
	async (params = {}, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/booking/dashboard', { params });
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
