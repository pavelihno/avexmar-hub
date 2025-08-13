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
	TableHead,
	TableRow,
	TableCell,
	Grid,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, confirmBooking, fetchBookingAccess } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS, FIELD_LABELS } from '../../constants';
import { formatNumber, formatDate, formatTime, formatDuration, extractRouteInfo } from '../utils';

const Confirmation = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const booking = useSelector((state) => state.bookingProcess.current);

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
	}, [dispatch, publicId]);

	const [outboundFlight = null, returnFlight = null] = booking?.flights ?? [];

	const outboundRouteInfo = extractRouteInfo(outboundFlight);
	const returnRouteInfo = extractRouteInfo(returnFlight);

	const flightMap = { outbound: outboundRouteInfo, return: returnRouteInfo };

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
		try {
			await dispatch(confirmBooking(publicId)).unwrap();
			await dispatch(fetchBookingAccess(publicId)).unwrap();
			navigate(`/booking/${publicId}/payment`);
		} catch (e) {
			// errors handled via redux state
		}
	};

	return (
		<Base maxWidth='md'>
			<BookingProgress activeStep='confirmation' />
			<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', rowGap: 2 }}>
				{/* Flights */}
				{Array.isArray(booking?.flights) && booking.flights.length > 0 && (
					<Accordion variant='outlined'>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant='subtitle1'>
								{outboundRouteInfo
									? returnRouteInfo
										? UI_LABELS.BOOKING.flight_details.from_to_from(
												outboundRouteInfo.from,
												outboundRouteInfo.to
										  )
										: UI_LABELS.BOOKING.flight_details.from_to(
												outboundRouteInfo.from,
												outboundRouteInfo.to
										  )
									: UI_LABELS.BOOKING.flight_details.title}
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							{/* flight cards */}
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
															<Typography variant='body2'>{origin.city_name}</Typography>
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
															<Typography variant='body2'>{dest.city_name}</Typography>
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
					<Accordion variant='outlined'>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant='subtitle1'>{UI_LABELS.BOOKING.progress_steps.passengers}</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell>{UI_LABELS.BOOKING.confirmation.passenger_column}</TableCell>
										<TableCell>{FIELD_LABELS.PASSENGER.birth_date}</TableCell>
										<TableCell>{FIELD_LABELS.PASSENGER.gender}</TableCell>
										<TableCell>{`${FIELD_LABELS.PASSENGER.document_type}, ${FIELD_LABELS.PASSENGER.document_number}`}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{booking.passengers.map((p, idx) => (
										<TableRow key={p.id || idx}>
											<TableCell>{`${p.last_name || ''} ${p.first_name || ''} ${
												p.patronymic_name || ''
											}`}</TableCell>
											<TableCell>{formatDate(p.birth_date)}</TableCell>
											<TableCell>{ENUM_LABELS.GENDER_SHORT[p.gender] || p.gender}</TableCell>
											<TableCell>{`${
												ENUM_LABELS.DOCUMENT_TYPE[p.document_type] || p.document_type
											} ${p.document_number || ''}`}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<Box sx={{ mt: 2 }}>
								<Typography>{`${booking.buyer_last_name || ''} ${
									booking.buyer_first_name || ''
								}`}</Typography>
								<Typography>{booking.email_address}</Typography>
								<Typography>{booking.phone_number}</Typography>
							</Box>
						</AccordionDetails>
					</Accordion>
				)}

				{/* Price Details */}
				{booking && (
					<Accordion variant='outlined'>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant='subtitle1'>
								{UI_LABELS.BOOKING.buyer_form.summary.price_details}
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							{(booking.price_details?.directions || []).map((dir, idx) => {
								const info = flightMap[dir.direction] || {};
								return (
									<Box key={dir.direction} sx={{ mb: 2 }}>
										<Typography variant='subtitle1' sx={{ fontWeight: 500, mb: 0.5 }}>
											{UI_LABELS.SCHEDULE.from_to(info.from, info.to) || dir.direction} —{' '}
											{dir.tariff?.title}
										</Typography>
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
																? `- ${formatNumber(p.discount)} ${currencySymbol}${
																		p.discount_name ? ` (${p.discount_name})` : ''
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
										{idx < booking.price_details.directions.length - 1 && (
											<Divider sx={{ my: 2 }} />
										)}
									</Box>
								);
							})}

							{booking.price_details?.fees?.length > 0 && (
								<Table size='small'>
									<TableHead>
										<TableRow>
											<TableCell>{FIELD_LABELS.FEE.name}</TableCell>
											<TableCell align='right'>{FIELD_LABELS.FEE.amount}</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{booking.price_details.fees.map((f) => (
											<TableRow key={f.name}>
												<TableCell>{f.name}</TableCell>
												<TableCell align='right'>{`${formatNumber(
													f.total
												)} ${currencySymbol}`}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}

							<Divider sx={{ my: 1 }} />
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography>{UI_LABELS.BOOKING.buyer_form.summary.tickets}</Typography>
								<Typography>{`${formatNumber(
									booking.price_details?.fare_price || 0
								)} ${currencySymbol}`}</Typography>
							</Box>
							{booking.price_details?.total_discounts > 0 && (
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography>{UI_LABELS.BOOKING.buyer_form.summary.discount}</Typography>
									<Typography>{`- ${formatNumber(
										booking.price_details.total_discounts
									)} ${currencySymbol}`}</Typography>
								</Box>
							)}
							{booking.price_details?.fees?.length > 0 && (
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography>{UI_LABELS.BOOKING.buyer_form.summary.service_fee}</Typography>
									<Typography>{`${formatNumber(
										booking.price_details.fees.reduce((s, f) => s + f.total, 0)
									)} ${currencySymbol}`}</Typography>
								</Box>
							)}
							<Divider sx={{ my: 1 }} />
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant='h6'>{UI_LABELS.BOOKING.buyer_form.summary.total}</Typography>
								<Typography variant='h6'>{`${formatNumber(
									booking.price_details?.total_price || 0
								)} ${currencySymbol}`}</Typography>
							</Box>
						</AccordionDetails>
					</Accordion>
				)}

				{/* Payment button */}
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button variant='contained' color='orange' onClick={handlePayment}>
						{UI_LABELS.BOOKING.confirmation.payment_button}
					</Button>
				</Box>
			</Box>
		</Base>
	);
};

export default Confirmation;
