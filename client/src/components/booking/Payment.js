import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Typography, Button, Alert, CircularProgress } from '@mui/material';

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
	const paymentType = payment?.payment_type;
	const isInvoice = paymentType === 'invoice';

	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
	const accessToken = searchParams.get('access_token');

	const isProcessing = searchParams.has('processing') && !['succeeded', 'canceled'].includes(paymentStatus);

	useEffect(() => {
		dispatch(fetchPayment({ publicId, accessToken }));
	}, [dispatch, publicId, accessToken]);

	useEffect(() => {
		if (!isProcessing || ['succeeded', 'canceled'].includes(paymentStatus)) return;
		const id = setInterval(() => dispatch(fetchPayment({ publicId, accessToken })), 3000);
		return () => clearInterval(id);
	}, [isProcessing, paymentStatus, dispatch, publicId, accessToken]);

	useEffect(() => {
		if (paymentStatus === 'succeeded') {
			const query = accessToken ? `?access_token=${accessToken}` : '';
			navigate(`/booking/${publicId}/completion${query}`);
		}
	}, [paymentStatus, navigate, publicId, accessToken]);

	const handleError = useCallback(() => {
		dispatch(fetchPayment({ publicId, accessToken }));
	}, [dispatch, publicId, accessToken]);

	const returnUrl = `${window.location.origin}${window.location.pathname}?processing=1`;

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='payment' />

			<Container maxWidth='md' sx={{ mt: { xs: 2, md: 4 }, mx: 'auto', width: '100%', px: { xs: 2, md: 0 } }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-start',
						mb: 2,
					}}
				>
					<Typography variant='h6' sx={{ fontWeight: 600, textDecoration: 'underline' }}>
						{`${UI_LABELS.BOOKING.payment_form.total}: `}
					</Typography>
					<Typography variant='h6' sx={{ ml: 1, fontWeight: 600 }}>
						{`${formatNumber(paymentAmount)} ${currencySymbol}`}
					</Typography>
				</Box>
				{paymentStatus === 'canceled' && (
					<Alert severity='error' sx={{ mb: 2 }}>
						{UI_LABELS.BOOKING.payment_form.payment_failed}
					</Alert>
				)}{' '}
				{isProcessing && paymentStatus !== 'succeeded' && paymentStatus !== 'canceled' && (
					<Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
						<CircularProgress />
					</Box>
				)}
				{!isProcessing && paymentStatus !== 'succeeded' && !isInvoice && (
					<PaymentForm confirmationToken={confirmationToken} returnUrl={returnUrl} onError={handleError} />
				)}
				{isInvoice && paymentStatus !== 'succeeded' && (
					<Typography sx={{ mt: 2 }}>{UI_LABELS.BOOKING.payment_form.invoice_waiting}</Typography>
				)}
				{paymentStatus === 'canceled' && !isInvoice && (
					<Button
						variant='contained'
						color='orange'
						sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
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
			</Container>
		</Base>
	);
};

export default Payment;
