import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchAirlines,
	fetchOne: fetchAirline,
	create: createAirline,
	update: updateAirline,
	remove: deleteAirline,
	removeAll: deleteAllAirlines,
} = createCrudActions('airlines');
