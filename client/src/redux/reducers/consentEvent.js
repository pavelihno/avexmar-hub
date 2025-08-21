import { createSlice } from '@reduxjs/toolkit';
import {
	fetchConsentEvents,
	fetchConsentEvent,
	createConsentEvent,
	updateConsentEvent,
	deleteConsentEvent,
} from '../actions/consentEvent';
import { addCrudCases } from '../utils';

const initialState = {
	consentEvents: [],
	consentEvent: null,
	isLoading: false,
	errors: null,
};

const consentEventSlice = createSlice({
	name: 'consentEvents',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchConsentEvents,
				fetchOne: fetchConsentEvent,
				create: createConsentEvent,
				update: updateConsentEvent,
				remove: deleteConsentEvent,
			},
			'consentEvents',
			'consentEvent'
		);
	},
});

export default consentEventSlice.reducer;
