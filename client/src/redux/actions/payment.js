import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData, createCrudActions } from '../utils';

export const fetchPayment = createAsyncThunk('payment/fetch', async (publicId, { rejectWithValue }) => {
	try {
		const res = await serverApi.get(`/booking/payment/${publicId}/details`);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const {
	fetchAll: fetchPayments,
	fetchOne: fetchPaymentById,
	create: createPayment,
	update: updatePayment,
	remove: deletePayment,
	removeAll: deleteAllPayments,
} = createCrudActions('payments');
