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

export const fetchBookingPassengers = createAsyncThunk(
	'bookingProcess/fetchPassengers',
	async (publicId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/bookings/${publicId}/passengers`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const saveBookingPassenger = createAsyncThunk(
	'bookingProcess/savePassenger',
	async ({ public_id, passenger }, { rejectWithValue }) => {
		try {
			const res = await serverApi.post(`/bookings/${public_id}/passengers`, { passenger });
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
			const res = await serverApi.get(`/bookings/${publicId}/details`);
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
			const res = await serverApi.get(`/bookings/${publicId}/access`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchBookingDirectionsInfo = createAsyncThunk(
	'bookingProcess/fetchDirectionsInfo',
	async (directions, { rejectWithValue }) => {
		try {
			const info = {};
			await Promise.all(
				directions.map(async (d) => {
					const flight = (await serverApi.get(`/flights/${d.flight_id}`)).data;
					const route = (await serverApi.get(`/routes/${flight.route_id}`)).data;
					const origin = (await serverApi.get(`/airports/${route.origin_airport_id}`)).data;
					const dest = (await serverApi.get(`/airports/${route.destination_airport_id}`)).data;
					info[d.direction] = {
						from: origin.city || origin.iata_code,
						to: dest.city || dest.iata_code,
					};
				})
			);
			return info;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
