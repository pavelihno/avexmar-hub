import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchAirports,
	fetchOne: fetchAirport,
	create: createAirport,
	update: updateAirport,
	remove: deleteAirport,
	removeAll: deleteAllAirports,
} = createCrudActions('airports');
