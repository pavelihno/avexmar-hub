import { createSlice } from '@reduxjs/toolkit';
import {
	fetchAirlines,
	fetchAirline,
	createAirline,
	updateAirline,
	deleteAirline,
} from '../actions/airline';
import { addCrudCases } from '../utils';

const initialState = {
	airlines: [],
	airline: null,
	isLoading: false,
	errors: null,
};

const airlineSlice = createSlice({
	name: 'airlines',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchAirlines,
				fetchOne: fetchAirline,
				create: createAirline,
				update: updateAirline,
				remove: deleteAirline,
			},
			'airlines',
			'airline'
		);
	},
});

export default airlineSlice.reducer;
