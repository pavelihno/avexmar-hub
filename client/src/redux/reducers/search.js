import { createSlice } from '@reduxjs/toolkit';
import { fetchScheduleFlights, fetchSearchAirports, fetchSearchFlights, fetchNearbyDateFlights } from '../actions/search';
import { handlePending, handleRejected } from '../utils';

const initialState = {
    airports: [],
    flights: [],
    nearbyFlights: [],
    isLoading: false,
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

            .addCase(fetchNearbyDateFlights.pending, handlePending)
            .addCase(fetchNearbyDateFlights.rejected, handleRejected)
            .addCase(fetchNearbyDateFlights.fulfilled, (state, action) => {
                state.nearbyFlights = action.payload;
                state.isLoading = false;
            });
    },
});

export default searchSlice.reducer;
