import { createCrudActions } from '../utils';

const {
	fetchAll: fetchRoutes,
	fetchOne: fetchRoute,
	create: createRoute,
	update: updateRoute,
	remove: deleteRoute,
} = createCrudActions('routes');

export { fetchRoutes, fetchRoute, createRoute, updateRoute, deleteRoute };
