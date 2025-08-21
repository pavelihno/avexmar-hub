import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchConsentEvents,
	fetchOne: fetchConsentEvent,
	create: createConsentEvent,
	update: updateConsentEvent,
	remove: deleteConsentEvent,
	removeAll: deleteAllConsentEvents,
} = createCrudActions('consent_events');
