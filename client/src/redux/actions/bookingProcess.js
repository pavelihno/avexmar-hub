import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData } from '../utils';

export const processBookingCreate = createAsyncThunk(
        'bookingProcess/create',
        async (data, { rejectWithValue }) => {
                try {
                        const res = await serverApi.post('/bookings/process/create', data);
                        return { ...data, ...res.data };
                } catch (err) {
                        return rejectWithValue(getErrorData(err));
                }
        }
);

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
