import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import {
	Box,
	Card,
	Typography,
	Grid2,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Button,
	CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, downloadBookingPdf, downloadItineraryPdf } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS, FIELD_LABELS, FILE_NAME_TEMPLATES } from '../../constants';
import { formatNumber, extractRouteInfo, formatDate } from '../utils';
import PassengersTable from './PassengersTable';
import PriceDetailsTable from './PriceDetailsTable';
import PaymentDetailsTable from './PaymentDetailsTable';
import FlightDetailsCard from './FlightDetailsCard';
import TicketsTable from './TicketsTable';

const Completion = () => {
	const { publicId } = useParams();
	const location = useLocation();
	const dispatch = useDispatch();
	const { current: booking, isLoading: bookingLoading } = useSelector((state) => state.bookingProcess);

	const accessToken = useMemo(() => new URLSearchParams(location.search).get('access_token'), [location.search]);

	const handleDownloadPdf = async () => {
		try {
			const data = await dispatch(downloadBookingPdf({ publicId, accessToken })).unwrap();
			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
			link.download = FILE_NAME_TEMPLATES.BOOKING_PDF(booking.booking_number);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			// ignore
		}
	};

	const handleDownloadItineraryPdf = async (flight) => {
		try {
			const data = await dispatch(
				downloadItineraryPdf({
					publicId,
					bookingFlightId: flight.booking_flight_id,
					accessToken,
				})
			).unwrap();
			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
			link.download = FILE_NAME_TEMPLATES.ITINERARY_PDF(
				booking.booking_number,
				flight.airline_flight_number,
				formatDate(flight.scheduled_departure)
			);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			// ignore
		}
	};

	useEffect(() => {
		dispatch(fetchBookingDetails({ publicId, accessToken }));
	}, [dispatch, publicId, accessToken]);

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
			<Grid2 container justifyContent='center' spacing={{ xs: 2, md: 4 }} sx={{ mb: 2, mt: 1 }}>
				<Grid2
					size={{
						xs: 12,
						md: 9,
						lg: 9,
					}}
				>
					<Card sx={{ p: { xs: 2, md: 3 } }}>
						<Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
							{UI_LABELS.BOOKING.completion.title}
						</Typography>

						<Typography variant='subtitle1'>
							{FIELD_LABELS.BOOKING.booking_number}: {booking.booking_number || '—'}
						</Typography>

						<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: { xs: 'column', sm: 'row' },
									gap: 1,
									flexWrap: 'wrap',
								}}
							>
								<Button variant='contained' onClick={handleDownloadPdf}>
									{UI_LABELS.BOOKING.completion.download_pdf}
								</Button>
							</Box>

							{Array.isArray(booking?.flights) && booking.flights.length > 0 && (
								<Box
									sx={{
										display: 'flex',
										flexDirection: { xs: 'column', sm: 'row' },
										gap: 1,
										flexWrap: 'wrap',
									}}
								>
									{booking.flights.map((flight, index) => {
										const routeInfo = extractRouteInfo(flight);
										const directionLabel = UI_LABELS.BOOKING.flight_details.from_to(
											routeInfo.from,
											routeInfo.to
										);

										return (
											<Button
												key={flight.id || index}
												variant='outlined'
												disabled={flight.tickets.length === 0}
												onClick={() => handleDownloadItineraryPdf(flight)}
											>
												{UI_LABELS.BOOKING.completion.download_itinerary_pdf}{' '}
												{directionLabel && `(${directionLabel})`}
											</Button>
										);
									})}
								</Box>
							)}
						</Box>

						<Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
							{UI_LABELS.BOOKING.completion.subtitle}
						</Typography>
					</Card>
				</Grid2>

				<Grid2
					size={{
						xs: 12,
						md: 9,
						lg: 9,
					}}
				>
					{/* Flights */}
					{Array.isArray(booking?.flights) && booking.flights.length > 0 && (
						<Accordion variant='outlined' sx={{ mb: { xs: 1, md: 2 } }}>
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

					{/* Tickets */}
					{Array.isArray(booking?.flights) && booking.flights.length > 0 && (
						<Accordion variant='outlined' sx={{ mb: 2 }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.BOOKING.confirmation.tickets_title}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<TicketsTable
									flights={booking.flights}
									publicId={publicId}
									accessToken={accessToken}
									currencySymbol={currencySymbol}
								/>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Price Details */}
					{booking && (
						<Accordion variant='outlined' sx={{ mb: { xs: 1, md: 2 } }}>
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
					{Array.isArray(booking?.payments) && booking.payments.length > 0 && (
						<Accordion variant='outlined' sx={{ mb: { xs: 1, md: 2 } }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.BOOKING.completion.payment_details}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<PaymentDetailsTable payments={booking.payments} />
							</AccordionDetails>
						</Accordion>
					)}
				</Grid2>
			</Grid2>
		</Base>
	);
};

export default Completion;
