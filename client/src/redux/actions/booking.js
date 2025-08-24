import { createCrudActions, getErrorData } from '../utils';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';

export const {
	fetchAll: fetchBookings,
	fetchOne: fetchBooking,
	create: createBooking,
	update: updateBooking,
	remove: deleteBooking,
	removeAll: deleteAllBookings,
} = createCrudActions('bookings');

export const fetchUserBookings = createAsyncThunk(
'bookings/fetchUserBookings',
async (userId, { rejectWithValue }) => {
try {
const res = await serverApi.get(`/users/${userId}/bookings`);
return res.data;
} catch (err) {
return rejectWithValue(getErrorData(err));
}
},
);
