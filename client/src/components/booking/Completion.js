import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography } from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { UI_LABELS } from '../../constants';
import { fetchCompletionDetails } from '../../redux/actions/bookingProcess';

const Completion = () => {
        const { publicId } = useParams();
        const dispatch = useDispatch();
        const completion = useSelector((state) => state.bookingProcess.completion);

        useEffect(() => {
                dispatch(fetchCompletionDetails(publicId));
        }, [dispatch, publicId]);

        return (
                <Base maxWidth='lg'>
                        <BookingProgress activeStep='completion' />
                        <Card sx={{ mt: 2 }}>
                                <CardContent>
                                        <Typography variant='h5' sx={{ mb: 2 }}>
                                                {UI_LABELS.BOOKING.completion_title || 'Booking completed'}
                                        </Typography>
                                        {completion && (
                                                <Typography variant='body1'>
                                                        {UI_LABELS.BOOKING.booking_number || 'Booking number'}: {completion.booking_number}
                                                </Typography>
                                        )}
                                </CardContent>
                        </Card>
                </Base>
        );
};

export default Completion;
