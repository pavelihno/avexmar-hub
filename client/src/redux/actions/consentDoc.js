import { createAsyncThunk } from '@reduxjs/toolkit';
import { createCrudActions, getErrorData } from '../utils';
import { serverApi } from '../../api';

export const fetchLatestConsentDoc = createAsyncThunk('consentDocs/fetchLatest', async (type, { rejectWithValue }) => {
	try {
		const res = await serverApi.get(`/consent_docs/latest/${type}`);
		return res.data;
	} catch (err) {
		return rejectWithValue(getErrorData(err));
	}
});

export const {
	fetchAll: fetchConsentDocs,
	fetchOne: fetchConsentDoc,
	create: createConsentDoc,
	update: updateConsentDoc,
	remove: deleteConsentDoc,
	removeAll: deleteAllConsentDocs,
	removeFiltered: deleteFilteredConsentDocs,
} = createCrudActions('consent_docs');
