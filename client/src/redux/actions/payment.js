import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData, createCrudActions } from '../utils';

export const createPayment = createAsyncThunk('payment/create', async (data, { rejectWithValue }) => {
	try {
		const res = await serverApi.post('/booking/payment', data);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

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
	create: createPaymentAdmin,
	update: updatePayment,
	remove: deletePayment,
	removeAll: deleteAllPayments,
} = createCrudActions('payments');
