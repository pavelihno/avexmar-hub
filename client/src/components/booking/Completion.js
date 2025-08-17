import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
        Box,
        Card,
        CardContent,
        Typography,
        Grid,
        Accordion,
        AccordionSummary,
        AccordionDetails,
        Table,
        TableHead,
        TableRow,
        TableCell,
        TableBody,
        Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, fetchCompletionDetails } from '../../redux/actions/bookingProcess';
import { fetchPayment } from '../../redux/actions/payment';
import { ENUM_LABELS, UI_LABELS, FIELD_LABELS } from '../../constants';
import { formatNumber, formatDate, formatTime, formatDuration, extractRouteInfo } from '../utils';

const Completion = () => {
        const { publicId } = useParams();
        const dispatch = useDispatch();
        const booking = useSelector((state) => state.bookingProcess.current);
        const completion = useSelector((state) => state.bookingProcess.completion);
        const payment = useSelector((state) => state.payment.current);

        useEffect(() => {
                dispatch(fetchBookingDetails(publicId));
                dispatch(fetchCompletionDetails(publicId));
                dispatch(fetchPayment(publicId));
        }, [dispatch, publicId]);

        const [outboundFlight = null, returnFlight = null] = booking?.flights ?? [];
        const outboundRouteInfo = extractRouteInfo(outboundFlight);
        const returnRouteInfo = extractRouteInfo(returnFlight);

        const flightMap = { outbound: outboundRouteInfo, return: returnRouteInfo };

        const tariffMap = useMemo(() => {
                const dirs = booking?.price_details?.directions || [];
                return dirs.reduce((acc, d) => ({ ...acc, [d.direction]: d.tariff }), {});
        }, [booking?.price_details]);

        const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

        return (
                <Base maxWidth='lg'>
                        <BookingProgress activeStep='completion' />
                        <Grid container justifyContent='center' spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={9} lg={9}>
                                        <Card sx={{ mb: 2 }}>
                                                <CardContent>
                                                        <Typography variant='h5' sx={{ mb: 1 }}>
                                                                {UI_LABELS.BOOKING.completion_title || 'Бронирование завершено'}
                                                        </Typography>
                                                        {completion?.booking_number && (
                                                                <Typography variant='body1'>
                                                                        {FIELD_LABELS.BOOKING.booking_number}: {completion.booking_number}
                                                                </Typography>
                                                        )}
                                                </CardContent>
                                        </Card>

                                        {/* Flights */}
                                        {Array.isArray(booking?.flights) && booking.flights.length > 0 && (
                                                <Accordion variant='outlined' sx={{ mb: 2 }} defaultExpanded>
                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                                {outboundRouteInfo && (
                                                                        <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                                                                                {Object.keys(returnRouteInfo || {}).length > 0
                                                                                        ? UI_LABELS.BOOKING.flight_details.from_to_from(
                                                                                                  outboundRouteInfo.from,
                                                                                                  outboundRouteInfo.to,
                                                                                          )
                                                                                        : UI_LABELS.BOOKING.flight_details.from_to(
                                                                                                  outboundRouteInfo.from,
                                                                                                  outboundRouteInfo.to,
                                                                                          )}
                                                                        </Typography>
                                                                )}
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                                <Grid container spacing={2}>
                                                                        {booking.flights.map((f, idx) => {
                                                                                const origin = f.route?.origin_airport || {};
                                                                                const dest = f.route?.destination_airport || {};
                                                                                const depDate = formatDate(f.scheduled_departure);
                                                                                const depTime = formatTime(f.scheduled_departure);
                                                                                const arrDate = formatDate(f.scheduled_arrival);
                                                                                const arrTime = formatTime(f.scheduled_arrival);
                                                                                const duration = formatDuration(f.duration);
                                                                                const airline = f.airline?.name || '';
                                                                                const flightNo = f.flight_number || '';
                                                                                const aircraft = f.aircraft?.type || '';
                                                                                const direction = idx === 0 ? 'outbound' : 'return';
                                                                                const tariff = tariffMap[direction];

                                                                                return (
                                                                                        <Grid item xs={12} md={6} key={f.id || idx}>
                                                                                                <Card>
                                                                                                        <CardContent>
                                                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                                                                        <Typography variant='subtitle2'>{airline}</Typography>
                                                                                                                        <Typography variant='caption' color='text.secondary'>
                                                                                                                                {flightNo}
                                                                                                                        </Typography>
                                                                                                                </Box>
                                                                                                                {tariff && (
                                                                                                                        <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                                                                                                                                {`${ENUM_LABELS.SEAT_CLASS[tariff.seat_class]} — ${tariff.title}`}
                                                                                                                        </Typography>
                                                                                                                )}
                                                                                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 1, alignItems: 'center' }}>
                                                                                                                        <Box>
                                                                                                                                <Typography variant='h6'>{depTime}</Typography>
                                                                                                                                <Typography variant='caption' color='text.secondary'>{depDate}</Typography>
                                                                                                                                <Typography variant='body2'>{origin.city_name}</Typography>
                                                                                                                                <Typography variant='caption' color='text.secondary'>{origin.iata_code}</Typography>
                                                                                                                        </Box>
                                                                                                                        <Box sx={{ textAlign: 'center' }}>
                                                                                                                                <Typography variant='caption' color='text.secondary'>{duration}</Typography>
                                                                                                                                <Divider flexItem sx={{ my: 0.5 }} />
                                                                                                                        </Box>
                                                                                                                        <Box sx={{ textAlign: 'right' }}>
                                                                                                                                <Typography variant='h6'>{arrTime}</Typography>
                                                                                                                                <Typography variant='caption' color='text.secondary'>{arrDate}</Typography>
                                                                                                                                <Typography variant='body2'>{dest.city_name}</Typography>
                                                                                                                                <Typography variant='caption' color='text.secondary'>{dest.iata_code}</Typography>
                                                                                                                        </Box>
                                                                                                                </Box>
                                                                                                                {aircraft && (
                                                                                                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                                                                                                                <Typography variant='caption' color='text.secondary'>
                                                                                                                                        {aircraft}
                                                                                                                                </Typography>
                                                                                                                        </Box>
                                                                                                                )}
                                                                                                        </CardContent>
                                                                                                </Card>
                                                                                        </Grid>
                                                                                );
                                                                        })}
                                                                </Grid>
                                                        </AccordionDetails>
                                                </Accordion>
                                        )}

                                        {/* Booking owner */}
                                        {booking && (
                                                <Accordion variant='outlined' sx={{ mb: 2 }}>
                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                                                                        {UI_LABELS.BOOKING.confirmation.buyer_title}
                                                                </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                                <Typography>
                                                                        {`${booking.buyer_last_name || ''} ${booking.buyer_first_name || ''}, ${booking.email_address}, ${booking.phone_number}`}
                                                                </Typography>
                                                        </AccordionDetails>
                                                </Accordion>
                                        )}

                                        {/* Price Details */}
                                        {booking && (
                                                <Accordion variant='outlined' sx={{ mb: 2 }} defaultExpanded>
                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Typography variant='subtitle1' sx={{ fontWeight: 'bold', textDecoration: 'underline', mr: 1 }}>
                                                                                {`${UI_LABELS.BOOKING.confirmation.price_title}:`}
                                                                        </Typography>
                                                                        <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                                                                                {`${formatNumber(booking.price_details?.total_price || 0)} ${currencySymbol}`}
                                                                        </Typography>
                                                                </Box>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                                <Box sx={{ mb: 4 }}>
                                                                        {(booking.price_details?.directions || []).map((dir) => {
                                                                                const info = flightMap[dir.direction] || {};
                                                                                return (
                                                                                        <Box key={dir.direction} sx={{ mb: 2 }}>
                                                                                                <Box sx={{ mb: 1 }}>
                                                                                                        <Typography variant='subtitle1' sx={{ fontWeight: 500, mb: 0.5 }}>
                                                                                                                {UI_LABELS.SCHEDULE.from_to(info.from, info.to)}
                                                                                                        </Typography>
                                                                                                        <Typography variant='subtitle2' color='text.secondary'>
                                                                                                                {`${ENUM_LABELS.SEAT_CLASS[dir.tariff.seat_class]} — ${dir.tariff.title}`}
                                                                                                        </Typography>
                                                                                                </Box>
                                                                                                <Table size='small'>
                                                                                                        <TableHead>
                                                                                                                <TableRow>
                                                                                                                        <TableCell>{UI_LABELS.BOOKING.buyer_form.summary.tickets}</TableCell>
                                                                                                                        <TableCell align='right'>{FIELD_LABELS.BOOKING.fare_price}</TableCell>
                                                                                                                        <TableCell align='right'>{FIELD_LABELS.BOOKING.total_discounts}</TableCell>
                                                                                                                        <TableCell align='right'>{FIELD_LABELS.BOOKING.total_price}</TableCell>
                                                                                                                </TableRow>
                                                                                                        </TableHead>
                                                                                                        <TableBody>
                                                                                                                {dir.passengers.map((p) => (
                                                                                                                        <TableRow key={p.category}>
                                                                                                                                <TableCell>{`${UI_LABELS.BOOKING.confirmation.passenger_categories[p.category] || p.category} x ${p.count}`}</TableCell>
                                                                                                                                <TableCell align='right'>{`${formatNumber(p.fare_price)} ${currencySymbol}`}</TableCell>
                                                                                                                                <TableCell align='right'>
                                                                                                                                        {p.discount > 0
                                                                                                                                                ? `- ${formatNumber(p.discount)} ${currencySymbol}${p.discount_name ? ` (${p.discount_name})` : ''}`
                                                                                                                                                : '-'}
                                                                                                                                </TableCell>
                                                                                                                                <TableCell align='right'>{`${formatNumber(p.total_price)} ${currencySymbol}`}</TableCell>
                                                                                                                        </TableRow>
                                                                                                                ))}
                                                                                                        </TableBody>
                                                                                                </Table>
                                                                                        </Box>
                                                                                );
                                                                        })}
                                                                </Box>

                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                        <Typography>{UI_LABELS.BOOKING.buyer_form.summary.tickets}</Typography>
                                                                        <Typography>{`${formatNumber(booking.price_details?.fare_price || 0)} ${currencySymbol}`}</Typography>
                                                                </Box>
                                                                {booking.price_details?.fees?.length > 0 &&
                                                                        booking.price_details.fees.map((fee, idx) => (
                                                                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                                        <Typography>{fee.name}</Typography>
                                                                                        <Typography>{`${formatNumber(fee.total)} ${currencySymbol}`}</Typography>
                                                                                </Box>
                                                                        ))}
                                                                {booking.price_details?.total_discounts > 0 && (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                                <Typography>{UI_LABELS.BOOKING.buyer_form.summary.discount}</Typography>
                                                                                <Typography>{`- ${formatNumber(booking.price_details.total_discounts)} ${currencySymbol}`}</Typography>
                                                                        </Box>
                                                                )}
                                                        </AccordionDetails>
                                                </Accordion>
                                        )}

                                        {/* Payment details */}
                                        {payment && (
                                                <Accordion variant='outlined' sx={{ mb: 2 }} defaultExpanded>
                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                                                                        {UI_LABELS.BOOKING.payment_details || 'Детали оплаты'}
                                                                </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                        <Typography>{FIELD_LABELS.PAYMENT.amount}</Typography>
                                                                        <Typography>{`${formatNumber(payment.amount || 0)} ${currencySymbol}`}</Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                        <Typography>{FIELD_LABELS.PAYMENT.method}</Typography>
                                                                        <Typography>
                                                                                {ENUM_LABELS.PAYMENT_METHOD[payment.payment_method] || payment.payment_method}
                                                                        </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                        <Typography>{FIELD_LABELS.PAYMENT.status}</Typography>
                                                                        <Typography>
                                                                                {ENUM_LABELS.PAYMENT_STATUS[payment.payment_status] || payment.payment_status}
                                                                        </Typography>
                                                                </Box>
                                                                {payment.provider_payment_id && (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                                <Typography>{FIELD_LABELS.PAYMENT.transaction_id}</Typography>
                                                                                <Typography>{payment.provider_payment_id}</Typography>
                                                                        </Box>
                                                                )}
                                                                {payment.metadata?.paid_at && (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                                <Typography>{FIELD_LABELS.PAYMENT.payment_date}</Typography>
                                                                                <Typography>{formatDate(payment.metadata.paid_at)}</Typography>
                                                                        </Box>
                                                                )}
                                                        </AccordionDetails>
                                                </Accordion>
                                        )}
                                </Grid>
                        </Grid>
                </Base>
        );
};

export default Completion;
