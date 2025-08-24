import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const fetchExportRoutes = createAsyncThunk(
	'flightPassengerExport/fetchRoutes',
	async (_, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/exports/flight-passengers/routes');
			return res.data.data || res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	},
);

export const fetchExportFlights = createAsyncThunk(
	'flightPassengerExport/fetchFlights',
	async (routeId, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/exports/flight-passengers/routes/${routeId}/flights`);
			return res.data.data || res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	},
);

export const downloadFlightPassengerExport = createAsyncThunk(
	'flightPassengerExport/download',
	async ({ flightId, date }, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/exports/flight-passengers', {
				params: { flight_id: flightId, date },
				responseType: 'blob',
			});
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	},
);
