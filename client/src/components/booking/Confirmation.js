import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber } from '../utils';
import { serverApi } from '../../api';

const Confirmation = () => {
    const { publicId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const booking = useSelector((state) => state.bookingProcess.current);
    const [directionsInfo, setDirectionsInfo] = useState({});

    useEffect(() => {
        dispatch(fetchBookingDetails(publicId));
    }, [dispatch, publicId]);

    useEffect(() => {
        const loadInfo = async () => {
            if (!booking?.directions) return;
            const info = {};
            await Promise.all(
                booking.directions.map(async (d) => {
                    try {
                        const flight = (await serverApi.get(`/flights/${d.flight_id}`)).data;
                        const route = (await serverApi.get(`/routes/${flight.route_id}`)).data;
                        const origin = (await serverApi.get(`/airports/${route.origin_airport_id}`)).data;
                        const dest = (await serverApi.get(`/airports/${route.destination_airport_id}`)).data;
                        info[d.direction] = {
                            from: origin.city || origin.iata_code,
                            to: dest.city || dest.iata_code,
                        };
                    } catch (e) {
                        // ignore fetching errors
                    }
                })
            );
            setDirectionsInfo(info);
        };
        loadInfo();
    }, [booking]);

    const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

    const handlePayment = () => {
        navigate(`/booking/${publicId}/payment`);
    };

    return (
        <Base maxWidth='lg'>
            <BookingProgress activeStep='confirmation' />
            <Box sx={{ mt: 2 }}>
                {booking?.directions?.map((dir) => {
                    const info = directionsInfo[dir.direction] || {};
                    return (
                        <Card key={dir.direction} sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant='h6' sx={{ mb: 1 }}>
                                    {UI_LABELS.SCHEDULE.from_to(info.from, info.to) || dir.direction}
                                </Typography>
                                <Table size='small'>
                                    <TableBody>
                                        {dir.passengers.map((p) => (
                                            <TableRow key={p.category}>
                                                <TableCell>{`${ENUM_LABELS.PASSENGER_CATEGORY[p.category] || p.category} x${p.count}`}</TableCell>
                                                <TableCell align='right'>{`${formatNumber(p.fare_price)} ${currencySymbol}`}</TableCell>
                                                {p.discount > 0 && (
                                                    <TableCell align='right'>{`- ${formatNumber(p.discount)} ${currencySymbol}`}</TableCell>
                                                )}
                                                <TableCell align='right'>{`${formatNumber(p.total_price)} ${currencySymbol}`}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}

                {booking?.fees && booking.fees.length > 0 && (
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            {booking.fees.map((f) => (
                                <Box key={f.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography>{f.name}</Typography>
                                    <Typography>{`${formatNumber(f.total)} ${currencySymbol}`}</Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>{UI_LABELS.BOOKING.buyer_form.summary.tickets}</Typography>
                            <Typography>{`${formatNumber(booking?.fare_price || 0)} ${currencySymbol}`}</Typography>
                        </Box>
                        {booking?.total_discounts > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>{UI_LABELS.BOOKING.buyer_form.summary.discount}</Typography>
                                <Typography>{`- ${formatNumber(booking.total_discounts)} ${currencySymbol}`}</Typography>
                            </Box>
                        )}
                        {booking?.fees > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>{UI_LABELS.BOOKING.buyer_form.summary.service_fee}</Typography>
                                <Typography>{`${formatNumber(booking.fees)} ${currencySymbol}`}</Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant='h6'>
                                {UI_LABELS.BOOKING.buyer_form.summary.total}
                            </Typography>
                            <Typography variant='h6'>{`${formatNumber(booking?.total_price || 0)} ${currencySymbol}`}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Button variant='contained' color='orange' onClick={handlePayment}>
                    Перейти к оплате
                </Button>
            </Box>
        </Base>
    );
};

export default Confirmation;
