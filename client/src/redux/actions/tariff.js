import { createCrudActions } from '../utils';

const {
	fetchAll: fetchTariffs,
	fetchOne: fetchTariff,
	create: createTariff,
	update: updateTariff,
	remove: deleteTariff,
} = createCrudActions('tariffs');

export { fetchTariffs, fetchTariff, createTariff, updateTariff, deleteTariff };
