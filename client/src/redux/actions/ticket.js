import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchTickets,
	fetchOne: fetchTicket,
	create: createTicket,
	update: updateTicket,
	remove: deleteTicket,
	removeAll: deleteAllTickets,
} = createCrudActions('tickets');
