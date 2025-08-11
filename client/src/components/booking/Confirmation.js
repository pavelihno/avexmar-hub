import React, { useEffect } from 'react';
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
import { fetchBookingDetails, fetchBookingDirectionsInfo, confirmBooking, fetchBookingAccess } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber, formatDate, formatTime, formatDuration } from '../utils';

const Confirmation = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
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

	const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

        const handlePayment = async () => {
                try {
                        await dispatch(confirmBooking(publicId)).unwrap();
                        await dispatch(fetchBookingAccess(publicId)).unwrap();
                        navigate(`/booking/${publicId}/payment`);
                } catch (e) {
                        // errors handled via redux state
                }
        };

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='confirmation' />
                        <Box sx={{ mt: 2 }}>
                                {Array.isArray(booking?.flights) && booking.flights.length > 0 && (
                                        <Card sx={{ mb: 2 }}>
                                                <CardContent>
                                                        <Typography variant='h6' sx={{ mb: 1 }}>
                                                                {UI_LABELS.BOOKING.flight_details.title}
                                                        </Typography>
                                                        {booking.flights.map((f, idx) => {
                                                                const origin = f.route?.origin_airport || {};
                                                                const dest = f.route?.destination_airport || {};
                                                                const depDate = formatDate(f.scheduled_departure);
                                                                const depTime = formatTime(f.scheduled_departure_time);
                                                                const arrDate = formatDate(f.scheduled_arrival);
                                                                const arrTime = formatTime(f.scheduled_arrival_time);
                                                                const duration = formatDuration(f.duration);
                                                                const airline = f.airline?.name || '';
                                                                const flightNo = f.airline_flight_number || f.flight_number || '';
                                                                return (
                                                                        <Box key={f.id || idx} sx={{ mb: idx < booking.flights.length - 1 ? 2 : 0 }}>
                                                                                <Typography variant='subtitle2'>{UI_LABELS.BOOKING.flight_details.from_to(origin.iata_code, dest.iata_code)}</Typography>
                                                                                <Typography variant='body2' color='text.secondary'>
                                                                                        {airline} {flightNo}
                                                                                </Typography>
                                                                                <Typography variant='body2'>
                                                                                        {depDate} {depTime} → {arrDate} {arrTime}
                                                                                </Typography>
                                                                                <Typography variant='body2'>
                                                                                        {duration}
                                                                                </Typography>
                                                                        </Box>
                                                                );
                                                        })}
                                                </CardContent>
                                        </Card>
                                )}

                                {Array.isArray(booking?.passengers) && booking.passengers.length > 0 && (
                                        <Card sx={{ mb: 2 }}>
                                                <CardContent>
                                                        <Typography variant='h6' sx={{ mb: 1 }}>
                                                                {UI_LABELS.BOOKING.progress_steps.passengers}
                                                        </Typography>
                                                        <Table size='small'>
                                                                <TableBody>
                                                                        {booking.passengers.map((p, idx) => (
                                                                                <TableRow key={p.id || idx}>
                                                                                        <TableCell>{`${p.last_name || ''} ${p.first_name || ''}`}</TableCell>
                                                                                        <TableCell>{ENUM_LABELS.PASSENGER_CATEGORY[p.category] || p.category}</TableCell>
                                                                                        <TableCell>{p.document_number}</TableCell>
                                                                                </TableRow>
                                                                        ))}
                                                                </TableBody>
                                                        </Table>
                                                </CardContent>
                                        </Card>
                                )}

                                {booking && (
                                        <Card sx={{ mb: 2 }}>
                                                <CardContent>
                                                        <Typography variant='h6' sx={{ mb: 1 }}>
                                                                {UI_LABELS.BOOKING.buyer_form.title}
                                                        </Typography>
                                                        <Typography>{`${booking.buyer_last_name || ''} ${booking.buyer_first_name || ''}`}</Typography>
                                                        <Typography>{booking.email_address}</Typography>
                                                        <Typography>{booking.phone_number}</Typography>
                                                </CardContent>
                                        </Card>
                                )}

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
												<TableCell>{`${
													ENUM_LABELS.PASSENGER_CATEGORY[p.category] || p.category
												} x${p.count}`}</TableCell>
												<TableCell align='right'>{`${formatNumber(
													p.fare_price
												)} ${currencySymbol}`}</TableCell>
												{p.discount > 0 && (
													<TableCell align='right'>{`- ${formatNumber(
														p.discount
													)} ${currencySymbol}`}</TableCell>
												)}
												<TableCell align='right'>{`${formatNumber(
													p.total_price
												)} ${currencySymbol}`}</TableCell>
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
								<Typography>{`- ${formatNumber(
									booking.total_discounts
								)} ${currencySymbol}`}</Typography>
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
							<Typography variant='h6'>{UI_LABELS.BOOKING.buyer_form.summary.total}</Typography>
							<Typography variant='h6'>{`${formatNumber(
								booking?.total_price || 0
							)} ${currencySymbol}`}</Typography>
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
