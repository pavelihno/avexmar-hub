import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber } from '../utils';

const Payment = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
        const booking = useSelector((state) => state.bookingProcess.current);

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
	}, [dispatch, publicId]);

        const getRouteInfo = (flight) => {
                if (!flight?.route) return null;
                const origin = flight.route.origin_airport || {};
                const dest = flight.route.destination_airport || {};
                return UI_LABELS.SCHEDULE.from_to(
                        origin.city_name || origin.iata_code,
                        dest.city_name || dest.iata_code
                );
        };

        const routeInfo = getRouteInfo(booking?.flights?.[0]);

        const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

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
						<Button variant='contained' color='orange' href='https://yoomoney.ru/' target='_blank'>
							Оплатить через YooMoney
						</Button>
					</CardContent>
				</Card>
			</Box>
		</Base>
	);
};

export default Payment;
