import { createSlice } from '@reduxjs/toolkit';
import {
	fetchConsentDocs,
	fetchConsentDoc,
	createConsentDoc,
	updateConsentDoc,
	deleteConsentDoc,
	fetchLatestConsentDoc,
} from '../actions/consentDoc';
import { addCrudCases, handlePending, handleRejected } from '../utils';

const initialState = {
	consentDocs: [],
	consentDoc: null,
	isLoading: false,
	errors: null,
};

const consentDocSlice = createSlice({
	name: 'consentDocs',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchConsentDocs,
				fetchOne: fetchConsentDoc,
				create: createConsentDoc,
				update: updateConsentDoc,
				remove: deleteConsentDoc,
			},
			'consentDocs',
			'consentDoc'
		);
		builder
			.addCase(fetchLatestConsentDoc.pending, handlePending)
			.addCase(fetchLatestConsentDoc.fulfilled, (state, action) => {
				state.consentDoc = action.payload;
				state.isLoading = false;
			})
			.addCase(fetchLatestConsentDoc.rejected, handleRejected);
	},
});

export default consentDocSlice.reducer;
