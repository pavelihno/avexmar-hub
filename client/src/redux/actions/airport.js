import { createCrudActions } from '../utils';

const {
	fetchAll: fetchAirports,
	fetchOne: fetchAirport,
	create: createAirport,
	update: updateAirport,
	remove: deleteAirport,
} = createCrudActions('airports');

export {
	fetchAirports,
	fetchAirport,
	createAirport,
	updateAirport,
	deleteAirport,
};
