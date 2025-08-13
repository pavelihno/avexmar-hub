import { createSlice } from '@reduxjs/toolkit';
import {
	fetchScheduleFlights,
	fetchSearchAirports,
	fetchSearchFlights,
	fetchNearbyOutboundFlights,
	fetchNearbyReturnFlights,
	fetchOutboundFlightTariffs,
	fetchReturnFlightTariffs,
} from '../actions/search';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	airports: [],
	flights: [],
	nearbyOutboundFlights: [],
	nearbyReturnFlights: [],
	isLoading: false,
	nearbyOutboundLoading: false,
	nearbyReturnLoading: false,
	errors: null,
};

const searchSlice = createSlice({
	name: 'search',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSearchAirports.pending, handlePending)
			.addCase(fetchSearchAirports.rejected, handleRejected)
			.addCase(fetchSearchAirports.fulfilled, (state, action) => {
				state.airports = action.payload;
				state.isLoading = false;
			})

			.addCase(fetchSearchFlights.pending, handlePending)
			.addCase(fetchSearchFlights.rejected, handleRejected)
			.addCase(fetchSearchFlights.fulfilled, (state, action) => {
				state.flights = action.payload;
				state.isLoading = false;
			})

			.addCase(fetchScheduleFlights.pending, handlePending)
			.addCase(fetchScheduleFlights.rejected, handleRejected)
			.addCase(fetchScheduleFlights.fulfilled, (state, action) => {
				state.flights = action.payload;
				state.isLoading = false;
			})

			.addCase(fetchNearbyOutboundFlights.pending, handlePending)
			.addCase(fetchNearbyOutboundFlights.rejected, handleRejected)
			.addCase(fetchNearbyOutboundFlights.fulfilled, (state, action) => {
				state.nearbyOutboundFlights = action.payload;
				state.isLoading = false;
			})

			.addCase(fetchNearbyReturnFlights.pending, handlePending)
			.addCase(fetchNearbyReturnFlights.rejected, handleRejected)
			.addCase(fetchNearbyReturnFlights.fulfilled, (state, action) => {
				state.nearbyReturnFlights = action.payload;
				state.isLoading = false;
			})

			.addCase(fetchOutboundFlightTariffs.pending, handlePending)
			.addCase(fetchOutboundFlightTariffs.rejected, handleRejected)
			.addCase(fetchOutboundFlightTariffs.fulfilled, (state, action) => {
				state.outboundFlightTariffs = action.payload;
				state.isLoading = false;
			})

			.addCase(fetchReturnFlightTariffs.pending, handlePending)
			.addCase(fetchReturnFlightTariffs.rejected, handleRejected)
			.addCase(fetchReturnFlightTariffs.fulfilled, (state, action) => {
				state.returnFlightTariffs = action.payload;
				state.isLoading = false;
			});
	},
});

export default searchSlice.reducer;
