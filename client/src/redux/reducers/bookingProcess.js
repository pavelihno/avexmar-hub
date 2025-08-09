import { createSlice } from '@reduxjs/toolkit';
import { processBookingCreate, processBookingPassengers, fetchBookingPassengers, saveBookingPassenger, fetchBookingDetails } from '../actions/bookingProcess';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	current: null,
	isLoading: false,
	errors: null,
};

const bookingProcessSlice = createSlice({
	name: 'bookingProcess',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
                        .addCase(processBookingCreate.pending, handlePending)
                        .addCase(processBookingCreate.rejected, handleRejected)
                        .addCase(processBookingCreate.fulfilled, (state, action) => {
                                state.current = action.payload;
                                state.isLoading = false;
                        })
                        .addCase(processBookingPassengers.pending, handlePending)
                        .addCase(processBookingPassengers.rejected, handleRejected)
                        .addCase(processBookingPassengers.fulfilled, (state, action) => {
                                const { buyer } = action.meta.arg || {};
                                state.current = { ...state.current, buyer };
                                state.isLoading = false;
                        })
                        .addCase(fetchBookingPassengers.pending, handlePending)
                        .addCase(fetchBookingPassengers.rejected, handleRejected)
                        .addCase(fetchBookingPassengers.fulfilled, (state, action) => {
                                state.current = { ...state.current, passengers: action.payload };
                                state.isLoading = false;
                        })
                        .addCase(fetchBookingDetails.pending, handlePending)
                        .addCase(fetchBookingDetails.rejected, handleRejected)
                        .addCase(fetchBookingDetails.fulfilled, (state, action) => {
                                state.current = { ...state.current, ...action.payload };
                                state.isLoading = false;
                        })
                        .addCase(saveBookingPassenger.pending, handlePending)
                        .addCase(saveBookingPassenger.rejected, handleRejected)
                        .addCase(saveBookingPassenger.fulfilled, (state, action) => {
                                const p = action.payload;
                                if (state.current) {
                                        const list = state.current.passengers || [];
                                        const idx = list.findIndex((x) => x.id === p.id);
                                        if (idx >= 0) list[idx] = p; else list.push(p);
                                        state.current.passengers = list;
                                }
                                state.isLoading = false;
                        });
        },
});

export default bookingProcessSlice.reducer;
