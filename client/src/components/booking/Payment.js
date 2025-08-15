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

const Payment = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const booking = useSelector((state) => state.bookingProcess.current);
	const payment = useSelector((state) => state.payment.current);
	const [timeLeft, setTimeLeft] = useState(null);

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
		dispatch(createPayment({ public_id: publicId, return_url: window.location.href }));
	}, [dispatch, publicId]);

	useEffect(() => {
		if (!payment?.expires_at) return;
		const expiry = parseDate(payment.expires_at).getTime();
		const tick = () => {
			const diff = expiry - Date.now();
			setTimeLeft(diff > 0 ? diff : 0);
		};
		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [payment?.expires_at]);

	const status = booking?.status;

	useEffect(() => {
		if (status === 'payment_confirmed' || status === 'completed') {
			navigate(`/booking/${publicId}/completion`);
		}
	}, [status, navigate, publicId]);

	const handleSuccess = useCallback(() => {
		dispatch(fetchBookingDetails(publicId));
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	const handleError = useCallback(() => {
		dispatch(fetchBookingDetails(publicId));
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	const getRouteInfo = (flight) => {
		if (!flight?.route) return null;
		const origin = flight.route.origin_airport || {};
		const dest = flight.route.destination_airport || {};
		return UI_LABELS.SCHEDULE.from_to(origin.city_name || origin.iata_code, dest.city_name || dest.iata_code);
	};

	const routeInfo = getRouteInfo(booking?.flights?.[0]);

	const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

	const formatTime = (ms) => {
		const total = Math.floor(ms / 1000);
		const hours = Math.floor(total / 3600);
		const minutes = Math.floor((total % 3600) / 60);
		const seconds = total % 60;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
			.toString()
			.padStart(2, '0')}`;
	};

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='payment' />
			<Box sx={{ mt: 2 }}>
				<Card>
					<CardContent>
						{routeInfo && (
							<Typography variant='h6' sx={{ mb: 2 }}>
								{routeInfo}
							</Typography>
						)}
						<Typography variant='body1' sx={{ mb: 2 }}>
							{UI_LABELS.BOOKING.buyer_form.summary.total}: {formatNumber(booking?.total_price || 0)}{' '}
							{currencySymbol}
						</Typography>
						{payment?.expires_at && timeLeft !== null && (
							<Typography variant='body2' sx={{ mb: 2 }}>
								{UI_LABELS.BOOKING.payment_time_left || 'Time left to pay'}: {formatTime(timeLeft)}
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
								onSuccess={handleSuccess}
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
									dispatch(createPayment({ public_id: publicId, return_url: window.location.href }));
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
