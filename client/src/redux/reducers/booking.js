import { createSlice } from '@reduxjs/toolkit';

import {
	fetchBookings,
	fetchBooking,
	createBooking,
	updateBooking,
	deleteBooking,
} from '../actions/booking';
import { addCrudCases } from '../utils';

const initialState = {
	bookings: [],
	booking: null,
	isLoading: false,
	errors: null,
};

const bookingSlice = createSlice({
	name: 'bookings',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchBookings,
				fetchOne: fetchBooking,
				create: createBooking,
				update: updateBooking,
				remove: deleteBooking,
			},
			'bookings',
			'booking'
		);
	},
});

export default bookingSlice.reducer;
