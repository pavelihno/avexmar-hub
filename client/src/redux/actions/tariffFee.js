import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchTariffFees,
	fetchOne: fetchTariffFee,
	create: createTariffFee,
	update: updateTariffFee,
	remove: deleteTariffFee,
	removeAll: deleteAllTariffFees,
	removeFiltered: deleteFilteredTariffFees,
} = createCrudActions('tariff_fees');
