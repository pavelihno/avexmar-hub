import { createCrudActions } from '../utils';

const {
	fetchAll: fetchPassengers,
	fetchOne: fetchPassenger,
	create: createPassenger,
	update: updatePassenger,
	remove: deletePassenger,
} = createCrudActions('passengers');

export {
	fetchPassengers,
	fetchPassenger,
	createPassenger,
	updatePassenger,
	deletePassenger,
};
