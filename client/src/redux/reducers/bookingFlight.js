import { createSlice } from '@reduxjs/toolkit';

import {
	fetchBookingFlights,
	fetchBookingFlight,
	createBookingFlight,
	updateBookingFlight,
	deleteBookingFlight,
} from '../actions/bookingFlight';
import { addCrudCases } from '../utils';

const initialState = {
	bookingFlights: [],
	bookingFlight: null,
	isLoading: false,
	errors: null,
};

const bookingFlightSlice = createSlice({
	name: 'bookingFlights',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchBookingFlights,
				fetchOne: fetchBookingFlight,
				create: createBookingFlight,
				update: updateBookingFlight,
				remove: deleteBookingFlight,
			},
			'bookingFlights',
			'bookingFlight'
		);
	},
});

export default bookingFlightSlice.reducer;
