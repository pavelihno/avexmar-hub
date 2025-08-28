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
	airportsLoading: false,

	flights: [],
	flightsLoading: false,

	nearbyOutboundFlights: [],
	nearbyOutboundLoading: false,

	nearbyReturnFlights: [],
	nearbyReturnLoading: false,

	outboundFlightTariffs: [],
	outboundTariffsLoading: false,
	returnFlightTariffs: [],
	returnTariffsLoading: false,

	errors: null,
};

const searchSlice = createSlice({
	name: 'search',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSearchAirports.pending, (state) =>
				handlePending(state, null, { loadingKey: 'airportsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchSearchAirports.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'airportsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchSearchAirports.fulfilled, (state, action) => {
				state.airports = action.payload;
				state.airportsLoading = false;
			})

			.addCase(fetchSearchFlights.pending, (state) =>
				handlePending(state, null, { loadingKey: 'flightsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchSearchFlights.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'flightsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchSearchFlights.fulfilled, (state, action) => {
				state.flights = action.payload;
				state.flightsLoading = false;
			})

			.addCase(fetchScheduleFlights.pending, (state) =>
				handlePending(state, null, { loadingKey: 'flightsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchScheduleFlights.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'flightsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchScheduleFlights.fulfilled, (state, action) => {
				state.flights = action.payload;
				state.flightsLoading = false;
			})

			.addCase(fetchNearbyOutboundFlights.pending, (state) =>
				handlePending(state, null, { loadingKey: 'nearbyOutboundLoading', errorsKey: 'errors' })
			)
			.addCase(fetchNearbyOutboundFlights.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'nearbyOutboundLoading', errorsKey: 'errors' })
			)
			.addCase(fetchNearbyOutboundFlights.fulfilled, (state, action) => {
				state.nearbyOutboundFlights = action.payload;
				state.nearbyOutboundLoading = false;
			})

			.addCase(fetchNearbyReturnFlights.pending, (state) =>
				handlePending(state, null, { loadingKey: 'nearbyReturnLoading', errorsKey: 'errors' })
			)
			.addCase(fetchNearbyReturnFlights.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'nearbyReturnLoading', errorsKey: 'errors' })
			)
			.addCase(fetchNearbyReturnFlights.fulfilled, (state, action) => {
				state.nearbyReturnFlights = action.payload;
				state.nearbyReturnLoading = false;
			})

			.addCase(fetchOutboundFlightTariffs.pending, (state) =>
				handlePending(state, null, { loadingKey: 'outboundTariffsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchOutboundFlightTariffs.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'outboundTariffsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchOutboundFlightTariffs.fulfilled, (state, action) => {
				state.outboundFlightTariffs = action.payload;
				state.outboundTariffsLoading = false;
			})

			.addCase(fetchReturnFlightTariffs.pending, (state) =>
				handlePending(state, null, { loadingKey: 'returnTariffsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchReturnFlightTariffs.rejected, (state, action) =>
				handleRejected(state, action, { loadingKey: 'returnTariffsLoading', errorsKey: 'errors' })
			)
			.addCase(fetchReturnFlightTariffs.fulfilled, (state, action) => {
				state.returnFlightTariffs = action.payload;
				state.returnTariffsLoading = false;
			});
	},
});

export default searchSlice.reducer;
