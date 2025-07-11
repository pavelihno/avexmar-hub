import { createCrudActions } from '../utils';

const {
	fetchAll: fetchFlights,
	fetchOne: fetchFlight,
	create: createFlight,
	update: updateFlight,
	remove: deleteFlight,
} = createCrudActions('flights');

export { fetchFlights, fetchFlight, createFlight, updateFlight, deleteFlight };
