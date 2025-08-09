import { createSlice } from '@reduxjs/toolkit';
import { processBookingCreate, processBookingPassengers } from '../actions/bookingProcess';
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
                                const { passengers, buyer } = action.meta.arg || {};
                                state.current = { ...state.current, passengers, buyer };
                                state.isLoading = false;
                        });
        },
});

export default bookingProcessSlice.reducer;
