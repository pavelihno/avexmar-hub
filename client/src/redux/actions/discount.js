import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchDiscounts,
	fetchOne: fetchDiscount,
	create: createDiscount,
	update: updateDiscount,
	remove: deleteDiscount,
	removeAll: deleteAllDiscounts,
} = createCrudActions('discounts');
