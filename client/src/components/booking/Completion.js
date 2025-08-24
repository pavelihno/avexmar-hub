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
	Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, downloadBookingPdf } from '../../redux/actions/bookingProcess';
import { fetchPayment } from '../../redux/actions/payment';
import { ENUM_LABELS, UI_LABELS, FIELD_LABELS } from '../../constants';
import { formatNumber, extractRouteInfo, formatDate, formatDateTime } from '../utils';
import PassengersTable from './PassengersTable';
import PriceDetailsTable from './PriceDetailsTable';
import FlightDetailsCard from './FlightDetailsCard';

const Completion = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const { current: booking, isLoading: bookingLoading } = useSelector((state) => state.bookingProcess);
	const payment = useSelector((state) => state.payment.current);

	const handleDownloadPdf = async () => {
		try {
			const data = await dispatch(downloadBookingPdf(publicId)).unwrap();
			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
			link.download = `booking_${booking.booking_number}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			// ignore
		}
	};

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
		dispatch(fetchPayment(publicId));
	}, [dispatch, publicId]);

	const [outboundFlight = null, returnFlight = null] = booking?.flights ?? [];
	const outboundRouteInfo = extractRouteInfo(outboundFlight);
	const returnRouteInfo = extractRouteInfo(returnFlight);

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

	const flightMap = { outbound: outboundRouteInfo, return: returnRouteInfo };

	const tariffMap = useMemo(() => {
		const dirs = booking?.price_details?.directions || [];
		return dirs.reduce((acc, d) => ({ ...acc, [d.direction]: d.tariff }), {});
	}, [booking?.price_details]);

	const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

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
			<BookingProgress activeStep='completion' />
			<Grid container justifyContent='center' spacing={2} sx={{ mb: 2 }}>
				<Grid item xs={12} md={9} lg={9}>
					<Card sx={{ mb: 2 }}>
						<CardContent>
							<Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
								{UI_LABELS.BOOKING.completion.title}
							</Typography>
							{booking?.booking_number && (
								<Typography variant='subtitle1'>
									{FIELD_LABELS.BOOKING.booking_number}: {booking.booking_number}
								</Typography>
							)}

							<Button variant='outlined' sx={{ mt: 2 }} onClick={handleDownloadPdf}>
								Скачать PDF
							</Button>
						</CardContent>
					</Card>

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
								<FlightDetailsCard flights={booking.flights} tariffMap={tariffMap} />
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
								<PassengersTable passengers={booking.passengers} />
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
										{`${UI_LABELS.BOOKING.completion.price_title}:`}
									</Typography>
									<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
										{`${formatNumber(booking.price_details?.final_price)} ${currencySymbol}`}
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<PriceDetailsTable
									priceDetails={booking.price_details}
									currencySymbol={currencySymbol}
									flightMap={flightMap}
								/>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Payment details */}
					{payment && (
						<Accordion variant='outlined' sx={{ mb: 2 }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.BOOKING.completion.payment_details}
								</Typography>
							</AccordionSummary>
							<AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
									<Typography sx={{ fontWeight: 'bold' }}>{FIELD_LABELS.PAYMENT.amount}</Typography>
									<Typography sx={{ fontWeight: 'bold' }}>{`${formatNumber(
										payment.amount
									)} ${currencySymbol}`}</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography>{UI_LABELS.BOOKING.completion.buyer}</Typography>
									<Typography>
										{`${booking.buyer_last_name || ''} ${booking.buyer_first_name || ''}`}
									</Typography>
								</Box>

								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography>{FIELD_LABELS.BOOKING.email_address}</Typography>
									<Typography>{booking.email_address}</Typography>
								</Box>

								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography>{FIELD_LABELS.BOOKING.phone_number}</Typography>
									<Typography>{booking.phone_number}</Typography>
								</Box>

								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography>{FIELD_LABELS.PAYMENT.method}</Typography>
									<Typography>
										{ENUM_LABELS.PAYMENT_METHOD[payment.payment_method] || payment.payment_method}
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography>{FIELD_LABELS.PAYMENT.status}</Typography>
									<Typography>
										{ENUM_LABELS.PAYMENT_STATUS[payment.payment_status] || payment.payment_status}
									</Typography>
								</Box>
								{payment.provider_payment_id && (
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography>{FIELD_LABELS.PAYMENT.transaction_id}</Typography>
										<Typography>{payment.provider_payment_id}</Typography>
									</Box>
								)}
								{payment.paid_at && (
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography>{FIELD_LABELS.PAYMENT.payment_date}</Typography>
										<Typography>{formatDate(payment.paid_at)}</Typography>
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
