import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchFlightTariffs,
	fetchOne: fetchFlightTariff,
	create: createFlightTariff,
	update: updateFlightTariff,
	remove: deleteFlightTariff,
	removeAll: deleteAllFlightTariffs,
} = createCrudActions('flight_tariffs');
