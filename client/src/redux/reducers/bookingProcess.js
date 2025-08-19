import { createSlice } from '@reduxjs/toolkit';
import {
	processBookingCreate,
	processBookingPassengers,
	fetchBookingDetails,
	fetchBookingAccess,
	confirmBooking,
} from '../actions/bookingProcess';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	current: null,
	completion: null,
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
			.addCase(fetchBookingDetails.pending, handlePending)
			.addCase(fetchBookingDetails.rejected, handleRejected)
			.addCase(fetchBookingDetails.fulfilled, (state, action) => {
				const { passengers_exist, passengers, ...rest } = action.payload;
				state.current = {
					...state.current,
					...rest,
					passengers,
					passengersExist: passengers_exist,
				};
				state.isLoading = false;
			})
			.addCase(fetchBookingAccess.pending, handlePending)
			.addCase(fetchBookingAccess.rejected, handleRejected)
			.addCase(fetchBookingAccess.fulfilled, (state, action) => {
				state.current = { ...(state.current || {}), accessiblePages: action.payload.pages || [] };
				state.isLoading = false;
			})
			.addCase(confirmBooking.pending, handlePending)
			.addCase(confirmBooking.rejected, handleRejected)
			.addCase(confirmBooking.fulfilled, (state) => {
				state.isLoading = false;
			});
	},
});

export default bookingProcessSlice.reducer;
