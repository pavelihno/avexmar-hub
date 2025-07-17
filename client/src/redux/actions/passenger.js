import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchPassengers,
	fetchOne: fetchPassenger,
	create: createPassenger,
	update: updatePassenger,
	remove: deletePassenger,
	removeAll: deleteAllPassengers,
} = createCrudActions('passengers');
