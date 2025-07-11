import { createCrudActions } from '../utils';

const {
	fetchAll: fetchDiscounts,
	fetchOne: fetchDiscount,
	create: createDiscount,
	update: updateDiscount,
	remove: deleteDiscount,
} = createCrudActions('discounts');

export {
	fetchDiscounts,
	fetchDiscount,
	createDiscount,
	updateDiscount,
	deleteDiscount,
};
