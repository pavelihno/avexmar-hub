import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const fetchSearchAirports = createAsyncThunk('search/fetchAirports', async (_, { rejectWithValue }) => {
	try {
		const res = await serverApi.get('/search/airports');
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const fetchSearchFlights = createAsyncThunk('search/fetchFlights', async (params, { rejectWithValue }) => {
	try {
		const res = await serverApi.get('/search/flights', { params });
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const fetchNearbyOutboundFlights = createAsyncThunk(
	'search/fetchNearbyOutboundFlights',
	async (params, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/search/flights/nearby', { params });
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchNearbyReturnFlights = createAsyncThunk(
	'search/fetchNearbyReturnFlights',
	async (params, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/search/flights/nearby', { params });
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchScheduleFlights = createAsyncThunk(
	'search/fetchScheduleFlights',
	async (params, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/search/flights/schedule', { params });
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchOutboundFlightTariffs = createAsyncThunk(
	'search/fetchOutboundFlightTariffs',
	async (flightId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/search/flights/${flightId}/tariffs`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchReturnFlightTariffs = createAsyncThunk(
	'search/fetchReturnFlightTariffs',
	async (flightId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/search/flights/${flightId}/tariffs`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
