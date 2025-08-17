import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const processBookingCreate = createAsyncThunk('bookingProcess/create', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/bookings/process/create', data);
		return { ...data, ...res.data };
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const processBookingPassengers = createAsyncThunk(
	'bookingProcess/passengers',
	async (data, { rejectWithValue }) => {
		try {
			const res = await serverApi.post('/bookings/process/passengers', data);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchBookingDetails = createAsyncThunk(
	'bookingProcess/fetchDetails',
	async (publicId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/bookings/process/${publicId}/details`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchBookingAccess = createAsyncThunk(
	'bookingProcess/fetchAccess',
	async (publicId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/bookings/process/${publicId}/access`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const confirmBooking = createAsyncThunk('bookingProcess/confirm', async (publicId, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/bookings/process/confirm', { public_id: publicId });
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const fetchCompletionDetails = createAsyncThunk(
	'bookingProcess/fetchCompletion',
	async (publicId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/bookings/process/${publicId}/completion`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
