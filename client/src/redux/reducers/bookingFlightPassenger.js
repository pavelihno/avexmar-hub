import { createSlice } from '@reduxjs/toolkit';

import {
	fetchBookingFlightPassengers,
	fetchBookingFlightPassenger,
	createBookingFlightPassenger,
	updateBookingFlightPassenger,
	deleteBookingFlightPassenger,
} from '../actions/bookingFlightPassenger';
import { addCrudCases } from '../utils';

const initialState = {
	bookingFlightPassengers: [],
	bookingFlightPassenger: null,
	isLoading: false,
	errors: null,
};

const bookingFlightPassengerSlice = createSlice({
	name: 'bookingFlightPassengers',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchBookingFlightPassengers,
				fetchOne: fetchBookingFlightPassenger,
				create: createBookingFlightPassenger,
				update: updateBookingFlightPassenger,
				remove: deleteBookingFlightPassenger,
			},
			'bookingFlightPassengers',
			'bookingFlightPassenger'
		);
	},
});

export default bookingFlightPassengerSlice.reducer;
