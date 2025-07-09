import { createSlice } from '@reduxjs/toolkit';

import {
	fetchAirports,
	fetchAirport,
	createAirport,
	updateAirport,
	deleteAirport,
} from '../actions/airport';

const initialState = {
	airports: [],
	airport: null,
	isLoading: false,
	errors: null,
	currentOperation: null,
};

const airportSlice = createSlice({
	name: 'airports',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			// Fetch all airports
			.addCase(fetchAirports.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
				state.currentOperation = 'fetch';
			})
			.addCase(fetchAirports.fulfilled, (state, action) => {
				state.airports = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			})
			.addCase(fetchAirports.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			})

			// Fetch single airport
			.addCase(fetchAirport.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
				state.currentOperation = 'fetch';
			})
			.addCase(fetchAirport.fulfilled, (state, action) => {
				state.airport = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			})
			.addCase(fetchAirport.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			})

			// Create airport
			.addCase(createAirport.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
				state.currentOperation = 'create';
			})
			.addCase(createAirport.fulfilled, (state, action) => {
				state.airports.push(action.payload);
				state.isLoading = false;
				state.currentOperation = null;
			})
			.addCase(createAirport.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			})

			// Update airport
			.addCase(updateAirport.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
				state.currentOperation = 'update';
			})
			.addCase(updateAirport.fulfilled, (state, action) => {
				state.airports = state.airports.map((airport) =>
					airport.id === action.payload.id ? action.payload : airport
				);
				state.isLoading = false;
				state.currentOperation = null;
			})
			.addCase(updateAirport.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			})

			// Delete airport
			.addCase(deleteAirport.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
				state.currentOperation = 'delete';
			})
			.addCase(deleteAirport.fulfilled, (state, action) => {
				state.airports = state.airports.filter(
					(airport) => airport.id !== action.payload.id
				);
				state.isLoading = false;
				state.currentOperation = null;
			})
			.addCase(deleteAirport.rejected, (state, action) => {
				state.errors = action.payload;
				state.isLoading = false;
				state.currentOperation = null;
			});
	},
});

export default airportSlice.reducer;
