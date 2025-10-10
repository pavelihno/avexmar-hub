import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchDiscounts,
	fetchOne: fetchDiscount,
	create: createDiscount,
	update: updateDiscount,
	remove: deleteDiscount,
	removeAll: deleteAllDiscounts,
	removeFiltered: deleteFilteredDiscounts,
} = createCrudActions('discounts');
