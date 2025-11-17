import React, { useMemo } from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fade,
	Paper,
	Stack,
	Typography,
} from '@mui/material';

import { BUTTONS } from '../../../../constants';
import { createFieldRenderer, FIELD_TYPES, formatDateTime, formatDate, formatTime } from '../../../utils';
import { getPassengerDocumentLabel, getPassengerFullName, getRouteLabel } from './bookingDashboardUtils';

const BookingRefundDialog = ({
	state,
	labels,
	refundLabels,
	onClose,
	onAction,
	onRejectionReasonChange,
	onToggleRejectionReason,
}) => {
	const {
		open,
		loading,
		submitting,
		success,
		error,
		data,
		ticket,
		bookingNumber,
		actionType,
		rejectionReason,
		showRejectionReason,
	} = state || {};

	const dialogLabels = refundLabels?.dialog || {};
	const placeholders = labels?.placeholders || {};
	const ticketDetails = data?.ticket || ticket || {};
	const hasTicketInfo = Boolean(ticketDetails && (ticketDetails.id || ticketDetails.ticket_number));
	const passenger = ticketDetails?.passenger || {};
	const documentLabel = getPassengerDocumentLabel(passenger) || '—';
	const bookingNumberLabel = data?.booking?.booking_number || bookingNumber || placeholders.noBookingNumber || '—';
	const ticketNumber = ticketDetails?.ticket_number || '—';
	const routeLabel = getRouteLabel(ticketDetails?.flight?.route) || placeholders.noFlights || '—';
	const flightNumber = ticketDetails?.flight?.airline_flight_number || ticketDetails?.flight?.flight_number || '—';
	const flightTimeLabel =
		`${formatDate(ticketDetails?.flight?.scheduled_departure)} ${formatTime(
			ticketDetails?.flight?.scheduled_departure_time
		)}`.trim() || '—';

	const requestedAtLabel = ticketDetails?.refund_request_at ? formatDateTime(ticketDetails.refund_request_at) : '—';
	const decisionAtLabel = ticketDetails?.refund_decision_at ? formatDateTime(ticketDetails.refund_decision_at) : null;
	const disableActions = loading || submitting || success;
	const closeLabel = dialogLabels.close || BUTTONS.close;

	const handleRejectClick = () => {
		if (showRejectionReason) {
			onAction('reject');
		} else {
			onToggleRejectionReason(true);
		}
	};

	const handleRejectionReasonSubmit = () => {
		if (rejectionReason && rejectionReason.trim()) {
			onAction('reject');
		}
	};

	const renderRejectionReasonField = useMemo(
		() =>
			createFieldRenderer({
				label: dialogLabels.rejectionReasonLabel,
				type: FIELD_TYPES.TEXT_AREA,
				rows: 3,
				inputProps: {
					placeholder: dialogLabels.rejectionReasonPlaceholder,
				},
			}),
		[dialogLabels.rejectionReasonLabel, dialogLabels.rejectionReasonPlaceholder]
	);

	return (
		<Dialog
			open={Boolean(open)}
			onClose={submitting || success ? undefined : onClose}
			maxWidth='sm'
			fullWidth
			disableEscapeKeyDown={submitting || success}
		>
			<DialogTitle>{dialogLabels.title}</DialogTitle>
			<Box sx={{ px: 3, pt: 1 }}>
				<Fade in={Boolean(error)} timeout={200}>
					<div>{error ? <Alert severity='error'>{error}</Alert> : null}</div>
				</Fade>
				<Fade in={Boolean(success)} timeout={200}>
					<div>{success ? <Alert severity='success'>{dialogLabels.success}</Alert> : null}</div>
				</Fade>
			</Box>

			<DialogContent dividers sx={{ mt: 1 }}>
				<Stack spacing={2}>
					{loading && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
							<CircularProgress size={24} />
							<Typography variant='body2' color='text.secondary'>
								{dialogLabels.loading}
							</Typography>
						</Box>
					)}
					{!loading && hasTicketInfo && (
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: '160px 1fr',
									rowGap: 1,
									columnGap: 2,
								}}
							>
								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.bookingNumber}
								</Typography>
								<Typography variant='body2'>{bookingNumberLabel}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.ticketNumber}
								</Typography>
								<Typography variant='body2'>{ticketNumber}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.passenger}
								</Typography>
								<Typography variant='body2'>{getPassengerFullName(passenger) || '—'}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.document}
								</Typography>
								<Typography variant='body2'>{documentLabel}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.route}
								</Typography>
								<Typography variant='body2'>{routeLabel}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.flight}
								</Typography>
								<Typography variant='body2'>{flightNumber || '—'}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.departure_time}
								</Typography>
								<Typography variant='body2'>{flightTimeLabel}</Typography>

								<Typography variant='caption' color='text.secondary'>
									{dialogLabels.requestedAt}
								</Typography>
								<Typography variant='body2'>{requestedAtLabel}</Typography>

								{decisionAtLabel && (
									<>
										<Typography variant='caption' color='text.secondary'>
											{dialogLabels.decisionAt}
										</Typography>
										<Typography variant='body2'>{decisionAtLabel}</Typography>
									</>
								)}
							</Box>
						</Paper>
					)}
					{!loading && !hasTicketInfo && !error && (
						<Typography variant='body2' color='text.secondary'>
							{dialogLabels.noData}
						</Typography>
					)}
					{showRejectionReason && !loading && !success && (
						<Box sx={{ mt: 2 }}>
							{renderRejectionReasonField({
								value: rejectionReason || '',
								onChange: onRejectionReasonChange,
								fullWidth: true,
								disabled: submitting,
								error: showRejectionReason && (!rejectionReason || !rejectionReason.trim()),
								helperText:
									showRejectionReason && (!rejectionReason || !rejectionReason.trim())
										? dialogLabels.rejectionReasonRequired
										: '',
							})}
						</Box>
					)}
					{success && (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
							<CircularProgress size={32} />
						</Box>
					)}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ gap: 1 }}>
				{!showRejectionReason && (
					<Button onClick={onClose} disabled={submitting || success}>
						{closeLabel}
					</Button>
				)}
				{!showRejectionReason && (
					<>
						<Button variant='outlined' color='error' onClick={handleRejectClick} disabled={disableActions}>
							{submitting && actionType === 'reject' && <CircularProgress size={20} sx={{ mr: 1 }} />}
							{dialogLabels.decline}
						</Button>
						<Button variant='contained' onClick={() => onAction('confirm')} disabled={disableActions}>
							{submitting && actionType === 'confirm' && <CircularProgress size={20} sx={{ mr: 1 }} />}
							{dialogLabels.confirm}
						</Button>
					</>
				)}
				{showRejectionReason && (
					<>
						<Button onClick={() => onToggleRejectionReason(false)} disabled={submitting || success}>
							{dialogLabels.back}
						</Button>
						<Button
							variant='contained'
							color='error'
							onClick={handleRejectionReasonSubmit}
							disabled={!rejectionReason || !rejectionReason.trim() || submitting}
						>
							{submitting && actionType === 'reject' && <CircularProgress size={20} sx={{ mr: 1 }} />}
							{dialogLabels.reject}
						</Button>
					</>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default BookingRefundDialog;
