import { createSlice } from '@reduxjs/toolkit';
import {
	fetchPayment,
	fetchPayments,
	fetchPaymentById,
	createPayment,
	updatePayment,
	deletePayment,
} from '../actions/payment';
import { handlePending, handleRejected, addCrudCases } from '../utils';

const initialState = {
	payments: [],
	payment: null,
	current: null,
	isLoading: false,
	errors: null,
};

const paymentSlice = createSlice({
	name: 'payment',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchPayments,
				fetchOne: fetchPaymentById,
				create: createPayment,
				update: updatePayment,
				remove: deletePayment,
			},
			'payments',
			'payment'
		);

		builder
			.addCase(fetchPayment.pending, handlePending)
			.addCase(fetchPayment.rejected, handleRejected)
			.addCase(fetchPayment.fulfilled, (state, action) => {
				state.current = action.payload;
				state.isLoading = false;
			});
	},
});

export default paymentSlice.reducer;
