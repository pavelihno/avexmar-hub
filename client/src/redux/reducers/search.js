import { createSlice } from '@reduxjs/toolkit';
import { fetchScheduleFlights, fetchSearchAirports, fetchSearchFlights, fetchNearbyOutboundFlights, fetchNearbyReturnFlights } from '../actions/search';
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

            .addCase(fetchNearbyOutboundFlights.pending, (state) => {
                state.nearbyOutboundLoading = true;
            })
            .addCase(fetchNearbyOutboundFlights.rejected, (state, action) => {
                state.nearbyOutboundLoading = false;
                state.errors = action.payload;
            })
            .addCase(fetchNearbyOutboundFlights.fulfilled, (state, action) => {
                state.nearbyOutboundFlights = action.payload;
                state.nearbyOutboundLoading = false;
            })

            .addCase(fetchNearbyReturnFlights.pending, (state) => {
                state.nearbyReturnLoading = true;
            })
            .addCase(fetchNearbyReturnFlights.rejected, (state, action) => {
                state.nearbyReturnLoading = false;
                state.errors = action.payload;
            })
            .addCase(fetchNearbyReturnFlights.fulfilled, (state, action) => {
                state.nearbyReturnFlights = action.payload;
                state.nearbyReturnLoading = false;
            });
    },
});

export default searchSlice.reducer;
