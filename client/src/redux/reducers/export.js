import { createSlice } from '@reduxjs/toolkit';
import { fetchExportData, downloadExport } from '../actions/export';
import { handlePending, handleRejected } from '../utils';

const initialState = {
	data: {},
	isLoading: false,
	errors: null,
};

const exportSlice = createSlice({
	name: 'exports',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchExportData.pending, handlePending)
			.addCase(fetchExportData.fulfilled, (state, action) => {
				const { key, data } = action.payload;
				state.data[key] = data;
				state.isLoading = false;
			})
			.addCase(fetchExportData.rejected, handleRejected)
			.addCase(downloadExport.pending, handlePending)
			.addCase(downloadExport.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(downloadExport.rejected, handleRejected);
	},
});

export default exportSlice.reducer;
