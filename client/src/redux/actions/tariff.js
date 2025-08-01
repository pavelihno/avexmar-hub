import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchTariffs,
	fetchOne: fetchTariff,
	create: createTariff,
	update: updateTariff,
	remove: deleteTariff,
	removeAll: deleteAllTariffs,
} = createCrudActions('tariffs');
