import React, { useState, useMemo, useEffect } from 'react';
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
} from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import PassengerForm from './PassengerForm';
import {
	processBookingPassengers,
	fetchBookingPassengers,
	saveBookingPassenger,
} from '../../redux/actions/bookingProcess';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, ENUM_LABELS } from '../../constants';
import { createFormFields, FIELD_TYPES, formatNumber } from '../utils';

const Passengers = () => {
	const { publicId } = useParams();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const booking = useSelector((state) => state.bookingProcess.current);

	const passengersFromStore = booking?.passengers || [{ id: 1, type: 'ADULT' }];
	const [passengerData, setPassengerData] = useState(passengersFromStore);
	useEffect(() => {
		setPassengerData(passengersFromStore);
	}, [passengersFromStore]);

	useEffect(() => {
		dispatch(fetchBookingPassengers(publicId));
	}, [dispatch, publicId]);
	const [buyer, setBuyer] = useState(
		booking?.buyer || { lastName: '', firstName: '', email: '', phone: '', consent: false }
	);

	const buyerFormFields = useMemo(() => {
		const fields = {
			lastName: {
				key: 'lastName',
				label: FIELD_LABELS.PASSENGER.last_name,
				validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED : ''),
			},
			firstName: {
				key: 'firstName',
				label: FIELD_LABELS.PASSENGER.first_name,
				validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED : ''),
			},
			email: {
				key: 'email',
				label: FIELD_LABELS.BOOKING.email_address,
				type: FIELD_TYPES.EMAIL,
				validate: (v) => (!v ? VALIDATION_MESSAGES.BOOKING.email_address.REQUIRED : ''),
			},
			phone: {
				key: 'phone',
				label: FIELD_LABELS.BOOKING.phone_number,
				type: FIELD_TYPES.PHONE,
				validate: (v) => (!v ? VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED : ''),
			},
		};
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, []);

	const [buyerErrors, setBuyerErrors] = useState({});

	const handlePassengerChange = (id) => (field, value, data) => {
		setPassengerData((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
	};

	const handlePassengerValid = (id) => (data) => {
		dispatch(saveBookingPassenger({ public_id: publicId, passenger: data }));
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
		if (!buyer.consent) errs.consent = VALIDATION_MESSAGES.BOOKING.consent.REQUIRED;
		setBuyerErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleContinue = async () => {
		if (!validateBuyer()) return;
		await dispatch(processBookingPassengers({ public_id: publicId, buyer }));
		navigate(`/booking/${publicId}/confirmation`);
	};

	const routeInfo = UI_LABELS.SCHEDULE.from_to(booking?.from, booking?.to);

	const farePrice = booking?.fare_price || 0;
	const serviceFee = booking?.fees || 0;
	const discount = booking?.total_discounts || 0;
	const totalPrice = booking?.total_price || 0;
	const currencySymbol = booking ? ENUM_LABELS.CURRENCY_SYMBOL[booking.currency] || '' : '';

	useEffect(() => {
		if (routeInfo) {
			document.title = routeInfo;
		}
	}, [routeInfo]);

	return (
		<Base maxWidth='lg'>
			<BookingProgress activeStep='passengers' />
			<Grid container spacing={2}>
				<Grid item xs={12} md={8} sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', pr: { md: 2 } }}>
					{passengerData.map((p) => (
						<PassengerForm
							key={p.id}
							passenger={p}
							onChange={handlePassengerChange(p.id)}
							onValid={handlePassengerValid(p.id)}
						/>
					))}
					<Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, mb: 2 }}>
						<Typography variant='h6' sx={{ mb: 1 }}>
							{UI_LABELS.BOOKING.buyer_form.title}
						</Typography>
						<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
							{passengerData.map((p) => (
								<Chip
									key={p.id}
									label={`${p.lastName || ''} ${p.firstName || ''}`}
									size='small'
									onClick={() =>
										setBuyer((prev) => ({
											...prev,
											lastName: p.lastName || '',
											firstName: p.firstName || '',
										}))
									}
								/>
							))}
						</Box>
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
					{routeInfo && (
						<Typography variant='h6' sx={{ mb: 2 }}>
							{routeInfo}
						</Typography>
					)}
					<Card>
						<CardContent>
							<Typography variant='h4' sx={{ mb: 2 }}>
								{`${UI_LABELS.BOOKING.buyer_form.summary.passenger_word(passengerData.length)}`}
							</Typography>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
								<Typography>{UI_LABELS.BOOKING.buyer_form.summary.tickets}</Typography>
								<Typography>{`${formatNumber(farePrice)} ${currencySymbol}`}</Typography>
							</Box>
							{serviceFee > 0 && (
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography>{UI_LABELS.BOOKING.buyer_form.summary.service_fee}</Typography>
									<Typography>{`${formatNumber(serviceFee)} ${currencySymbol}`}</Typography>
								</Box>
							)}
							{discount > 0 && (
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography>{UI_LABELS.BOOKING.buyer_form.summary.discount}</Typography>
									<Typography>{`-${formatNumber(discount)} ${currencySymbol}`}</Typography>
								</Box>
							)}
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
								<Typography variant='h4' sx={{ mb: 0.25 }}>
									{UI_LABELS.BOOKING.buyer_form.summary.total}
								</Typography>
								<Typography variant='subtitle1'>
									{`${formatNumber(totalPrice)} ${currencySymbol}`}
								</Typography>
							</Box>

							<Divider sx={{ my: 2 }} />

							<FormControl required error={!!buyerErrors.consent} sx={{ mb: 2 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={buyer.consent}
											onChange={(e) => handleBuyerChange('consent', e.target.checked)}
										/>
									}
									label={
										<Typography variant='subtitle2' color='textSecondary'>
											{UI_LABELS.BOOKING.buyer_form.privacy_policy((text) => (
												<Link to='/privacy_policy' target='_blank'>
													{text}
												</Link>
											))}
										</Typography>
									}
								/>
								{buyerErrors.consent && <FormHelperText>{buyerErrors.consent}</FormHelperText>}
							</FormControl>

							<Button variant='contained' color='orange' fullWidth onClick={handleContinue}>
								{UI_LABELS.BUTTONS.continue}
							</Button>
						</CardContent>
					</Card>
					<Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
						{UI_LABELS.BOOKING.buyer_form.public_offer((text) => (
							<Link to='/public_offer'>{text}</Link>
						))}
					</Typography>
				</Grid>
			</Grid>
		</Base>
	);
};

export default Passengers;
