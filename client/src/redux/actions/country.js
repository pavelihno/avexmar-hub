import { createCrudActions } from '../utils';

const {
	fetchAll: fetchCountries,
	fetchOne: fetchCountry,
	create: createCountry,
	update: updateCountry,
	remove: deleteCountry,
} = createCrudActions('countries');

export {
	fetchCountries,
	fetchCountry,
	createCountry,
	updateCountry,
	deleteCountry,
};
