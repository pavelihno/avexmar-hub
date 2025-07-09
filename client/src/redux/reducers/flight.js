import { createSlice } from '@reduxjs/toolkit';

import {
	fetchFlights,
	fetchFlight,
	createFlight,
	updateFlight,
	deleteFlight,
} from '../actions/flight';
import { addCrudCases } from '../utils';

const initialState = {
	flights: [],
	flight: null,
	isLoading: false,
	errors: null,
};

const flightSlice = createSlice({
	name: 'flights',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchFlights,
				fetchOne: fetchFlight,
				create: createFlight,
				update: updateFlight,
				remove: deleteFlight,
			},
			'flights',
			'flight'
		);
	},
});

export default flightSlice.reducer;
