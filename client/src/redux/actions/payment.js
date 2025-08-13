import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const createPayment = createAsyncThunk('payment/create', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/bookings/process/payment', data);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const fetchPayment = createAsyncThunk('payment/fetch', async (publicId, { rejectWithValue }) => {
	try {
		const res = await serverApi.get(`/bookings/process/payment/${publicId}/details`);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});
