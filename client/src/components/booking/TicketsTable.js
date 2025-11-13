import React from 'react';
import {
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	TableContainer,
	Box,
	Typography,
	Paper,
	Link,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UI_LABELS, ENUM_LABELS } from '../../constants';

const TicketsTable = ({ flights = [] }) => {
	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));

	if (!Array.isArray(flights) || flights.length === 0) {
		return (
			<Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
				{UI_LABELS.BOOKING.confirmation.tickets_empty}
			</Typography>
		);
	}

	const getRouteLabel = (route) => {
		if (!route) return '—';
		if (route.label) return route.label;
		const origin =
			route.origin_airport?.city_name || route.origin_airport?.name || route.origin?.city || route.origin || null;
		const destination =
			route.destination_airport?.city_name ||
			route.destination_airport?.name ||
			route.destination?.city ||
			route.destination ||
			null;

		const parts = [origin, destination].filter(Boolean);
		return parts.length ? parts.join(' — ') : '—';
	};

	const buildFlightTicketHeader = (flight) => {
		if (!flight) return '—';
		const flightNumber = flight.airline_flight_number || flight.number || '—';
		const routeLabel = getRouteLabel(flight.route);
		return [routeLabel, flightNumber].filter(Boolean).join(' • ');
	};

	const renderTicketsForFlight = (flight) => {
		const tickets = flight.tickets || [];

		if (tickets.length === 0) {
			return (
				<TableRow>
					<TableCell colSpan={4} align='center'>
						<Typography variant='body2' color='text.secondary'>
							{UI_LABELS.BOOKING.confirmation.tickets_empty}
						</Typography>
					</TableCell>
				</TableRow>
			);
		}

		const ticketsData = tickets.map((ticket, idx) => {
			const passenger = ticket?.passenger || {};
			const fullName = [passenger.last_name, passenger.first_name, passenger.patronymic_name]
				.filter(Boolean)
				.join(' ');
			const documentTypeLabel = passenger.document_type
				? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
				: null;
			const documentLabel = [documentTypeLabel, passenger.document_number].filter(Boolean).join(' · ');

			return {
				key: ticket.id ?? idx,
				ticketNumber: ticket?.ticket_number || '—',
				passenger: fullName || '—',
				document: documentLabel || '—',
			};
		});

		return ticketsData.map((data) => (
			<TableRow key={data.key}>
				<TableCell>{data.ticketNumber}</TableCell>
				<TableCell>{data.passenger}</TableCell>
				<TableCell>{data.document}</TableCell>
				<TableCell>
					<Link
						component='button'
						variant='body2'
						onClick={() => {
							// TODO: Implement refund functionality
							console.log('Refund ticket:', data.ticketNumber);
						}}
						sx={{ cursor: 'pointer' }}
					>
						{UI_LABELS.BOOKING.confirmation.ticket_columns.refund}
					</Link>
				</TableCell>
			</TableRow>
		));
	};

	// Mobile card view
	if (isXs) {
		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
				{flights.map((flight, flightIdx) => {
					const tickets = flight.tickets || [];
					const flightKey = flight.id || flight.booking_flight_id || flightIdx;
					const flightHeader = buildFlightTicketHeader(flight);

					if (tickets.length === 0) {
						return (
							<Paper key={flightKey} variant='outlined' sx={{ p: 1.5 }}>
								<Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
									{flightHeader}
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									{UI_LABELS.BOOKING.confirmation.tickets_empty}
								</Typography>
							</Paper>
						);
					}

					return (
						<Box key={flightKey} sx={{ mb: 1 }}>
							{/* Flight header */}
							<Typography
								variant='subtitle1'
								sx={{
									fontWeight: 700,
									mb: 1,
									color: 'text.secondary',
									textDecoration: 'underline',
								}}
							>
								{flightHeader}
							</Typography>

							{/* Tickets cards */}
							{tickets.map((ticket, idx) => {
								const passenger = ticket?.passenger || {};
								const fullName = [passenger.last_name, passenger.first_name, passenger.patronymic_name]
									.filter(Boolean)
									.join(' ');
								const documentTypeLabel = passenger.document_type
									? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
									: null;
								const documentLabel = [documentTypeLabel, passenger.document_number]
									.filter(Boolean)
									.join(' · ');

								return (
									<Paper key={ticket.id ?? idx} variant='outlined' sx={{ p: 1.5, mb: 1 }}>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 1,
												mb: 0.5,
												flexWrap: 'wrap',
											}}
										>
											<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
												{ticket?.ticket_number || '—'}
											</Typography>
											<Link
												component='button'
												variant='body2'
												onClick={() => {
													// TODO: Implement refund functionality
													console.log('Refund ticket:', ticket?.ticket_number);
												}}
												sx={{ cursor: 'pointer' }}
											>
												{UI_LABELS.BOOKING.confirmation.ticket_columns.refund}
											</Link>
										</Box>

										<Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.25 }}>
											{fullName || '—'}
										</Typography>

										{documentLabel && (
											<Typography
												variant='caption'
												sx={{ color: 'text.secondary', display: 'block' }}
											>
												{documentLabel}
											</Typography>
										)}
									</Paper>
								);
							})}
						</Box>
					);
				})}
			</Box>
		);
	}

	// Desktop table view
	return (
		<TableContainer sx={{ overflowX: 'auto', mb: 2 }}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.ticket_number}</TableCell>
						<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.passenger}</TableCell>
						<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.document}</TableCell>
						<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.refund}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{flights.map((flight, flightIdx) => {
						const tickets = flight.tickets || [];
						const flightKey = flight.id || flight.booking_flight_id || flightIdx;
						const flightHeader = buildFlightTicketHeader(flight);

						return (
							<React.Fragment key={flightKey}>
								{/* Flight header row */}
								<TableRow>
									<TableCell
										colSpan={4}
										sx={{
											py: 1,
											backgroundColor: 'grey.50',
											fontWeight: 500,
											borderBottom: '1px solid',
											borderColor: 'divider',
										}}
									>
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{
												fontWeight: 500,
												textDecoration: 'underline',
											}}
										>
											{flightHeader}
										</Typography>
									</TableCell>
								</TableRow>
								{/* Tickets rows */}
								{renderTicketsForFlight(flight)}
							</React.Fragment>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default TicketsTable;
