import { createSlice } from '@reduxjs/toolkit';
import { fetchExportRoutes, fetchExportFlights } from '../actions/flightPassengerExport';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	routes: [],
	flights: [],
	isLoading: false,
	errors: null,
};

const flightPassengerExportSlice = createSlice({
	name: 'flightPassengerExport',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchExportRoutes.pending, handlePending)
			.addCase(fetchExportRoutes.fulfilled, (state, action) => {
				state.routes = action.payload;
				state.isLoading = false;
			})
			.addCase(fetchExportRoutes.rejected, handleRejected)
			.addCase(fetchExportFlights.pending, handlePending)
			.addCase(fetchExportFlights.fulfilled, (state, action) => {
				state.flights = action.payload;
				state.isLoading = false;
			})
			.addCase(fetchExportFlights.rejected, handleRejected);
	},
});

export default flightPassengerExportSlice.reducer;
