import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchFees,
	fetchOne: fetchFee,
	create: createFee,
	update: updateFee,
	remove: deleteFee,
	removeAll: deleteAllFees,
} = createCrudActions('fees');
