import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const processBookingCreate = createAsyncThunk('bookingProcess/create', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/booking/create', data);
		return { ...data, ...res.data };
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const processBookingPassengers = createAsyncThunk(
	'bookingProcess/passengers',
	async (data, { rejectWithValue }) => {
		try {
			const res = await serverApi.post('/booking/passengers', data);
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
			const res = await serverApi.get(`/booking/${publicId}/details`);
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
			const res = await serverApi.get(`/booking/${publicId}/access`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const downloadBookingPdf = createAsyncThunk(
	'bookingProcess/downloadPdf',
	async (publicId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/booking/${publicId}/pdf`, { responseType: 'blob' });
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const confirmBooking = createAsyncThunk(
	'bookingProcess/confirm',
	async ({ publicId, isPayment = true }, { rejectWithValue }) => {
		try {
			const payload = {
				public_id: publicId,
				is_payment: isPayment,
			};
			const res = await serverApi.post('/booking/confirm', payload);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
