import { createSlice } from '@reduxjs/toolkit';

import {
	fetchFlightTariffs,
	fetchFlightTariff,
	createFlightTariff,
	updateFlightTariff,
	deleteFlightTariff,
} from '../actions/flight_tariff';
import { addCrudCases } from '../utils';

const initialState = {
	flightTariffs: [],
	flightTariff: null,
	isLoading: false,
	errors: null,
};

const flightTariffSlice = createSlice({
	name: 'flightTariffs',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchFlightTariffs,
				fetchOne: fetchFlightTariff,
				create: createFlightTariff,
				update: updateFlightTariff,
				remove: deleteFlightTariff,
			},
			'flightTariffs',
			'flightTariff'
		);
	},
});

export default flightTariffSlice.reducer;
