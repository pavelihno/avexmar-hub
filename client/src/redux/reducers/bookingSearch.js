import { createSlice } from '@reduxjs/toolkit';
import { searchBooking } from '../actions/bookingSearch';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	result: null,
	isLoading: false,
	errors: null,
};

const bookingSearchSlice = createSlice({
	name: 'bookingSearch',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(searchBooking.pending, (state) =>
				handlePending(state, { isLoading: 'isLoading', errors: 'errors' })
			)
			.addCase(searchBooking.rejected, (state, action) =>
				handleRejected(state, action, { isLoading: 'isLoading', errors: 'errors' })
			)
			.addCase(searchBooking.fulfilled, (state, action) => {
				state.result = action.payload;
				state.isLoading = false;
			});
	},
});

export default bookingSearchSlice.reducer;
