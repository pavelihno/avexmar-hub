import { createSlice } from '@reduxjs/toolkit';

import {
	fetchRoutes,
	fetchRoute,
	createRoute,
	updateRoute,
	deleteRoute,
} from '../actions/route';
import { addCrudCases } from '../utils';

const initialState = {
	routes: [],
	route: null,
	isLoading: false,
	errors: null,
};

const routeSlice = createSlice({
	name: 'routes',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchRoutes,
				fetchOne: fetchRoute,
				create: createRoute,
				update: updateRoute,
				remove: deleteRoute,
			},
			'routes',
			'route'
		);
	},
});

export default routeSlice.reducer;
