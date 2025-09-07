import { createSlice } from '@reduxjs/toolkit';

import {
	fetchTickets,
	fetchTicket,
	createTicket,
	updateTicket,
	deleteTicket,
} from '../actions/ticket';
import { addCrudCases } from '../utils';

const initialState = {
	tickets: [],
	ticket: null,
	isLoading: false,
	errors: null,
};

const ticketSlice = createSlice({
	name: 'tickets',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchTickets,
				fetchOne: fetchTicket,
				create: createTicket,
				update: updateTicket,
				remove: deleteTicket,
			},
			'tickets',
			'ticket'
		);
	},
});

export default ticketSlice.reducer;
