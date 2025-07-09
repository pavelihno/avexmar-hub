import { createAsyncThunk } from '@reduxjs/toolkit';

import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const fetchAirports = createAsyncThunk(
	'airports/getAll',
	async (_, { rejectWithValue }) => {
		try {
			const res = await serverApi.get('/airports');
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const fetchAirport = createAsyncThunk(
	'airports/get',
	async (id, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/airports/${id}`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const createAirport = createAsyncThunk(
	'airports/create',
	async (airportData, { rejectWithValue }) => {
		try {
			const res = await serverApi.post('/airports', airportData);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const updateAirport = createAsyncThunk(
	'airports/update',
	async (airportData, { rejectWithValue }) => {
		try {
			const res = await serverApi.put(
				`/airports/${airportData.id}`,
				airportData
			);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);

export const deleteAirport = createAsyncThunk(
	'airports/delete',
	async (airportId, { rejectWithValue }) => {
		try {
			const res = await serverApi.delete(`/airports/${airportId}`);
			return { id: airportId, data: res.data };
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
