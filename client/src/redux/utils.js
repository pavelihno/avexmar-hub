import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverApi } from '../api';

export const getErrorData = (error) => {
	if (error.response?.data) {
		return error.response.data;
	}

	return { message: error.message || 'An unknown error occurred' };
};

export const handlePending = (state) => {
	state.isLoading = true;
	state.errors = null;
};

export const handleRejected = (state, action) => {
	state.errors = action.payload;
	state.isLoading = false;
};

// Standard CRUD action creators
export const createCrudActions = (endpoint) => {
	// Fetch all
	const fetchAll = createAsyncThunk(`${endpoint}/getAll`, async (_, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/${endpoint}`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	});

	// Fetch one
	const fetchOne = createAsyncThunk(`${endpoint}/get`, async (id, { rejectWithValue }) => {
		try {
			const res = await serverApi.get(`/${endpoint}/${id}`);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	});

	// Create
	const create = createAsyncThunk(`${endpoint}/create`, async (data, { rejectWithValue }) => {
		try {
			const res = await serverApi.post(`/${endpoint}`, data);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	});

	// Update
	const update = createAsyncThunk(`${endpoint}/update`, async (data, { rejectWithValue }) => {
		try {
			const res = await serverApi.put(`/${endpoint}/${data.id}`, data);
			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	});

	// Delete
	const remove = createAsyncThunk(`${endpoint}/delete`, async (id, { rejectWithValue }) => {
		try {
			const res = await serverApi.delete(`/${endpoint}/${id}`);
			return { id, data: res.data };
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	});

	return {
		fetchAll,
		fetchOne,
		create,
		update,
		remove,
	};
};

// Add standard CRUD cases to a reducer
export const addCrudCases = (builder, actions, pluralKey, singleKey) => {
	const { fetchAll, fetchOne, create, update, remove } = actions;

	// Fetch all
	builder
		.addCase(fetchAll.pending, handlePending)
		.addCase(fetchAll.fulfilled, (state, action) => {
			state[pluralKey] = action.payload;
			state.isLoading = false;
		})
		.addCase(fetchAll.rejected, handleRejected);

	// Fetch one
	builder
		.addCase(fetchOne.pending, handlePending)
		.addCase(fetchOne.fulfilled, (state, action) => {
			state[singleKey] = action.payload;
			state.isLoading = false;
		})
		.addCase(fetchOne.rejected, handleRejected);

	// Create
	builder
		.addCase(create.pending, handlePending)
		.addCase(create.fulfilled, (state, action) => {
			state[pluralKey].push(action.payload);
			state.isLoading = false;
		})
		.addCase(create.rejected, handleRejected);

	// Update
	builder
		.addCase(update.pending, handlePending)
		.addCase(update.fulfilled, (state, action) => {
			state[pluralKey] = state[pluralKey].map((item) => (item.id === action.payload.id ? action.payload : item));
			state.isLoading = false;
		})
		.addCase(update.rejected, handleRejected);

	// Delete
	builder
		.addCase(remove.pending, handlePending)
		.addCase(remove.fulfilled, (state, action) => {
			const idToRemove = typeof action.payload === 'object' ? action.payload.id : action.payload;
			state[pluralKey] = state[pluralKey].filter((item) => item.id !== idToRemove);
			state.isLoading = false;
		})
		.addCase(remove.rejected, handleRejected);
};

export const fullWidthStyle = { width: '100%' };
