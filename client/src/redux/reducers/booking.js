import { createSlice } from '@reduxjs/toolkit';

import {
	fetchBookings,
	fetchBooking,
	createBooking,
	updateBooking,
	deleteBooking,
	fetchUserBookings,
} from '../actions/booking';
import { addCrudCases, handlePending, handleRejected } from '../utils';

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
			'booking',
		);

		builder
			.addCase(fetchUserBookings.pending, handlePending)
			.addCase(fetchUserBookings.fulfilled, (state, action) => {
				state.bookings = action.payload;
				state.isLoading = false;
			})
			.addCase(fetchUserBookings.rejected, handleRejected);
	},
});

export default bookingSlice.reducer;
