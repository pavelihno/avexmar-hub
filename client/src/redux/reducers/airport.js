import { createSlice } from '@reduxjs/toolkit';
import {
	fetchAirports,
	fetchAirport,
	createAirport,
	updateAirport,
	deleteAirport,
} from '../actions/airport';
import { addCrudCases } from '../utils';

const initialState = {
	airports: [],
	airport: null,
	isLoading: false,
	errors: null,
};

const airportSlice = createSlice({
	name: 'airports',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchAirports,
				fetchOne: fetchAirport,
				create: createAirport,
				update: updateAirport,
				remove: deleteAirport,
			},
			'airports',
			'airport'
		);
	},
});

export default airportSlice.reducer;
