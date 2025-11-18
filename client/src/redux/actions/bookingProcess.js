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
	async (arg, { rejectWithValue }) => {
		try {
			const { accessToken, ...data } = arg || {};
			const res = await serverApi.post('/booking/passengers', data, buildAccessParams(accessToken));
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

const buildAccessParams = (accessToken) => (accessToken ? { params: { access_token: accessToken } } : {});

export const fetchBookingDetails = createAsyncThunk('bookingProcess/fetchDetails', async (arg, { rejectWithValue }) => {
	try {
		const { publicId, accessToken } = typeof arg === 'string' ? { publicId: arg } : arg || {};
		const res = await serverApi.get(`/booking/${publicId}/details`, buildAccessParams(accessToken));
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const fetchBookingAccess = createAsyncThunk('bookingProcess/fetchAccess', async (arg, { rejectWithValue }) => {
	try {
		const { publicId, accessToken } = typeof arg === 'string' ? { publicId: arg } : arg || {};
		const res = await serverApi.get(`/booking/${publicId}/access`, buildAccessParams(accessToken));
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const downloadBookingPdf = createAsyncThunk('bookingProcess/downloadPdf', async (arg, { rejectWithValue }) => {
	try {
		const { publicId, accessToken } = typeof arg === 'string' ? { publicId: arg } : arg || {};
		const res = await serverApi.get(`/booking/${publicId}/pdf`, {
			responseType: 'blob',
			...buildAccessParams(accessToken),
		});
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const downloadItineraryPdf = createAsyncThunk(
	'bookingProcess/downloadItineraryPdf',
	async (arg, { rejectWithValue }) => {
		try {
			const { publicId, bookingFlightId, accessToken } = arg || {};
			const res = await serverApi.get(`/booking/${publicId}/itinerary-pdf/${bookingFlightId}`, {
				responseType: 'blob',
				...buildAccessParams(accessToken),
			});
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const confirmBooking = createAsyncThunk(
	'bookingProcess/confirm',
	async ({ publicId, isPayment = true, accessToken }, { rejectWithValue }) => {
		try {
			const payload = {
				public_id: publicId,
				is_payment: isPayment,
			};
			const res = await serverApi.post('/booking/confirm', payload, buildAccessParams(accessToken));
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchTicketRefundDetails = createAsyncThunk(
	'bookingProcess/fetchTicketRefundDetails',
	async ({ publicId, ticketId, accessToken }, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/booking/${publicId}/${ticketId}/refund`, buildAccessParams(accessToken));
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const requestTicketRefund = createAsyncThunk(
	'bookingProcess/requestTicketRefund',
	async ({ publicId, ticketId, accessToken }, { rejectWithValue }) => {
		try {
			const res = await serverApi.post(
				`/booking/${publicId}/${ticketId}/refund`,
				{},
				buildAccessParams(accessToken)
			);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
