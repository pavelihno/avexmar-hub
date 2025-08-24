import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const fetchExportData = createAsyncThunk(
	'exports/fetchData',
	async ({ key, endpoint, params }, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(endpoint, { params });
			return { key, data: res.data.data || res.data };
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	},
);

export const downloadExport = createAsyncThunk(
	'exports/download',
	async ({ endpoint, params, data, method = 'get' }, { rejectWithValue }) => {
		try {
			const res = await serverApi.request({
				url: endpoint,
				method,
				params,
				data,
				responseType: 'blob',
			});
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	},
);
