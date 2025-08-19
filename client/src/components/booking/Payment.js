import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress } from '@mui/material';

import Base from '../Base';
import BookingProgress from './BookingProgress';
import PaymentForm from './PaymentForm';
import { createPayment, fetchPayment } from '../../redux/actions/payment';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber } from '../utils';

const Payment = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const payment = useSelector((s) => s.payment.current);

	const paymentStatus = payment?.payment_status;
	const paymentAmount = payment?.amount;
	const currencySymbol = payment ? ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || '' : '';
	const confirmationToken = payment?.confirmation_token;
	const expiresAt = payment?.expires_at;

	const [timeLeft, setTimeLeft] = useState('');

	useEffect(() => {
		document.title = UI_LABELS.BOOKING.payment_form.title(timeLeft);
	}, [timeLeft]);

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

	useEffect(() => {
		const targetMs = toExpiryMs(expiresAt);
		if (!isFinite(targetMs)) {
			setTimeLeft('');
			return;
		}

		let timer = null;

		const render = () => {
			const now = Date.now();
			let diff = targetMs - now;

			if (diff <= 0) {
				setTimeLeft('00:00');
				return;
			}

			const minutes = Math.floor(diff / 60000);
			const seconds = Math.floor((diff % 60000) / 1000);
			setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

			// align next tick to the next full second to avoid drift
			const nextIn = 1000 - (now % 1000);
			timer = setTimeout(render, nextIn);
		};

		render();
		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [expiresAt]);

	const isProcessing =
		new URLSearchParams(location.search).has('processing') && !['succeeded', 'canceled'].includes(paymentStatus);

	useEffect(() => {
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	useEffect(() => {
		if (!isProcessing || ['succeeded', 'canceled'].includes(paymentStatus)) return;
		const id = setInterval(() => dispatch(fetchPayment(publicId)), 3000);
		return () => clearInterval(id);
	}, [isProcessing, paymentStatus, dispatch, publicId]);

	useEffect(() => {
		if (paymentStatus === 'succeeded') {
			navigate(`/booking/${publicId}/completion`);
		}
	}, [paymentStatus, navigate, publicId]);

	const handleError = useCallback(() => {
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	const returnUrl = `${window.location.origin}${window.location.pathname}?processing=1`;

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
							{expiresAt && !['succeeded', 'canceled'].includes(paymentStatus) && (
								<Typography variant='h6' sx={{ fontWeight: 600 }}>
									{timeLeft}
								</Typography>
							)}
						</Box>

						{paymentStatus === 'canceled' && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{UI_LABELS.BOOKING.payment_form.payment_failed}
							</Alert>
						)}

						{isProcessing && paymentStatus !== 'succeeded' && paymentStatus !== 'canceled' && (
							<Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
								<CircularProgress />
							</Box>
						)}

						{!isProcessing && paymentStatus !== 'succeeded' && (
							<PaymentForm
								confirmationToken={confirmationToken}
								returnUrl={returnUrl}
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
