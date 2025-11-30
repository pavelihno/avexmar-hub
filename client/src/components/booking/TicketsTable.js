import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Checkbox,
	FormControlLabel,
	Alert,
	Divider,
	CircularProgress,
	Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { formatNumber } from '../utils';
import { fetchTicketRefundDetails, requestTicketRefund, fetchBookingDetails } from '../../redux/actions/bookingProcess';

const createInitialRefundState = () => ({
	open: false,
	ticket: null,
	loading: false,
	submitting: false,
	details: null,
	error: null,
	success: false,
	accepted: false,
});

const extractErrorMessage = (error, fallbackMessage) => {
	if (!error) return fallbackMessage;
	if (typeof error === 'string') return error;
	if (error.message) return error.message;
	if (error.error) return error.error;
	if (error.errors) {
		const flattened = Object.values(error.errors)
			.flat()
			.find((value) => typeof value === 'string');
		if (flattened) return flattened;
	}
	return fallbackMessage;
};

const getPassengerFullName = (passenger = {}) => {
	return [passenger.last_name, passenger.first_name, passenger.patronymic_name].filter(Boolean).join(' ');
};

const getPassengerDocumentLabel = (passenger = {}) => {
	const documentTypeLabel = passenger.document_type
		? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
		: null;
	return [documentTypeLabel, passenger.document_number].filter(Boolean).join(' · ');
};

const TicketsTable = ({ flights = [], publicId, accessToken, currencySymbol }) => {
	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));
	const dispatch = useDispatch();

	const [refundState, setRefundState] = useState(() => createInitialRefundState());

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

	const handleCloseRefundDialog = () => {
		if (refundState.submitting || refundState.success) return;
		setRefundState(createInitialRefundState());
	};

	const forceCloseRefundDialog = () => {
		setRefundState(createInitialRefundState());
	};

	const handleAcceptChange = (accepted) => {
		setRefundState((prev) => ({
			...prev,
			accepted,
			...(prev.error && { error: null }),
		}));
	};

	const handleOpenRefundDialog = async (ticket) => {
		if (!ticket?.id || !publicId) return;
		setRefundState({
			...createInitialRefundState(),
			open: true,
			ticket,
			loading: true,
		});

		try {
			const data = await dispatch(
				fetchTicketRefundDetails({
					publicId,
					ticketId: ticket.id,
					accessToken,
				})
			).unwrap();

			setRefundState((prev) => ({
				...prev,
				loading: false,
				details: data?.refund_details || null,
				error: null,
			}));
		} catch (err) {
			setRefundState((prev) => ({
				...prev,
				loading: false,
				success: false,
				error: extractErrorMessage(err, UI_LABELS.BOOKING.confirmation.refund.dialog.fetch_error),
			}));
		}
	};

	const handleSubmitRefundRequest = async () => {
		if (!refundState.ticket?.id || !publicId) return;
		setRefundState((prev) => ({
			...prev,
			submitting: true,
			error: null,
		}));

		try {
			await dispatch(
				requestTicketRefund({
					publicId,
					ticketId: refundState.ticket.id,
					accessToken,
				})
			).unwrap();

			setRefundState((prev) => ({
				...prev,
				submitting: false,
				success: true,
				error: null,
			}));

			setTimeout(() => {
				forceCloseRefundDialog();
				dispatch(fetchBookingDetails({ publicId, accessToken }));
			}, 5000);
		} catch (err) {
			setRefundState((prev) => ({
				...prev,
				submitting: false,
				success: false,
				error: extractErrorMessage(err, UI_LABELS.BOOKING.confirmation.refund.dialog.submit_error),
			}));
		}
	};

	const renderRefundAction = (ticket) => {
		const status = ticket?.status;

		if (status != 'ticketed') {
			return (
				<Typography variant='body2' color='text.secondary'>
					{ENUM_LABELS.BOOKING_FLIGHT_PASSENGER_STATUS[status] || status}
				</Typography>
			);
		}

		return (
			<Link
				component='button'
				variant='body2'
				onClick={() => handleOpenRefundDialog(ticket)}
				sx={{ cursor: 'pointer' }}
			>
				{UI_LABELS.BOOKING.confirmation.refund.link}
			</Link>
		);
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

			return {
				key: ticket.id ?? idx,
				ticketNumber: ticket?.ticket_number || '—',
				passenger: getPassengerFullName(passenger) || '—',
				document: getPassengerDocumentLabel(passenger) || '—',
				ticket,
			};
		});

		return ticketsData.map((data) => (
			<TableRow key={data.key}>
				<TableCell>{data.ticketNumber}</TableCell>
				<TableCell>{data.passenger}</TableCell>
				<TableCell>{data.document}</TableCell>
				<TableCell>{renderRefundAction(data.ticket)}</TableCell>
			</TableRow>
		));
	};

	// Mobile card view
	if (isXs) {
		return (
			<>
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

								{tickets.map((ticket, idx) => {
									const passenger = ticket?.passenger || {};
									const documentLabel = getPassengerDocumentLabel(passenger);

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
												{renderRefundAction(ticket)}
											</Box>

											<Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.25 }}>
												{getPassengerFullName(passenger) || '—'}
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

				<TicketRefundDialog
					state={refundState}
					onClose={handleCloseRefundDialog}
					onSubmit={handleSubmitRefundRequest}
					onAcceptChange={handleAcceptChange}
					currencySymbol={currencySymbol}
				/>
			</>
		);
	}

	// Desktop table view
	return (
		<>
			<TableContainer sx={{ overflowX: 'auto', mb: 2 }}>
				<Table size='small'>
					<TableHead>
						<TableRow>
							<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.ticket_number}</TableCell>
							<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.passenger}</TableCell>
							<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.document}</TableCell>
							<TableCell>{UI_LABELS.BOOKING.confirmation.ticket_columns.status}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{flights.map((flight, flightIdx) => {
							const flightKey = flight.id || flight.booking_flight_id || flightIdx;
							const flightHeader = buildFlightTicketHeader(flight);

							return (
								<React.Fragment key={flightKey}>
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
									{renderTicketsForFlight(flight)}
								</React.Fragment>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			<TicketRefundDialog
				state={refundState}
				onClose={handleCloseRefundDialog}
				onSubmit={handleSubmitRefundRequest}
				onAcceptChange={handleAcceptChange}
				currencySymbol={currencySymbol}
			/>
		</>
	);
};

const TicketRefundDialog = ({ state, onClose, onSubmit, onAcceptChange, currencySymbol }) => {
	const { open, ticket, loading, submitting, details, error, success, accepted } = state || {};
	const passenger = ticket?.passenger || {};
	const labels = UI_LABELS.BOOKING.confirmation.refund;
	const dialogLabels = labels.dialog;

	const resolvedCurrencySymbol = useMemo(() => {
		if (currencySymbol) return currencySymbol;
		if (details?.currency) {
			return ENUM_LABELS.CURRENCY_SYMBOL?.[details.currency] || '';
		}
		return '';
	}, [currencySymbol, details?.currency]);

	const formatCurrency = (value) => {
		if (typeof value !== 'number') {
			return '—';
		}
		const formatted = formatNumber(value);
		return resolvedCurrencySymbol ? `${formatted} ${resolvedCurrencySymbol}` : formatted;
	};

	const documentLabel = getPassengerDocumentLabel(passenger);

	return (
		<Dialog
			open={open}
			onClose={submitting || success ? undefined : onClose}
			maxWidth='sm'
			fullWidth
			disableEscapeKeyDown={submitting || success}
		>
			<DialogTitle>{dialogLabels.title}</DialogTitle>

			<Box sx={{ px: 3, py: 1 }}>
				<Fade in={!!error} timeout={300}>
					<div>{error && <Alert severity='error'>{error}</Alert>}</div>
				</Fade>

				<Fade in={!!success} timeout={300}>
					<div>{success && <Alert severity='success'>{dialogLabels.success}</Alert>}</div>
				</Fade>
			</Box>

			<DialogContent dividers>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Paper variant='outlined' sx={{ p: 2 }}>
						<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
							{dialogLabels.ticket_info}
						</Typography>
						<Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 1 }}>
							<Typography variant='caption' color='text.secondary'>
								{dialogLabels.ticket_number}
							</Typography>
							<Typography variant='body2'>{ticket?.ticket_number || '—'}</Typography>

							<Typography variant='caption' color='text.secondary'>
								{dialogLabels.passenger}
							</Typography>
							<Typography variant='body2'>{getPassengerFullName(passenger) || '—'}</Typography>

							<Typography variant='caption' color='text.secondary'>
								{dialogLabels.document}
							</Typography>
							<Typography variant='body2'>{documentLabel || '—'}</Typography>
						</Box>
					</Paper>

					{loading && (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
							<CircularProgress size={28} />
						</Box>
					)}

					{details && !loading && !success && (
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
								{dialogLabels.summary}
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography variant='body2' color='text.secondary'>
										{dialogLabels.unit_price}
									</Typography>
									<Typography variant='body2' sx={{ fontWeight: 600 }}>
										{formatCurrency(details.unit_price)}
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography variant='body2' color='text.secondary'>
										{dialogLabels.total_penalty_fees}
									</Typography>
									<Typography variant='body2' sx={{ fontWeight: 600 }}>
										{formatCurrency(details.total_penalty_fees)}
									</Typography>
								</Box>
								<Divider />
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography variant='body2' sx={{ fontWeight: 600 }}>
										{dialogLabels.refund_amount}
									</Typography>
									<Typography variant='body2' sx={{ fontWeight: 700 }}>
										{formatCurrency(details.refund_amount)}
									</Typography>
								</Box>
							</Box>
						</Paper>
					)}

					{success && (
						<Box
							sx={{
								height: '160px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<CircularProgress color='primary' size={40} />
						</Box>
					)}

					{!success && !loading && details && (
						<FormControlLabel
							control={
								<Checkbox
									checked={accepted}
									onChange={(event) => onAcceptChange(event.target.checked)}
									disabled={!details}
								/>
							}
							label={dialogLabels.accept_label}
						/>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={submitting || success}>
					{UI_LABELS.BUTTONS.close}
				</Button>
				{!success && (
					<Button
						variant='contained'
						onClick={onSubmit}
						disabled={!accepted || submitting || loading || !details || Boolean(error)}
					>
						{submitting && <CircularProgress color='inherit' size={20} sx={{ mr: 1 }} />}
						{dialogLabels.submit}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default TicketsTable;
