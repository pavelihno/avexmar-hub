import { createSlice } from '@reduxjs/toolkit';

import {
	fetchPassengers,
	fetchPassenger,
	createPassenger,
	updatePassenger,
	deletePassenger,
} from '../actions/passenger';
import { addCrudCases } from '../utils';

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
	},
});

export default passengerSlice.reducer;
