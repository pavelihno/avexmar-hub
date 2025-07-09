import { createSlice } from '@reduxjs/toolkit';

import {
	fetchDiscounts,
	fetchDiscount,
	createDiscount,
	updateDiscount,
	deleteDiscount,
} from '../actions/discount';
import { addCrudCases } from '../utils';

const initialState = {
	discounts: [],
	discount: null,
	isLoading: false,
	errors: null,
};

const discountSlice = createSlice({
	name: 'discounts',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchDiscounts,
				fetchOne: fetchDiscount,
				create: createDiscount,
				update: updateDiscount,
				remove: deleteDiscount,
			},
			'discounts',
			'discount'
		);
	},
});

export default discountSlice.reducer;
