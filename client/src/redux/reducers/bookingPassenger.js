import { createSlice } from '@reduxjs/toolkit';

import {
	fetchBookingPassengers,
	fetchBookingPassenger,
	createBookingPassenger,
	updateBookingPassenger,
	deleteBookingPassenger,
} from '../actions/bookingPassenger';
import { addCrudCases } from '../utils';

const initialState = {
	bookingPassengers: [],
	bookingPassenger: null,
	isLoading: false,
	errors: null,
};

const bookingPassengerSlice = createSlice({
	name: 'bookingPassengers',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchBookingPassengers,
				fetchOne: fetchBookingPassenger,
				create: createBookingPassenger,
				update: updateBookingPassenger,
				remove: deleteBookingPassenger,
			},
			'bookingPassengers',
			'bookingPassenger'
		);
	},
});

export default bookingPassengerSlice.reducer;
