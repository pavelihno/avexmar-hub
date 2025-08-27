import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
	Box,
	Grid,
	Typography,
	Card,
	CardContent,
	Checkbox,
	FormControlLabel,
	Button,
	FormControl,
	FormHelperText,
	Divider,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Alert,
	Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import PassengerForm from './PassengerForm';
import {
	processBookingPassengers,
	fetchBookingDetails,
	fetchBookingAccess,
} from '../../redux/actions/bookingProcess';
import { fetchCountries } from '../../redux/actions/country';
import { fetchUserPassengers } from '../../redux/actions/passenger';
import {
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	ENUM_LABELS,
} from '../../constants';
import {
	createFormFields,
	FIELD_TYPES,
	formatNumber,
	getPassengerFormConfig,
	validateEmail,
	validatePhoneNumber,
	formatDate,
	formatTime,
	formatDuration,
	findBookingPassengerDuplicates,
	extractRouteInfo,
	useExpiryCountdown,
} from '../utils';
import { mapFromApi, mapToApi, mappingConfigs } from '../utils/mappers';

const Passengers = () => {
	const { publicId } = useParams();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const {
		current: booking,
		isLoading: bookingLoading,
		errors: bookingErrors,
	} = useSelector((state) => state.bookingProcess);
	const { countries } = useSelector((state) => state.countries);
	const { currentUser } = useSelector((state) => state.auth);
	const userPassengers = useSelector((state) => state.passengers.passengers);

	const expiresAt = booking?.expires_at;
	const timeLeft = useExpiryCountdown(expiresAt);

	const existingPassengerData = booking?.passengers;
	const passengersExist = booking?.passengersExist;
	const [passengerData, setPassengerData] = useState(null);
	const [errors, setErrors] = useState({});

	const fromApiPassenger = (p = {}) => mapFromApi(p, mappingConfigs.passenger);

	const fromApiBuyer = (b = {}) => mapFromApi(b, mappingConfigs.buyer);

	useEffect(() => {
		if (bookingErrors == null) return;
		setErrors((prev) => ({
			...prev,
			...(Array.isArray(bookingErrors) || typeof bookingErrors === 'string'
				? { _global: bookingErrors }
				: bookingErrors),
		}));
	}, [bookingErrors]);

	const errorMessages = useMemo(() => {
		if (!errors) return [];

		if (typeof errors === 'string') return [errors];
		if (Array.isArray(errors)) return errors.filter(Boolean);

		if (typeof errors === 'object') {
			const values = Object.values(errors).flatMap((v) =>
				Array.isArray(v) ? v : [v],
			);
			return values.filter(Boolean).map(String);
		}

		return [];
	}, [errors]);

	useEffect(() => {
		if (Array.isArray(existingPassengerData)) {
			const mapped = existingPassengerData.map(fromApiPassenger);
			setPassengerData(mapped);
		}
	}, [existingPassengerData, passengersExist]);

	useEffect(() => {
		if (currentUser) {
			dispatch(fetchUserPassengers(currentUser.id));
		}
	}, [dispatch, currentUser]);

	useEffect(() => {
		dispatch(fetchBookingDetails(publicId));
	}, [dispatch, publicId]);

	useEffect(() => {
		if (!countries || countries.length === 0) {
			dispatch(fetchCountries());
		}
	}, [countries, dispatch]);

	const citizenshipOptions = useMemo(
		() => (countries || []).map((c) => ({ value: c.id, label: c.name })),
		[countries],
	);

	const isPassengerComplete = (p) => {
		const formConfig = getPassengerFormConfig(p.documentType);
		return formConfig.required.every((f) => p[f]);
	};

	const [buyer, setBuyer] = useState({
		buyerLastName: '',
		buyerFirstName: '',
		emailAddress: '',
		phoneNumber: '',
		consent: false,
	});

	useEffect(() => {
		if (passengersExist) {
			const mapped = fromApiBuyer(booking);
			setBuyer({
				buyerLastName: mapped.buyerLastName || '',
				buyerFirstName: mapped.buyerFirstName || '',
				emailAddress: mapped.emailAddress || '',
				phoneNumber: mapped.phoneNumber || '',
				consent: mapped.consent || false,
			});
		}
	}, [booking, passengersExist]);

	useEffect(() => {
		if (currentUser) {
			setBuyer((prev) => ({
				...prev,
				buyerLastName: prev.buyerLastName || currentUser.last_name,
				buyerFirstName: prev.buyerFirstName || currentUser.first_name,
				phoneNumber: prev.phoneNumber || currentUser.phone_number || '',
			}));
		}
	}, [currentUser]);

	const buyerFormFields = useMemo(() => {
		const fields = {
			buyerLastName: {
				key: 'buyerLastName',
				type: FIELD_TYPES.TEXT,
				label: FIELD_LABELS.PASSENGER.last_name,
				validate: (v) =>
					!v ? VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED : '',
			},
			buyerFirstName: {
				key: 'buyerFirstName',
				type: FIELD_TYPES.TEXT,
				label: FIELD_LABELS.PASSENGER.first_name,
				validate: (v) =>
					!v ? VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED : '',
			},
			emailAddress: {
				key: 'emailAddress',
				label: FIELD_LABELS.BOOKING.email_address,
				type: FIELD_TYPES.EMAIL,
				validate: (v) => {
					if (!v) return VALIDATION_MESSAGES.BOOKING.email_address.REQUIRED;
					return validateEmail(v)
						? ''
						: VALIDATION_MESSAGES.BOOKING.email_address.INVALID;
				},
			},
			phoneNumber: {
				key: 'phoneNumber',
				label: FIELD_LABELS.BOOKING.phone_number,
				type: FIELD_TYPES.PHONE,
				validate: (v) => {
					if (!v) return VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED;
					return validatePhoneNumber(v)
						? ''
						: VALIDATION_MESSAGES.BOOKING.phone_number.INVALID;
				},
			},
		};
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, []);

	const [buyerErrors, setBuyerErrors] = useState({});

	const handlePassengerChange = (index) => (field, value, data) => {
		setPassengerData((prev) =>
			Array.isArray(prev)
				? prev.map((p, i) => (i === index ? { ...p, ...data } : p))
				: prev,
		);
	};

	const handlePrefillPassenger = (index, passenger) => {
		const mapped = fromApiPassenger(passenger);
		setPassengerData((prev) =>
			Array.isArray(prev)
				? prev.map((p, i) => (i === index ? { ...p, ...mapped } : p))
				: prev,
		);
	};

	const handleBuyerChange = (field, value) => {
		setBuyer((prev) => ({ ...prev, [field]: value }));
		if (buyerErrors[field]) setBuyerErrors((e) => ({ ...e, [field]: '' }));
	};

	const validateBuyer = () => {
		const errs = {};
		Object.values(buyerFormFields).forEach((f) => {
			if (f.validate) {
				const err = f.validate(buyer[f.name]);
				if (err) errs[f.name] = err;
			}
		});
		if (!buyer.consent)
			errs.consent = VALIDATION_MESSAGES.BOOKING.consent.REQUIRED;
		setBuyerErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const passengerRefs = useRef([]);

	const toApiPassenger = (p) => mapToApi(p, mappingConfigs.passenger);

	const toApiBuyer = (b) => mapToApi(b, mappingConfigs.buyer);

	const handleContinue = async () => {
		const allPassengersValid = passengerRefs.current
			.filter(Boolean)
			.map((r) => r.validate())
			.every(Boolean);

		if (!allPassengersValid) return;

		const hasPassengerDuplicate =
			findBookingPassengerDuplicates(passengerData || []).length > 0;
		if (hasPassengerDuplicate) {
			setErrors((prev) => ({
				...prev,
				duplicate: VALIDATION_MESSAGES.BOOKING.passenger.DUPLICATE,
			}));
			return;
		}

		const buyerValid = validateBuyer();
		if (!buyerValid) return;

		try {
			const apiPassengers = (passengerData || []).map(toApiPassenger);
			const apiBuyer = toApiBuyer(buyer);
			await dispatch(
				processBookingPassengers({
					public_id: publicId,
					buyer: apiBuyer,
					passengers: apiPassengers,
				}),
			).unwrap();
			await dispatch(fetchBookingDetails(publicId)).unwrap();
			await dispatch(fetchBookingAccess(publicId)).unwrap();
			navigate(`/booking/${publicId}/confirmation`);
		} catch (e) {
			// errors handled via redux state
		}
	};

	const [outboundFlight = null, returnFlight = null] = booking?.flights ?? [];

	const outboundRouteInfo = extractRouteInfo(outboundFlight);
	const returnRouteInfo = extractRouteInfo(returnFlight);

	useEffect(() => {
		if (outboundRouteInfo) {
			document.title = UI_LABELS.SEARCH.from_to_date(
				outboundRouteInfo.from,
				outboundRouteInfo.to,
				outboundRouteInfo.date,
				returnRouteInfo.date,
			);
		}
	}, [outboundRouteInfo, returnRouteInfo]);

	const tariffMap = useMemo(() => {
		const dirs = booking?.price_details?.directions || [];
		return dirs.reduce((acc, d) => ({ ...acc, [d.direction]: d.tariff }), {});
	}, [booking?.price_details]);

	const farePrice = booking?.fare_price || 0;
	const fees = booking?.fees || 0;
	const discount = booking?.total_discounts || 0;
	const totalPrice = booking?.total_price || 0;
	const currencySymbol = booking
		? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || ''
		: '';

	const passengersReady = !bookingLoading && Array.isArray(passengerData);

	return (
		<Base maxWidth="lg">
			<BookingProgress activeStep="passengers" />
			{expiresAt && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
					<Typography variant="h6" sx={{ fontWeight: 600 }}>
						{timeLeft}
					</Typography>
				</Box>
			)}
			<Grid container spacing={2}>
				<Grid
					item
					xs={12}
					md={8}
					sx={{
						maxHeight: 'calc(100vh - 200px)',
						overflowY: 'auto',
						pr: { md: 2 },
					}}
				>
					{errorMessages.length > 0 && (
						<Stack spacing={1} sx={{ mb: 2 }}>
							{errorMessages.map((msg, idx) => (
								<Alert key={idx} severity="error">
									{msg}
								</Alert>
							))}
						</Stack>
					)}
					{!currentUser && (
						<Alert severity="info" sx={{ mb: 2 }}>
							{UI_LABELS.BOOKING.passenger_form.login_hint}
						</Alert>
					)}
					{passengersReady &&
						passengerData.map((p, index) => (
							<Box key={p.id || index} sx={{ mb: 2 }}>
								{currentUser && userPassengers.length > 0 && (
									<Box
										sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}
									>
										{userPassengers.map((up) => {
											const mapped = fromApiPassenger(up);
											return (
												<Chip
													key={up.id}
													label={`${mapped.lastName || ''} ${mapped.firstName || ''}`}
													size="small"
													onClick={() => handlePrefillPassenger(index, up)}
												/>
											);
										})}
									</Box>
								)}
								<PassengerForm
									passenger={p}
									flights={booking.flights}
									onChange={handlePassengerChange(index)}
									citizenshipOptions={citizenshipOptions}
									ref={(el) => (passengerRefs.current[index] = el)}
								/>
							</Box>
						))}
					<Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, mb: 2 }}>
						<Typography variant="h4" sx={{ mb: 3 }}>
							{UI_LABELS.BOOKING.buyer_form.title}
						</Typography>
						{passengersReady &&
							passengerData.filter(isPassengerComplete).length > 0 && (
								<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
									{passengerData.filter(isPassengerComplete).map((p, index) => (
										<Chip
											key={p.id || index}
											label={`${p.lastName || ''} ${p.firstName || ''}`}
											size="small"
											onClick={() =>
												setBuyer((prev) => ({
													...prev,
													buyerLastName: p.lastName || '',
													buyerFirstName: p.firstName || '',
												}))
											}
										/>
									))}
								</Box>
							)}
						<Grid container spacing={2}>
							{Object.values(buyerFormFields).map((field) => (
								<Grid item xs={12} sm={6} key={field.name}>
									{field.renderField({
										value: buyer[field.name],
										onChange: (value) => handleBuyerChange(field.name, value),
										fullWidth: true,
										size: 'small',
										error: !!buyerErrors[field.name],
										helperText: buyerErrors[field.name],
									})}
								</Grid>
							))}
						</Grid>
					</Box>
				</Grid>
				<Grid item xs={12} md={4} sx={{ position: 'sticky', top: 16 }}>
					<Card>
						<CardContent>
							{Array.isArray(booking?.flights) &&
								booking.flights.length > 0 && (
									<Accordion variant="outlined" sx={{ mb: 2 }}>
										<AccordionSummary expandIcon={<ExpandMoreIcon />}>
											{outboundRouteInfo && (
												<Typography
													variant="subtitle1"
													sx={{ fontWeight: 'bold' }}
												>
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
											{booking.flights.map((f, idx) => {
												const origin = f.route?.origin_airport || {};
												const dest = f.route?.destination_airport || {};
												const depDate = formatDate(f.scheduled_departure);
												const depTime = formatTime(f.scheduled_departure_time);
												const arrDate = formatDate(f.scheduled_arrival);
												const arrTime = formatTime(f.scheduled_arrival_time);
												const duration = formatDuration(f.duration);
												const airline = f.airline?.name || '';
												const flightNo =
													f.airline_flight_number || f.flight_number || '';
												const aircraft = f.aircraft?.type;
												const direction = idx === 0 ? 'outbound' : 'return';
												const tariff = tariffMap[direction];
												return (
													<Box
														key={f.id || idx}
														sx={{
															mb: idx < booking.flights.length - 1 ? 2 : 0,
														}}
													>
														<Box
															sx={{
																display: 'flex',
																justifyContent: 'space-between',
																alignItems: 'center',
																mb: 0.5,
															}}
														>
															<Typography variant="subtitle2">
																{airline}
															</Typography>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{flightNo}
															</Typography>
														</Box>
														{tariff && (
															<Typography
																variant="caption"
																color="text.secondary"
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
																<Typography variant="h6">{depTime}</Typography>
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	{depDate}
																</Typography>
																<Typography variant="body2">
																	{origin.city_name}
																</Typography>
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	{origin.iata_code}
																</Typography>
															</Box>
															<Box sx={{ textAlign: 'center' }}>
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	{duration}
																</Typography>
																<Divider flexItem sx={{ my: 0.5 }} />
															</Box>
															<Box sx={{ textAlign: 'right' }}>
																<Typography variant="h6">{arrTime}</Typography>
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	{arrDate}
																</Typography>
																<Typography variant="body2">
																	{dest.city_name}
																</Typography>
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
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
																{aircraft && (
																	<Typography
																		variant="caption"
																		color="text.secondary"
																	>
																		{aircraft}
																	</Typography>
																)}
															</Box>
														)}
														{idx < booking.flights.length - 1 && (
															<Divider sx={{ mt: 1 }} />
														)}
													</Box>
												);
											})}
										</AccordionDetails>
									</Accordion>
								)}

							<Typography variant="h4" sx={{ mb: 2 }}>
								{`${UI_LABELS.BOOKING.buyer_form.summary.passenger_word(
									passengersReady ? passengerData.length : 0,
								)}`}
							</Typography>
							<Box
								sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
							>
								<Typography>
									{UI_LABELS.BOOKING.buyer_form.summary.tickets}
								</Typography>
								<Typography>{`${formatNumber(farePrice)} ${currencySymbol}`}</Typography>
							</Box>
							{fees > 0 && (
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										mb: 1,
									}}
								>
									<Typography>
										{UI_LABELS.BOOKING.buyer_form.summary.fees}
									</Typography>
									<Typography>{`${formatNumber(fees)} ${currencySymbol}`}</Typography>
								</Box>
							)}
							{discount > 0 && (
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										mb: 1,
									}}
								>
									<Typography>
										{UI_LABELS.BOOKING.buyer_form.summary.discount}
									</Typography>
									<Typography>{`- ${formatNumber(discount)} ${currencySymbol}`}</Typography>
								</Box>
							)}
							<Box
								sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
							>
								<Typography variant="h4" sx={{ mb: 0.25 }}>
									{UI_LABELS.BOOKING.buyer_form.summary.total}
								</Typography>
								<Typography variant="subtitle1">
									{`${formatNumber(totalPrice)} ${currencySymbol}`}
								</Typography>
							</Box>

							<Divider sx={{ my: 2 }} />

							<FormControl
								required
								error={!!buyerErrors.consent}
								sx={{ mb: 2 }}
							>
								<FormControlLabel
									control={
										<Checkbox
											checked={buyer.consent}
											onChange={(e) =>
												handleBuyerChange('consent', e.target.checked)
											}
										/>
									}
									label={
										<Typography variant="subtitle2" color="textSecondary">
											{UI_LABELS.BOOKING.buyer_form.privacy_policy((text) => (
												<Link to="/privacy_policy" target="_blank">
													{text}
												</Link>
											))}
										</Typography>
									}
								/>
								{buyerErrors.consent && (
									<FormHelperText>{buyerErrors.consent}</FormHelperText>
								)}
							</FormControl>

							<Button
								variant="contained"
								color="orange"
								fullWidth
								onClick={handleContinue}
							>
								{UI_LABELS.BUTTONS.continue}
							</Button>
						</CardContent>
					</Card>
					<Typography
						variant="body2"
						color="textSecondary"
						sx={{ ml: 1, mt: 1 }}
					>
						{UI_LABELS.BOOKING.buyer_form.public_offer((text) => (
							<Link to="/public_offer" target="_blank">
								{text}
							</Link>
						))}
					</Typography>
				</Grid>
			</Grid>
		</Base>
	);
};

export default Passengers;
