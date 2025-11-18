import { createSlice } from '@reduxjs/toolkit';

import {
	fetchTariffFees,
	fetchTariffFee,
	createTariffFee,
	updateTariffFee,
	deleteTariffFee,
} from '../actions/tariffFee';
import { addCrudCases } from '../utils';

const initialState = {
	tariffFees: [],
	tariffFee: null,
	isLoading: false,
	errors: null,
};

const tariffFeeSlice = createSlice({
	name: 'tariffFees',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchTariffFees,
				fetchOne: fetchTariffFee,
				create: createTariffFee,
				update: updateTariffFee,
				remove: deleteTariffFee,
			},
			'tariffFees',
			'tariffFee'
		);
	},
});

export default tariffFeeSlice.reducer;
