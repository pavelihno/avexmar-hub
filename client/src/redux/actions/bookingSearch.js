import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const searchBooking = createAsyncThunk('bookingSearch/search', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/search/booking', data);
		return res.data.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});
