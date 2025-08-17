import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';

import Base from '../Base';
import BookingProgress from './BookingProgress';
import PaymentForm from './PaymentForm';
import { createPayment, fetchPayment } from '../../redux/actions/payment';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber, parseDate } from '../utils';

const formatTimer = (ms) => {
	const total = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	return (
		`${hours.toString().padStart(2, '0')}:` +
		`${minutes.toString().padStart(2, '0')}:` +
		`${seconds.toString().padStart(2, '0')}`
	);
};

const toExpiryMs = (isoLike) => {
	if (!isoLike) return NaN;
	let s = String(isoLike).trim();

	// Trim fractional seconds to 3 digits (milliseconds)
	s = s.replace(/\.(\d{3})\d+$/, '.$1');

	// If there's no timezone info, assume UTC (append Z)
	if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s += 'Z';

	const t = Date.parse(s);
	return Number.isNaN(t) ? NaN : t;
};

const Payment = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const payment = useSelector((s) => s.payment.current);

	const paymentStatus = payment?.payment_status;
	const paymentAmount = payment?.amount;
	const currencySymbol = payment ? ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || '' : '';
	const expiresAt = payment?.expires_at;
	const confirmationToken = payment?.confirmation_token;

	const [timeLeft, setTimeLeft] = useState(null);

	useEffect(() => {
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	useEffect(() => {
		if (!expiresAt) return;

		const expiry = toExpiryMs(expiresAt);
		if (Number.isNaN(expiry)) {
			setTimeLeft(0);
			return;
		}

		const tick = () => {
			const left = Math.max(expiry - Date.now(), 0);
			setTimeLeft(left);
			if (left === 0) clearInterval(id);
		};

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [expiresAt]);

	useEffect(() => {
		if (paymentStatus === 'succeeded') {
			navigate(`/booking/${publicId}/completion`);
		}
	}, [paymentStatus, navigate, publicId]);

	const handleError = useCallback(() => {
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='payment' />
			<Box sx={{ mt: 2, mx: 'auto', width: '100%', maxWidth: 'md' }}>
				<Card>
					<CardContent>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
							<Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
								<Typography variant='h6' sx={{ fontWeight: 600, textDecoration: 'underline' }}>
									{`${UI_LABELS.BOOKING.payment_form.total}: `}
								</Typography>
								<Typography variant='h6' sx={{ ml: 1, fontWeight: 600 }}>
									{`${formatNumber(paymentAmount)} ${currencySymbol}`}
								</Typography>
							</Box>
							{expiresAt && timeLeft !== null && (
								<Box>
									<Typography variant='h6'>{formatTimer(timeLeft)}</Typography>
								</Box>
							)}
						</Box>

						{paymentStatus === 'canceled' && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{UI_LABELS.BOOKING.payment_form.payment_failed}
							</Alert>
						)}
						{paymentStatus !== 'succeeded' && (
							<PaymentForm
								confirmationToken={confirmationToken}
								returnUrl={window.location.href}
								onError={handleError}
							/>
						)}
						{paymentStatus === 'canceled' && (
							<Button
								variant='contained'
								color='orange'
								sx={{ mt: 2 }}
								onClick={() => {
									dispatch(
										createPayment({
											public_id: publicId,
											return_url: window.location.href,
										})
									);
								}}
							>
								{UI_LABELS.BOOKING.payment_form.retry_payment}
							</Button>
						)}
					</CardContent>
				</Card>
			</Box>
		</Base>
	);
};

export default Payment;
