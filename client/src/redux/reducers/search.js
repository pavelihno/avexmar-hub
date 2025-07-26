import { createSlice } from '@reduxjs/toolkit';
import { fetchSearchAirports, fetchSearchFlights } from '../actions/search';
import { handlePending, handleRejected } from '../utils';

const initialState = {
    airports: [],
    flights: [],
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
            .addCase(fetchSearchAirports.fulfilled, (state, action) => {
                state.airports = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchSearchAirports.rejected, handleRejected)
            .addCase(fetchSearchFlights.pending, handlePending)
            .addCase(fetchSearchFlights.fulfilled, (state, action) => {
                state.flights = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchSearchFlights.rejected, handleRejected);
    },
});

export default searchSlice.reducer;
