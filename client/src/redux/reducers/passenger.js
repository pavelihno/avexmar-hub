import { createSlice } from '@reduxjs/toolkit';

import {
	fetchPassengers,
	fetchPassenger,
	createPassenger,
	updatePassenger,
	deletePassenger,
	fetchUserPassengers,
	createUserPassenger,
	updateUserPassenger,
	deleteUserPassenger,
} from '../actions/passenger';
import { addCrudCases, handlePending, handleRejected } from '../utils';

const initialState = {
	passengers: [],
	passenger: null,
	isLoading: false,
	errors: null,
};

const passengerSlice = createSlice({
	name: 'passengers',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchPassengers,
				fetchOne: fetchPassenger,
				create: createPassenger,
				update: updatePassenger,
				remove: deletePassenger,
			},
			'passengers',
			'passenger'
		);

		builder
			.addCase(fetchUserPassengers.pending, handlePending)
			.addCase(fetchUserPassengers.fulfilled, (state, action) => {
				state.passengers = action.payload;
				state.isLoading = false;
			})
			.addCase(fetchUserPassengers.rejected, handleRejected)
			.addCase(createUserPassenger.pending, handlePending)
			.addCase(createUserPassenger.fulfilled, (state, action) => {
				state.passengers.push(action.payload);
				state.isLoading = false;
			})
			.addCase(createUserPassenger.rejected, handleRejected)
			.addCase(updateUserPassenger.pending, handlePending)
			.addCase(updateUserPassenger.fulfilled, (state, action) => {
				state.passengers = state.passengers.map((p) => (p.id === action.payload.id ? action.payload : p));
				state.isLoading = false;
			})
			.addCase(updateUserPassenger.rejected, handleRejected)
			.addCase(deleteUserPassenger.pending, handlePending)
			.addCase(deleteUserPassenger.fulfilled, (state, action) => {
				const id = action.payload?.id;
				state.passengers = state.passengers.filter((p) => p.id !== id);
				state.isLoading = false;
			})
			.addCase(deleteUserPassenger.rejected, handleRejected);
	},
});

export default passengerSlice.reducer;
