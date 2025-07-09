import { createSlice } from '@reduxjs/toolkit';
import {
	fetchRoutes,
	createRoute,
	updateRoute,
	deleteRoute,
} from '../actions/route';

const initialState = {
	routes: [],
	isLoading: false,
	errors: null,
};

const routeSlice = createSlice({
	name: 'routes',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			// Fetch routes
			.addCase(fetchRoutes.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
			})
			.addCase(fetchRoutes.fulfilled, (state, action) => {
				state.routes = action.payload;
				state.isLoading = false;
			})
			.addCase(fetchRoutes.rejected, (state, action) => {
				state.isLoading = false;
				state.errors = action.payload;
			})

			// Create route
			.addCase(createRoute.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
			})
			.addCase(createRoute.fulfilled, (state, action) => {
				state.routes.push(action.payload);
				state.isLoading = false;
			})
			.addCase(createRoute.rejected, (state, action) => {
				state.isLoading = false;
				state.errors = action.payload;
			})

			// Update route
			.addCase(updateRoute.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
			})
			.addCase(updateRoute.fulfilled, (state, action) => {
				const index = state.routes.findIndex(
					(route) => route.id === action.payload.id
				);
				if (index !== -1) {
					state.routes[index] = action.payload;
				}
				state.isLoading = false;
			})
			.addCase(updateRoute.rejected, (state, action) => {
				state.isLoading = false;
				state.errors = action.payload;
			})

			// Delete route
			.addCase(deleteRoute.pending, (state) => {
				state.isLoading = true;
				state.errors = null;
			})
			.addCase(deleteRoute.fulfilled, (state, action) => {
				state.routes = state.routes.filter(
					(route) => route.id !== action.payload
				);
				state.isLoading = false;
			})
			.addCase(deleteRoute.rejected, (state, action) => {
				state.isLoading = false;
				state.errors = action.payload;
			});
	},
});

export default routeSlice.reducer;
