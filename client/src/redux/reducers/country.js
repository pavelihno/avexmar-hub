import { createSlice } from '@reduxjs/toolkit';
import {
	fetchCountries,
	fetchCountry,
	createCountry,
	updateCountry,
	deleteCountry,
} from '../actions/country';
import { addCrudCases } from '../utils';

const initialState = {
	countries: [],
	country: null,
	isLoading: false,
	errors: null,
};

const countrySlice = createSlice({
	name: 'countries',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchCountries,
				fetchOne: fetchCountry,
				create: createCountry,
				update: updateCountry,
				remove: deleteCountry,
			},
			'countries',
			'country'
		);
	},
});

export default countrySlice.reducer;
