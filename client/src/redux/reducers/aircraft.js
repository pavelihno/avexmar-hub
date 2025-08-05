import { createSlice } from '@reduxjs/toolkit';
import { fetchAircrafts, fetchAircraft, createAircraft, updateAircraft, deleteAircraft } from '../actions/aircraft';
import { addCrudCases } from '../utils';

const initialState = {
	aircrafts: [],
	aircraft: null,
	isLoading: false,
	errors: null,
};

const aircraftSlice = createSlice({
	name: 'aircrafts',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchAircrafts,
				fetchOne: fetchAircraft,
				create: createAircraft,
				update: updateAircraft,
				remove: deleteAircraft,
			},
			'aircrafts',
			'aircraft'
		);
	},
});

export default aircraftSlice.reducer;
