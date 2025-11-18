import React from 'react';
import { Link } from 'react-router-dom';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Collapse,
	Divider,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { BUTTONS, ENUM_LABELS } from '../../../../constants';
import { formatDate, formatDateTime, formatNumber, formatTime } from '../../../utils';
import { getPassengerDocumentLabel, getPassengerFullName, getRouteLabel } from './bookingDashboardUtils';

const mapColumns = (source = {}) => {
	if (Array.isArray(source) && source.length > 0) {
		return source;
	}
	if (source && typeof source === 'object') {
		return Object.entries(source).map(([key, label]) => ({ key, label }));
	}
	return [];
};

const formatPriceDetails = (priceDetails = {}, pricingLabels = {}) => {
	if (!priceDetails) return '';
	const parts = [];
	if (priceDetails.fare_price != null) {
		parts.push(`${pricingLabels.fare}: ${formatNumber(priceDetails.fare_price)}`);
	}
	if (priceDetails.total_discounts) {
		parts.push(`${pricingLabels.discounts}: −${formatNumber(priceDetails.total_discounts)}`);
	}
	if (priceDetails.total_fees != null) {
		parts.push(`${pricingLabels.fees}: ${formatNumber(priceDetails.total_fees)}`);
	}
	return parts.join(' • ');
};

const formatCitizenshipLabel = (citizenship) => {
	if (!citizenship) return '—';
	if (typeof citizenship === 'string') {
		return citizenship.trim() || '—';
	}
	if (typeof citizenship === 'object') {
		const code = typeof citizenship.code_a3 === 'string' ? citizenship.code_a3.trim() : '';
		const name = typeof citizenship.name === 'string' ? citizenship.name.trim() : '';
		if (code) return code;
		if (name) return name;
	}
	return '—';
};

const mapFlightToRow = (flight) => {
	const seatClass = flight.tariff?.seat_class;
	const seatClassLabel = seatClass ? ENUM_LABELS.SEAT_CLASS[seatClass] || seatClass : '—';

	const departureLabel = `${formatDate(flight.scheduled_departure)} ${formatTime(flight.scheduled_departure_time)}`;

	const arrivalLabel = `${formatDate(flight.scheduled_arrival)} ${formatTime(flight.scheduled_arrival_time)}`;

	const airlineName = flight.airline?.name || flight.airline_name || flight.airline || '—';

	return {
		number: flight.airline_flight_number || flight.number || '—',
		route: getRouteLabel(flight.route),
		airline: airlineName,
		departure: departureLabel || '—',
		arrival: arrivalLabel || '—',
		class: seatClassLabel,
		tariff: flight.tariff?.title || '—',
	};
};

const mapPassengerToRow = (passenger) => {
	const fullName = getPassengerFullName(passenger);
	const categoryLabel = passenger.category
		? ENUM_LABELS.PASSENGER_CATEGORY[passenger.category] || passenger.category
		: '—';
	const documentTypeLabel = passenger.document_type
		? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
		: null;
	const documentExpiryLabel = passenger.document_expiry_date ? formatDate(passenger.document_expiry_date) : null;
	const documentParts = [documentTypeLabel, passenger.document_number, documentExpiryLabel].filter(Boolean);
	const documentLabel = documentParts.length > 0 ? documentParts.join(' · ') : '—';
	const birthDateLabel = passenger.birth_date ? formatDate(passenger.birth_date) : '—';
	const citizenshipLabel = formatCitizenshipLabel(passenger.citizenship);

	return {
		name: fullName || '—',
		category: categoryLabel,
		document: documentLabel,
		citizenship: citizenshipLabel,
		birthDate: birthDateLabel,
	};
};

const mapPaymentToRow = (payment) => {
	const status = payment.payment_status || payment.status;
	const type = payment.payment_type || payment.type;
	const method = payment.payment_method || payment.method;
	const statusLabel = ENUM_LABELS.PAYMENT_STATUS[status] || status || '—';
	const typeLabel = ENUM_LABELS.PAYMENT_TYPE?.[type] || type || '—';
	const methodLabel = ENUM_LABELS.PAYMENT_METHOD?.[method] || method || '—';
	const amountLabel =
		payment.amount != null
			? `${formatNumber(payment.amount)} ${
					ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || payment.currency || ''
			  }`
			: '—';
	const paidAt = payment.paid_at || payment.paidAt;
	const expiresAt = payment.expires_at || payment.expiresAt;
	const paidAtLabel = paidAt ? formatDateTime(paidAt) : '';
	const expiresAtLabel = expiresAt ? formatDateTime(expiresAt) : '';

	return {
		providerId: payment.provider_payment_id || '—',
		status: statusLabel,
		type: typeLabel,
		method: methodLabel,
		amount: amountLabel,
		paidAt: paidAtLabel || '—',
		expiresAt: expiresAtLabel || '—',
	};
};

const mapTicketToRow = (ticket) => {
	const passenger = ticket?.passenger || {};
	const fullName = getPassengerFullName(passenger);
	const documentLabel = getPassengerDocumentLabel(passenger);

	return {
		ticketNumber: ticket?.ticket_number || '—',
		passenger: fullName || '—',
		document: documentLabel || '—',
	};
};

const buildFlightTicketHeader = (flight) => {
	if (!flight) return '—';
	const flightNumber = flight.airline_flight_number || flight.number || '—';
	const routeLabel = getRouteLabel(flight.route);
	return [routeLabel, flightNumber].filter(Boolean).join(' • ');
};

const DataTable = ({ columns, data, mapDataToRow, emptyMessage }) => {
	const rows = data.map(mapDataToRow);

	return (
		<TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 0 }}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						{columns.map((col) => (
							<TableCell key={col.key} align={col.align || 'left'}>
								{col.label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.length === 0 ? (
						<TableRow>
							<TableCell colSpan={columns.length} align='center'>
								<Typography variant='body2' color='text.secondary'>
									{emptyMessage}
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						rows.map((row, idx) => (
							<TableRow key={idx}>
								{columns.map((col) => (
									<TableCell key={col.key} align={col.align || 'left'}>
										{row[col.key]}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

const BookingDashboardList = ({
	bookings,
	totalCount,
	emptyMessage,
	expandedBookings,
	onToggleBooking,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	labels,
	statusColors,
	issueColors,
	chipBaseSx,
	renderTicketAction,
	onDownloadBookingPdf,
	onDownloadItinerary,
}) => {
	const pricingLabels = labels.pricing || {};
	const placeholderLabels = labels.placeholders || {};
	const flightsColumns = mapColumns(labels.table?.flights);
	const passengersColumns = mapColumns(labels.table?.passengers);
	const paymentsColumns = mapColumns(labels.table?.payments);
	const ticketsColumns = mapColumns(labels.table?.tickets);

	return (
		<Stack spacing={3} sx={{ mt: 4 }}>
			{totalCount === 0 ? (
				<Paper
					elevation={0}
					sx={{
						p: 4,
						borderRadius: 3,
						border: (theme) => `1px dashed ${theme.palette.divider}`,
						textAlign: 'center',
					}}
				>
					<Typography variant='body1' color='text.secondary'>
						{emptyMessage}
					</Typography>
				</Paper>
			) : (
				bookings.map((booking) => {
					const bookingSnapshot = booking.snapshot || {};
					const bookingNumber = bookingSnapshot.booking_number || placeholderLabels.noBookingNumber;
					const bookingPublicId = bookingSnapshot.public_id;
					const bookingTimestamp = booking.created_at;
					const bookingDateLabel = `${formatDate(bookingSnapshot.booking_date)} ${formatTime(
						bookingSnapshot.booking_time
					)}`;
					const buyerName = [
						bookingSnapshot.buyer_last_name,
						bookingSnapshot.buyer_first_name,
						bookingSnapshot.buyer_patronymic_name,
					]
						.filter(Boolean)
						.join(' ');
					const status = booking.status;
					const statusLabel = ENUM_LABELS.BOOKING_STATUS[status] || status;
					const flights = bookingSnapshot.flights || [];
					const passengers = bookingSnapshot.passengers || [];
					const payments = bookingSnapshot.payments || [];
					const activeIssues = Object.entries(booking.issues || {}).filter(
						([key, value]) => key !== 'hold_expired' && value
					);
					const hasActiveIssues = activeIssues.length > 0;
					const bookingKey = `${booking.id}-${
						bookingSnapshot.booking_number || bookingSnapshot.public_id || booking.id
					}`;
					const isExpanded = expandedBookings[bookingKey] || false;
					const priceDetails = bookingSnapshot.price_details || {};
					const finalPrice =
						priceDetails.final_price != null ? priceDetails.final_price : bookingSnapshot.total_price;
					const currencyCode = priceDetails.currency || bookingSnapshot.currency || '';
					const buyerContacts = [bookingSnapshot.email_address, bookingSnapshot.phone_number].filter(Boolean);
					const flightTariffsById = Array.isArray(priceDetails.directions)
						? priceDetails.directions.reduce((acc, direction) => {
								const flightId = direction?.flight_id;
								const tariff = direction?.tariff;
								if (flightId && tariff) {
									acc[flightId] = tariff;
								}
								return acc;
						  }, {})
						: {};
					const flightsForTable = flights.map((flight) => {
						const flightId = flight?.id;
						if (!flightId) {
							return flight;
						}
						const tariffFromPrice = flight.tariff || flightTariffsById[flightId];
						if (flight.tariff || !tariffFromPrice) {
							return flight;
						}
						return {
							...flight,
							tariff: tariffFromPrice,
						};
					});
					const paymentsWithMeta = payments.map((payment) => {
						const paymentType = payment?.payment_type ?? payment?.type ?? null;
						const expiresAt = payment?.expires_at ?? payment?.expiresAt ?? null;
						const additions = {};
						if (payment.payment_type == null && paymentType != null) {
							additions.payment_type = paymentType;
						}
						if (payment.expires_at == null && expiresAt != null) {
							additions.expires_at = expiresAt;
						}
						return Object.keys(additions).length > 0 ? { ...payment, ...additions } : payment;
					});

					return (
						<Card
							key={bookingKey}
							elevation={0}
							sx={{
								borderRadius: 3,
								border: (theme) => `1px solid ${theme.palette.divider}`,
							}}
						>
							<CardContent>
								<Stack spacing={2}>
									<Box
										sx={{
											display: 'flex',
											flexDirection: { xs: 'column', md: 'row' },
											justifyContent: 'space-between',
											alignItems: { md: 'center' },
											gap: 1,
										}}
									>
										<Box>
											<Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
												{bookingNumber}
											</Typography>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 1.5,
													flexWrap: 'wrap',
												}}
											>
												<Chip
													label={statusLabel}
													size='small'
													variant='outlined'
													color={statusColors[booking.status] || 'default'}
													sx={chipBaseSx}
												/>
												{bookingDateLabel && (
													<Typography variant='body2' color='text.secondary'>
														{bookingDateLabel}
													</Typography>
												)}
											</Box>
										</Box>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												flexWrap: 'wrap',
											}}
										>
											{booking.user?.email && (
												<Chip
													label={`${labels.chips.user}: ${booking.user.email}`}
													size='small'
													variant='outlined'
													sx={chipBaseSx}
												/>
											)}
											{bookingPublicId && (
												<Chip
													label={bookingPublicId}
													size='small'
													variant='outlined'
													sx={chipBaseSx}
												/>
											)}
											<IconButton onClick={() => onToggleBooking(bookingKey)} size='small'>
												{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
											</IconButton>
										</Box>
									</Box>

									<Collapse in={isExpanded} timeout='auto' unmountOnExit>
										<Stack spacing={1} sx={{ mb: 2 }}>
											<Divider sx={{ my: 1 }} />

											<Stack
												direction={{ xs: 'column', md: 'row' }}
												spacing={1}
												alignItems={{ md: 'center' }}
												justifyContent='space-between'
											>
												<Box>
													<Typography variant='body1' sx={{ fontWeight: 500 }}>
														{buyerName || labels.placeholders.noBuyer}
													</Typography>
													{buyerContacts.length > 0 && (
														<Typography variant='body2' color='text.secondary'>
															{buyerContacts.join(' • ')}
														</Typography>
													)}
												</Box>
												{finalPrice != null && (
													<Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
														<Typography variant='h6' sx={{ fontWeight: 600 }}>
															{`${formatNumber(finalPrice)} ${
																ENUM_LABELS.CURRENCY_SYMBOL[currencyCode] ||
																currencyCode ||
																''
															}`}
														</Typography>
														<Typography variant='body2' color='text.secondary'>
															{formatPriceDetails(priceDetails, pricingLabels) ||
																labels.placeholders.noPricingDetails}
														</Typography>
													</Stack>
												)}
											</Stack>

											<Divider sx={{ my: 1 }} />
										</Stack>

										<Stack spacing={3}>
											<Stack spacing={1}>
												<Typography
													variant='subtitle2'
													color='text.secondary'
													sx={{ fontWeight: 600 }}
												>
													{labels.sections.flights}
												</Typography>
												<DataTable
													columns={flightsColumns}
													data={flightsForTable}
													mapDataToRow={mapFlightToRow}
													emptyMessage={labels.emptyTableMessages?.flights}
												/>
											</Stack>

											<Stack spacing={1}>
												<Typography
													variant='subtitle2'
													color='text.secondary'
													sx={{ fontWeight: 600 }}
												>
													{labels.sections.passengers}
												</Typography>
												<DataTable
													columns={passengersColumns}
													data={passengers}
													mapDataToRow={mapPassengerToRow}
													emptyMessage={labels.emptyTableMessages?.passengers}
												/>
											</Stack>

											<Stack spacing={1}>
												<Typography
													variant='subtitle2'
													color='text.secondary'
													sx={{ fontWeight: 600 }}
												>
													{labels.sections.tickets}
												</Typography>
												{flights.length === 0 ? (
													<Typography variant='body2' color='text.secondary'>
														{labels.placeholders.noFlights}
													</Typography>
												) : (
													<TableContainer
														component={Paper}
														variant='outlined'
														sx={{ borderRadius: 0 }}
													>
														<Table
															size='small'
															sx={{ '& td, & th': { py: 0.75, fontSize: '0.875rem' } }}
														>
															{ticketsColumns.length > 0 && (
																<TableHead>
																	<TableRow>
																		{ticketsColumns.map((col) => (
																			<TableCell key={col.key || col.id}>
																				{col.label}
																			</TableCell>
																		))}
																	</TableRow>
																</TableHead>
															)}
															<TableBody>
																{flights.map((flight, flightIdx) => {
																	const tickets = flight.tickets || [];
																	const ticketColumnsCount = Math.max(
																		ticketsColumns.length || 0,
																		1
																	);
																	const canDownloadItinerary = Boolean(
																		bookingSnapshot.public_id &&
																			flight.booking_flight_id &&
																			flight.tickets?.some(
																				(ticket) =>
																					ticket.can_download_itinerary
																			)
																	);
																	const flightHeader =
																		buildFlightTicketHeader(flight) ||
																		labels.placeholders.noFlights;

																	return (
																		<React.Fragment
																			key={`${bookingKey}-tickets-${
																				flight.booking_flight_id || flightIdx
																			}`}
																		>
																			<TableRow>
																				<TableCell
																					colSpan={ticketColumnsCount}
																					sx={{
																						backgroundColor: 'grey.50',
																						py: 1,
																					}}
																				>
																					<Box
																						sx={{
																							display: 'flex',
																							alignItems: 'center',
																							gap: 1,
																							justifyContent:
																								'space-between',
																						}}
																					>
																						<Typography
																							variant='body2'
																							color='text.secondary'
																							sx={{ fontWeight: 500 }}
																						>
																							{flightHeader}
																						</Typography>
																						{canDownloadItinerary && (
																							<Typography
																								component='button'
																								type='button'
																								variant='body2'
																								onClick={() =>
																									onDownloadItinerary(
																										bookingSnapshot.public_id,
																										flight,
																										bookingNumber
																									)
																								}
																								sx={{
																									ml: 'auto',
																									border: 'none',
																									background: 'none',
																									color: 'primary.main',
																									cursor: 'pointer',
																									textDecoration:
																										'underline',
																									'&:hover': {
																										textDecoration:
																											'none',
																									},
																								}}
																							>
																								{
																									labels.actions
																										.downloadItinerary
																								}
																							</Typography>
																						)}
																					</Box>
																				</TableCell>
																			</TableRow>
																			{tickets.length === 0 ? (
																				<TableRow>
																					<TableCell
																						colSpan={ticketColumnsCount}
																						align='center'
																					>
																						<Typography
																							variant='body2'
																							color='text.secondary'
																						>
																							{
																								labels
																									.emptyTableMessages
																									?.tickets
																							}
																						</Typography>
																					</TableCell>
																				</TableRow>
																			) : (
																				tickets.map((ticket, ticketIdx) => {
																					const row = {
																						...mapTicketToRow(ticket),
																						status: renderTicketAction
																							? renderTicketAction(
																									booking,
																									ticket,
																									bookingNumber
																							  )
																							: null,
																					};
																					return (
																						<TableRow
																							key={`${bookingKey}-ticket-${flightIdx}-${ticketIdx}`}
																						>
																							{ticketsColumns.map(
																								(col) => (
																									<TableCell
																										key={
																											col.key ||
																											col.id
																										}
																									>
																										{row[
																											col.key ||
																												col.id
																										] || '—'}
																									</TableCell>
																								)
																							)}
																						</TableRow>
																					);
																				})
																			)}
																		</React.Fragment>
																	);
																})}
															</TableBody>
														</Table>
													</TableContainer>
												)}
											</Stack>

											<Stack spacing={1}>
												<Typography
													variant='subtitle2'
													color='text.secondary'
													sx={{ fontWeight: 600 }}
												>
													{labels.sections.payments}
												</Typography>
												<DataTable
													columns={paymentsColumns}
													data={paymentsWithMeta}
													mapDataToRow={mapPaymentToRow}
													emptyMessage={labels.emptyTableMessages?.payments}
												/>
											</Stack>

											{booking.status_history && booking.status_history.length > 0 && (
												<Stack spacing={0.5}>
													<Typography
														variant='subtitle2'
														color='text.secondary'
														sx={{ fontWeight: 600 }}
													>
														{labels.sections.statusHistory}
													</Typography>

													<Box
														sx={{
															display: 'flex',
															flexDirection: 'row',
															gap: 1,
															flexWrap: 'wrap',
														}}
													>
														{booking.status_history.map((entry, idx) => (
															<Tooltip
																key={`${booking.id}-status-${idx}`}
																title={entry.at ? formatDateTime(entry.at) : ''}
															>
																<Chip
																	label={
																		ENUM_LABELS.BOOKING_STATUS[entry.status] ||
																		entry.status
																	}
																	size='small'
																	variant='filled'
																	color={statusColors[entry.status] || 'default'}
																	sx={chipBaseSx}
																/>
															</Tooltip>
														))}
													</Box>
												</Stack>
											)}

											{hasActiveIssues && (
												<Stack spacing={0.5}>
													<Typography
														variant='subtitle2'
														color='text.secondary'
														sx={{ fontWeight: 600 }}
													>
														{labels.sections.issues}
													</Typography>
													<Box
														sx={{
															display: 'flex',
															flexDirection: 'row',
															gap: 1,
															flexWrap: 'wrap',
														}}
													>
														{activeIssues.map(([key]) => (
															<Chip
																key={`${booking.id}-issue-${key}`}
																label={labels.issues[key] || key}
																color={issueColors[key] || 'default'}
																size='small'
																sx={chipBaseSx}
															/>
														))}
													</Box>
												</Stack>
											)}
										</Stack>

										<Divider sx={{ my: 2 }} />

										<Box
											sx={{
												display: 'flex',
												flexDirection: 'row',
												gap: 1.5,
												flexWrap: 'wrap',
											}}
										>
											<Button
												variant='outlined'
												color='primary'
												component={Link}
												to={bookingPublicId ? `/booking/${bookingPublicId}` : '#'}
												target='_blank'
												rel='noopener noreferrer'
												disabled={!bookingPublicId || ['expired'].includes(status)}
											>
												{labels.actions.openBooking}
											</Button>
											<Button
												variant='contained'
												color='primary'
												onClick={() => onDownloadBookingPdf(bookingPublicId, bookingNumber)}
												disabled={
													!bookingPublicId || !['completed', 'cancelled'].includes(status)
												}
											>
												{labels.actions.download}
											</Button>
										</Box>
									</Collapse>
								</Stack>
							</CardContent>
						</Card>
					);
				})
			)}
			{totalCount > 0 && (
				<TablePagination
					component='div'
					count={totalCount}
					page={page}
					onPageChange={onPageChange}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={onRowsPerPageChange}
					rowsPerPageOptions={[10, 25, 50, 100]}
					labelRowsPerPage={BUTTONS.pagination.rows_per_page}
					labelDisplayedRows={BUTTONS.pagination.displayed_rows}
				/>
			)}
		</Stack>
	);
};

export default BookingDashboardList;
