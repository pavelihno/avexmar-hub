import React, { useEffect, useMemo, useState } from 'react';
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
	TableHead,
	TableRow,
	TableCell,
	Grid,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, confirmBooking, fetchBookingAccess } from '../../redux/actions/bookingProcess';
import { createPayment } from '../../redux/actions/payment';
import { ENUM_LABELS, UI_LABELS, FIELD_LABELS } from '../../constants';
import { formatNumber, formatDate, formatTime, formatDuration, extractRouteInfo } from '../utils';

const Confirmation = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { current: booking, isLoading: bookingLoading } = useSelector((state) => state.bookingProcess);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
	}, [dispatch, publicId]);

	const [outboundFlight = null, returnFlight = null] = booking?.flights ?? [];

	const outboundRouteInfo = extractRouteInfo(outboundFlight);
	const returnRouteInfo = extractRouteInfo(returnFlight);

	const flightMap = { outbound: outboundRouteInfo, return: returnRouteInfo };

	const tariffMap = useMemo(() => {
		const dirs = booking?.price_details?.directions || [];
		return dirs.reduce((acc, d) => ({ ...acc, [d.direction]: d.tariff }), {});
	}, [booking?.price_details]);

	useEffect(() => {
		if (outboundRouteInfo) {
			document.title = UI_LABELS.SEARCH.from_to_date(
				outboundRouteInfo.from,
				outboundRouteInfo.to,
				outboundRouteInfo.date,
				returnRouteInfo.date
			);
		}
	}, [outboundRouteInfo, returnRouteInfo]);

	const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

	const handlePayment = async () => {
		setLoading(true);
		try {
			await dispatch(confirmBooking(publicId)).unwrap();
			await dispatch(createPayment({ public_id: publicId })).unwrap();
			await dispatch(fetchBookingAccess(publicId)).unwrap();
			navigate(`/booking/${publicId}/payment`);
		} catch (e) {
			// errors handled via redux state
			setLoading(false);
		}
	};

	if (bookingLoading || !booking) {
		return (
			<Base maxWidth='lg'>
				<BookingProgress activeStep='confirmation' />
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
					<CircularProgress />
				</Box>
			</Base>
		);
	}

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='confirmation' />
			<Grid container justifyContent='center' spacing={2} sx={{ mb: 2 }}>
				<Grid item xs={12} md={9} lg={9}>
					{/* Flights */}
					{Array.isArray(booking?.flights) && booking.flights.length > 0 && (
						<Accordion variant='outlined' sx={{ mb: 2 }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								{outboundRouteInfo && (
									<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
										{Object.keys(returnRouteInfo || {}).length > 0
											? UI_LABELS.BOOKING.flight_details.from_to_from(
													outboundRouteInfo.from,
													outboundRouteInfo.to
											  )
											: UI_LABELS.BOOKING.flight_details.from_to(
													outboundRouteInfo.from,
													outboundRouteInfo.to
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
										const depTime = formatTime(f.scheduled_departure_time);
										const arrDate = formatDate(f.scheduled_arrival);
										const arrTime = formatTime(f.scheduled_arrival_time);
										const duration = formatDuration(f.duration);
										const airline = f.airline?.name || '';
										const flightNo = f.airline_flight_number || f.flight_number || '';
										const aircraft = f.aircraft?.type;
										const direction = idx === 0 ? 'outbound' : 'return';
										const tariff = tariffMap[direction];

										return (
											<Grid item xs={12} md={6} key={f.id || idx}>
												<Card>
													<CardContent>
														<Box
															sx={{
																display: 'flex',
																justifyContent: 'space-between',
																alignItems: 'center',
																mb: 0.5,
															}}
														>
															<Typography variant='subtitle2'>{airline}</Typography>
															<Typography variant='caption' color='text.secondary'>
																{flightNo}
															</Typography>
														</Box>
														{tariff && (
															<Typography
																variant='caption'
																color='text.secondary'
																sx={{ mb: 0.5, display: 'block' }}
															>
																{`${ENUM_LABELS.SEAT_CLASS[tariff.seat_class]} — ${
																	tariff.title
																}`}
															</Typography>
														)}
														<Box
															sx={{
																display: 'grid',
																gridTemplateColumns: '1fr auto 1fr',
																gap: 1,
																alignItems: 'center',
															}}
														>
															<Box>
																<Typography variant='h6'>{depTime}</Typography>
																<Typography variant='caption' color='text.secondary'>
																	{depDate}
																</Typography>
																<Typography variant='body2'>
																	{origin.city_name}
																</Typography>
																<Typography variant='caption' color='text.secondary'>
																	{origin.iata_code}
																</Typography>
															</Box>
															<Box sx={{ textAlign: 'center' }}>
																<Typography variant='caption' color='text.secondary'>
																	{duration}
																</Typography>
																<Divider flexItem sx={{ my: 0.5 }} />
															</Box>
															<Box sx={{ textAlign: 'right' }}>
																<Typography variant='h6'>{arrTime}</Typography>
																<Typography variant='caption' color='text.secondary'>
																	{arrDate}
																</Typography>
																<Typography variant='body2'>
																	{dest.city_name}
																</Typography>
																<Typography variant='caption' color='text.secondary'>
																	{dest.iata_code}
																</Typography>
															</Box>
														</Box>
														{aircraft && (
															<Box
																sx={{
																	display: 'flex',
																	justifyContent: 'center',
																	mt: 0.5,
																}}
															>
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
									{booking.flights.length === 1 && <Grid item xs={12} md={6} />}
								</Grid>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Passengers */}
					{Array.isArray(booking?.passengers) && booking.passengers.length > 0 && (
						<Accordion variant='outlined' sx={{ mb: 2 }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.BOOKING.confirmation.passengers_title}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Table size='small' sx={{ mb: 4 }}>
									<TableHead>
										<TableRow>
											<TableCell>
												{UI_LABELS.BOOKING.confirmation.passenger_columns.name}
											</TableCell>
											<TableCell>
												{UI_LABELS.BOOKING.confirmation.passenger_columns.birth_date}
											</TableCell>
											<TableCell>
												{UI_LABELS.BOOKING.confirmation.passenger_columns.gender}
											</TableCell>
											<TableCell>
												{UI_LABELS.BOOKING.confirmation.passenger_columns.document}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{booking.passengers.map((p, idx) => (
											<TableRow key={p.id || idx}>
												<TableCell>{`${p.last_name || ''} ${p.first_name || ''}`}</TableCell>
												<TableCell>{formatDate(p.birth_date)}</TableCell>
												<TableCell>{ENUM_LABELS.GENDER_SHORT[p.gender]}</TableCell>
												<TableCell>{`${ENUM_LABELS.DOCUMENT_TYPE[p.document_type]}, ${
													p.document_number || ''
												}`}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								<Box sx={{ display: 'flex' }}>
									<Typography variant='subtitle1' sx={{ mr: 1 }}>
										{`${UI_LABELS.BOOKING.confirmation.buyer_title}:`}
									</Typography>
									<Typography>
										{`${booking.buyer_last_name || ''} ${booking.buyer_first_name || ''}, ${
											booking.email_address
										}, ${booking.phone_number}`}
									</Typography>
								</Box>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Price Details */}
					{booking && (
						<Accordion variant='outlined' sx={{ mb: 2 }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<Typography
										variant='subtitle1'
										sx={{ fontWeight: 'bold', textDecoration: 'underline', mr: 1 }}
									>
										{`${UI_LABELS.BOOKING.confirmation.price_title}:`}
									</Typography>
									<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
										{`${formatNumber(booking.price_details?.total_price || 0)} ${currencySymbol}`}
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<Box sx={{ mb: 4 }}>
									{(booking.price_details?.directions || []).map((dir, idx) => {
										const info = flightMap[dir.direction] || {};
										return (
											<Box key={dir.direction} sx={{ mb: 2 }}>
												<Box sx={{ mb: 1 }}>
													<Typography variant='subtitle1' sx={{ fontWeight: 500, mb: 0.5 }}>
														{UI_LABELS.SCHEDULE.from_to(info.from, info.to)}
													</Typography>
													<Typography variant='subtitle2' color='text.secondary'>
														{`${ENUM_LABELS.SEAT_CLASS[dir.tariff.seat_class]} — ${
															dir.tariff.title
														}`}
													</Typography>
												</Box>
												<Table size='small'>
													<TableHead>
														<TableRow>
															<TableCell>
																{UI_LABELS.BOOKING.buyer_form.summary.tickets}
															</TableCell>
															<TableCell align='right'>
																{FIELD_LABELS.BOOKING.fare_price}
															</TableCell>
															<TableCell align='right'>
																{FIELD_LABELS.BOOKING.total_discounts}
															</TableCell>
															<TableCell align='right'>
																{FIELD_LABELS.BOOKING.total_price}
															</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{dir.passengers.map((p) => (
															<TableRow key={p.category}>
																<TableCell>{`${
																	UI_LABELS.BOOKING.confirmation.passenger_categories[
																		p.category
																	] || p.category
																} x ${p.count}`}</TableCell>
																<TableCell align='right'>{`${formatNumber(
																	p.fare_price
																)} ${currencySymbol}`}</TableCell>
																<TableCell align='right'>
																	{p.discount > 0
																		? `- ${formatNumber(
																				p.discount
																		  )} ${currencySymbol}${
																				p.discount_name
																					? ` (${p.discount_name})`
																					: ''
																		  }`
																		: '-'}
																</TableCell>
																<TableCell align='right'>{`${formatNumber(
																	p.total_price
																)} ${currencySymbol}`}</TableCell>
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
									<Typography>
										{`${formatNumber(booking.price_details?.fare_price || 0)} ${currencySymbol}`}
									</Typography>
								</Box>
								{booking.price_details?.fees?.length > 0 &&
									booking.price_details?.fees.map((fee, idx) => (
										<Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
											<Typography>{fee.name}</Typography>
											<Typography>{`${formatNumber(fee.total)} ${currencySymbol}`}</Typography>
										</Box>
									))}
								{booking.price_details?.total_discounts > 0 && (
									<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
										<Typography>{UI_LABELS.BOOKING.buyer_form.summary.discount}</Typography>
										<Typography>
											{`- ${formatNumber(
												booking.price_details.total_discounts
											)} ${currencySymbol}`}
										</Typography>
									</Box>
								)}
							</AccordionDetails>
						</Accordion>
					)}

					{/* Payment button */}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Button variant='contained' color='orange' onClick={handlePayment} disabled={loading}>
							{loading ? (
								<CircularProgress size={24} color='inherit' />
							) : (
								UI_LABELS.BOOKING.confirmation.payment_button
							)}
						</Button>
					</Box>
				</Grid>
			</Grid>
		</Base>
	);
};

export default Confirmation;
