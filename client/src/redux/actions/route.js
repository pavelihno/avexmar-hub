import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';

export const fetchRoutes = createAsyncThunk(
	'routes/fetchRoutes',
	async (_, { rejectWithValue }) => {
		try {
			const response = await serverApi.get('/routes');
			return response.data;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

export const createRoute = createAsyncThunk(
	'routes/createRoute',
	async (routeData, { rejectWithValue }) => {
		try {
			const response = await serverApi.post('/routes', routeData);
			return response.data;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

export const updateRoute = createAsyncThunk(
	'routes/updateRoute',
	async (routeData, { rejectWithValue }) => {
		try {
			const response = await serverApi.put(
				`/routes/${routeData.id}`,
				routeData
			);
			return response.data;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

export const deleteRoute = createAsyncThunk(
	'routes/deleteRoute',
	async (id, { rejectWithValue }) => {
		try {
			await serverApi.delete(`/routes/${id}`);
			return id;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);
