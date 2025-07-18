import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchCountries,
	fetchOne: fetchCountry,
	create: createCountry,
	update: updateCountry,
	remove: deleteCountry,
	removeAll: deleteAllCountries,
} = createCrudActions('countries');
