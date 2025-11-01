import { createSlice } from '@reduxjs/toolkit';

import { fetchBookingDashboard } from '../actions/bookingDashboard';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	data: {
		items: [],
		summary: { total: 0, status_counts: {}, issue_counts: {} },
		filters: { routes: [], flights: [] },
	},
	isLoading: false,
	errors: null,
};

const bookingDashboardSlice = createSlice({
	name: 'bookingDashboard',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBookingDashboard.pending, handlePending)
			.addCase(fetchBookingDashboard.fulfilled, (state, action) => {
				state.data = action.payload || initialState.data;
				state.isLoading = false;
			})
			.addCase(fetchBookingDashboard.rejected, handleRejected);
	},
});

export default bookingDashboardSlice.reducer;
