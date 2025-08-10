import { createSlice } from '@reduxjs/toolkit';
import {
	processBookingCreate,
	processBookingPassengers,
	fetchBookingPassengers,
	fetchBookingDetails,
	fetchBookingAccess,
	fetchBookingDirectionsInfo,
} from '../actions/bookingProcess';
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
				const { passengers, passengers_exist } = action.payload;
				state.current = {
					...state.current,
					passengers,
					passengersExist: passengers_exist,
				};
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
			.addCase(fetchBookingDirectionsInfo.pending, handlePending)
			.addCase(fetchBookingDirectionsInfo.rejected, handleRejected)
			.addCase(fetchBookingDirectionsInfo.fulfilled, (state, action) => {
				state.current = { ...(state.current || {}), directionsInfo: action.payload };
				state.isLoading = false;
			});
	},
});

export default bookingProcessSlice.reducer;
