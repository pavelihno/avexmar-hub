import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
	Box,
	Typography,
	Button,
	Grid2,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Base from '../Base';
import BookingProgress from './BookingProgress';
import { fetchBookingDetails, confirmBooking, fetchBookingAccess } from '../../redux/actions/bookingProcess';
import { ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatNumber, extractRouteInfo } from '../utils';
import PassengersTable from './PassengersTable';
import PriceDetailsTable from './PriceDetailsTable';
import FlightDetailsCard from './FlightDetailsCard';
import { selectIsAdmin } from '../../redux/reducers/auth';

const Confirmation = () => {
	const { publicId } = useParams();
	const location = useLocation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { current: booking, isLoading: bookingLoading } = useSelector((state) => state.bookingProcess);
	const [loading, setLoading] = useState(false);
	const isAdmin = useSelector(selectIsAdmin);

	const accessToken = useMemo(() => new URLSearchParams(location.search).get('access_token'), [location.search]);

	useEffect(() => {
		dispatch(fetchBookingDetails({ publicId, accessToken }));
	}, [dispatch, publicId, accessToken]);

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

	const handlePayment = async (isPayment = true) => {
		setLoading(true);
		try {
			await dispatch(confirmBooking({ publicId, isPayment, accessToken })).unwrap();
			await dispatch(fetchBookingAccess({ publicId, accessToken })).unwrap();
			const query = accessToken ? `?access_token=${accessToken}` : '';
			navigate(`/booking/${publicId}/payment${query}`);
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
			<Grid2 container justifyContent='center' spacing={{ xs: 2, md: 4 }} sx={{ mb: 2, mt: 1 }}>
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
						<Accordion variant='outlined' sx={{ mb: { xs: 1, md: 2 } }}>
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
								/>
							</AccordionDetails>
						</Accordion>
					)}

					{/* Payment buttons */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'flex-end',
							gap: 2,
							flexDirection: { xs: 'column', sm: 'row' },
						}}
					>
						{isAdmin && (
							<Button
								variant='outlined'
								color='secondary'
								onClick={() => handlePayment(false)}
								disabled={loading}
								sx={{ width: { xs: '100%', sm: 'auto' } }}
							>
								{loading ? (
									<CircularProgress size={24} color='inherit' />
								) : (
									UI_LABELS.BOOKING.confirmation.invoice_button
								)}
							</Button>
						)}
						<Button
							variant='contained'
							color='orange'
							onClick={() => handlePayment(true)}
							disabled={loading}
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{loading ? (
								<CircularProgress size={24} color='inherit' />
							) : (
								UI_LABELS.BOOKING.confirmation.payment_button
							)}
						</Button>
					</Box>
				</Grid2>
			</Grid2>
		</Base>
	);
};

export default Confirmation;
