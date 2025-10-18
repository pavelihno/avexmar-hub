import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../../api';
import { getErrorData, createCrudActions } from '../utils';

const buildAccessParams = (accessToken) => (accessToken ? { params: { access_token: accessToken } } : {});

export const fetchPayment = createAsyncThunk('payment/fetch', async (arg, { rejectWithValue }) => {
	try {
		const { publicId, accessToken } = typeof arg === 'string' ? { publicId: arg } : arg || {};
		const res = await serverApi.get(`/booking/payment/${publicId}/details`, buildAccessParams(accessToken));
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
	removeFiltered: deleteFilteredPayments,
} = createCrudActions('payments');
