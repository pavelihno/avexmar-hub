import { createSlice } from '@reduxjs/toolkit';

import {
	fetchTariffs,
	fetchTariff,
	createTariff,
	updateTariff,
	deleteTariff,
} from '../actions/tariff';
import { addCrudCases } from '../utils';

const initialState = {
	tariffs: [],
	tariff: null,
	isLoading: false,
	errors: null,
};

const tariffSlice = createSlice({
	name: 'tariffs',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchTariffs,
				fetchOne: fetchTariff,
				create: createTariff,
				update: updateTariff,
				remove: deleteTariff,
			},
			'tariffs',
			'tariff'
		);
	},
});

export default tariffSlice.reducer;
