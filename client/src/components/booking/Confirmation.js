import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Typography,
	Button,
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
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber, extractRouteInfo, useExpiryCountdown } from '../utils';
import PassengersTable from './PassengersTable';
import PriceDetailsTable from './PriceDetailsTable';
import FlightDetailsCard from './FlightDetailsCard';

const Confirmation = () => {
	const { publicId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
		const { current: booking, isLoading: bookingLoading } = useSelector((state) => state.bookingProcess);
	   const expiresAt = booking?.expires_at;
	   const timeLeft = useExpiryCountdown(expiresAt);
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
			if (booking.status === 'passengers_added') {
				await dispatch(confirmBooking(publicId)).unwrap();
			}
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
{expiresAt && (
<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
<Typography variant='h6' sx={{ fontWeight: 600 }}>
{timeLeft}
</Typography>
</Box>
)}
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
										{`${formatNumber(booking.price_details?.final_price || 0)} ${currencySymbol}`}
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<PriceDetailsTable
									priceDetails={booking.price_details}
									currencySymbol={currencySymbol}
									flightMap={flightMap}
									showDetails={false}
								/>
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
