import { createCrudActions } from '../utils';

const {
	fetchAll: fetchTickets,
	fetchOne: fetchTicket,
	create: createTicket,
	update: updateTicket,
	remove: deleteTicket,
} = createCrudActions('tickets');

export { fetchTickets, fetchTicket, createTicket, updateTicket, deleteTicket };
