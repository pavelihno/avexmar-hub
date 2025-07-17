import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchFlights,
	fetchOne: fetchFlight,
	create: createFlight,
	update: updateFlight,
	remove: deleteFlight,
	removeAll: deleteAllFlights,
} = createCrudActions('flights');
