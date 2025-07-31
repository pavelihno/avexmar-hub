import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchTimezones,
	fetchOne: fetchTimezone,
	create: createTimezone,
	update: updateTimezone,
	remove: deleteTimezone,
	removeAll: deleteAllTimezones,
} = createCrudActions('timezones');
