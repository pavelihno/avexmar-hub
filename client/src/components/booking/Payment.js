import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber } from '../utils';
import { serverApi } from '../../api';

const Payment = () => {
    const { publicId } = useParams();
    const dispatch = useDispatch();
    const booking = useSelector((state) => state.bookingProcess.current);
    const [routeInfo, setRouteInfo] = useState(null);

    useEffect(() => {
        dispatch(fetchBookingDetails(publicId));
    }, [dispatch, publicId]);

    useEffect(() => {
        const loadRoute = async () => {
            if (!booking?.directions || booking.directions.length === 0) return;
            const d = booking.directions[0];
            try {
                const flight = (await serverApi.get(`/flights/${d.flight_id}`)).data;
                const route = (await serverApi.get(`/routes/${flight.route_id}`)).data;
                const origin = (await serverApi.get(`/airports/${route.origin_airport_id}`)).data;
                const dest = (await serverApi.get(`/airports/${route.destination_airport_id}`)).data;
                setRouteInfo(UI_LABELS.SCHEDULE.from_to(origin.city || origin.iata_code, dest.city || dest.iata_code));
            } catch (e) {
                setRouteInfo(null);
            }
        };
        loadRoute();
    }, [booking]);

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
                            {UI_LABELS.BOOKING.buyer_form.summary.total}: {formatNumber(booking?.total_price || 0)} {currencySymbol}
                        </Typography>
                        <Button
                            variant='contained'
                            color='orange'
                            href='https://yoomoney.ru/'
                            target='_blank'
                        >
                            Оплатить через YooMoney
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </Base>
    );
};

export default Payment;
