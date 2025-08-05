import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchAircrafts,
	fetchOne: fetchAircraft,
	create: createAircraft,
	update: updateAircraft,
	remove: deleteAircraft,
	removeAll: deleteAllAircrafts,
} = createCrudActions('aircrafts');
