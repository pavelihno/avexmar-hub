import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, fetchBookingDirectionsInfo } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber } from '../utils';

const Payment = () => {
    const { publicId } = useParams();
    const dispatch = useDispatch();
    const booking = useSelector((state) => state.bookingProcess.current);
    const directionsInfo = useSelector((state) => state.bookingProcess.current?.directionsInfo || {});

    useEffect(() => {
        dispatch(fetchBookingDetails(publicId));
    }, [dispatch, publicId]);

    useEffect(() => {
        if (booking?.directions) {
            dispatch(fetchBookingDirectionsInfo(booking.directions));
        }
    }, [dispatch, booking]);

    const firstDir = booking?.directions ? booking.directions[0]?.direction : null;
    const info = firstDir ? directionsInfo[firstDir] : null;
    const routeInfo = info ? UI_LABELS.SCHEDULE.from_to(info.from, info.to) : null;
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
