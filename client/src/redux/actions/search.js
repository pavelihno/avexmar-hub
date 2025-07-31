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
