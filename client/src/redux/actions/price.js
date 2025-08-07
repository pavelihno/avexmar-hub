import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const calculatePrice = createAsyncThunk(
    'price/calculate',
    async (params, { getState, rejectWithValue }) => {
        const key = JSON.stringify(params);
        const cache = getState().price.cache;
        if (cache[key]) {
            return { key, data: cache[key] };
        }
        try {
            const res = await serverApi.post('/price/calculate', params);
            return { key, data: res.data };
        } catch (err) {
            return rejectWithValue(getErrorData(err));
        }
    }
);
