import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';

import Base from '../Base';
import BookingProgress from './BookingProgress';
import PaymentForm from './PaymentForm';
import { fetchBookingDetails } from '../../redux/actions/bookingProcess';
import { createPayment, fetchPayment } from '../../redux/actions/payment';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber, parseDate } from '../utils';

const formatTime = (ms) => {
	const total = Math.floor(ms / 1000);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	return `${hours.toString().padStart(2, '0')}:${minutes
		.toString()
		.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Payment = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const booking = useSelector((s) => s.bookingProcess.current);
	const payment = useSelector((s) => s.payment.current);
	const [timeLeft, setTimeLeft] = useState(null);

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	useEffect(() => {
		if (!payment?.expires_at) return;
		const expiry = parseDate(payment.expires_at).getTime();
		const tick = () => setTimeLeft(Math.max(expiry - Date.now(), 0));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [payment?.expires_at]);

	const status = booking?.status;

	useEffect(() => {
		if (status === 'payment_confirmed' || status === 'completed') {
			navigate(`/booking/${publicId}/completion`);
		}
	}, [status, navigate, publicId]);

	const handleError = useCallback(() => {
		dispatch(fetchBookingDetails(publicId));
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	const flight = booking?.flights?.[0];
	const route = flight?.route;
	const routeInfo =
		route &&
		UI_LABELS.SCHEDULE.from_to(
			route.origin_airport?.city_name || route.origin_airport?.iata_code,
			route.destination_airport?.city_name || route.destination_airport?.iata_code,
		);

	const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='payment' />
			<Box sx={{ mt: 2 }}>
				<Card>
					<CardContent>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
							{routeInfo && (
								<Typography variant='h6'>{routeInfo}</Typography>
							)}
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{UI_LABELS.BOOKING.buyer_form.summary.total}:{' '}
								{formatNumber(booking?.total_price || 0)} {currencySymbol}
							</Typography>
						</Box>
						{payment?.expires_at && timeLeft !== null && (
							<Typography variant='body2' sx={{ mb: 2 }}>
								{UI_LABELS.BOOKING.payment_time_left || 'Time left to pay'}:{' '}
								{formatTime(timeLeft)}
							</Typography>
						)}
						{status === 'payment_failed' && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{UI_LABELS.BOOKING.payment_failed || 'Payment failed'}
							</Alert>
						)}
						{status !== 'payment_confirmed' && (
							<PaymentForm
								confirmationToken={payment?.confirmation_token}
								returnUrl={window.location.href}
								onError={handleError}
							/>
						)}
						{status === 'payment_failed' && (
							<Button
								variant='contained'
								color='orange'
								sx={{ mt: 2 }}
								onClick={() => {
									dispatch(fetchBookingDetails(publicId));
									dispatch(
										createPayment({
											public_id: publicId,
											return_url: window.location.href,
										}),
									);
								}}
							>
								{UI_LABELS.BOOKING.retry_payment || 'Retry payment'}
							</Button>
						)}
					</CardContent>
				</Card>
			</Box>
		</Base>
	);
};

export default Payment;

