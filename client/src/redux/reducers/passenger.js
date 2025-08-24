import { createSlice } from '@reduxjs/toolkit';

import {
	fetchPassengers,
	fetchPassenger,
	createPassenger,
	updatePassenger,
	deletePassenger,
	fetchUserPassengers,
	createUserPassenger,
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
			.addCase(createUserPassenger.rejected, handleRejected);
	},
});

export default passengerSlice.reducer;
