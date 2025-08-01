import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchRoutes,
	fetchOne: fetchRoute,
	create: createRoute,
	update: updateRoute,
	remove: deleteRoute,
	removeAll: deleteAllRoutes,
} = createCrudActions('routes');
