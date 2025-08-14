import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Tooltip,
	Typography,
	Card,
	CardActionArea,
	IconButton,
	Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { UI_LABELS, ENUM_LABELS } from '../../constants';
import {
	formatTime,
	formatDate,
	formatNumber,
	handlePassengerChange,
	disabledPassengerChange,
	getSeatsNumber,
	hasAvailableSeats,
} from '../utils';
import { calculatePrice } from '../../redux/actions/price';
import { fetchOutboundFlightTariffs, fetchReturnFlightTariffs } from '../../redux/actions/search';
import { processBookingCreate } from '../../redux/actions/bookingProcess';

const passengerCategories = UI_LABELS.SEARCH.form.passenger_categories;

const buildTariffOptions = (outboundTariffs, returnTariffs) => {
	const filterBySeats = (tariffs) => tariffs.filter((t) => t.seats_left === undefined || t.seats_left > 0);

	const outboundFiltered = filterBySeats(outboundTariffs).sort((a, b) => a.price - b.price);

	if (!returnTariffs || returnTariffs.length === 0) {
		return outboundFiltered.map((t) => ({ ...t }));
	}

	const returnFiltered = filterBySeats(returnTariffs);
	const map = {};
	outboundFiltered.forEach((t) => {
		map[t.id] = { ...t };
	});

	const options = [];
	returnFiltered.forEach((t) => {
		if (map[t.id]) {
			options.push({
				...map[t.id],
				price: map[t.id].price + t.price,
				seats_left:
					map[t.id].seats_left !== undefined && t.seats_left !== undefined
						? Math.min(map[t.id].seats_left, t.seats_left)
						: t.seats_left ?? map[t.id].seats_left,
			});
		}
	});

	return filterBySeats(options).sort((a, b) => a.price - b.price);
};

const getDefaultTariffId = (tariffs, seatClass, seatsNumber) => {
	if (seatClass) {
		const classTariffs = tariffs.filter((t) => t.seat_class === seatClass && t.seats_left >= seatsNumber);
		if (classTariffs.length) {
			return classTariffs[0].id;
		}
	}
	return tariffs[0]?.id;
};

const FlightInfo = ({ flight, airlines, airports, routes }) => {
	if (!flight) return null;
	const airline = airlines.find((a) => a.id === flight.airline_id) || {};
	const route = routes.find((r) => r.id === flight.route_id) || {};
	const origin = airports.find((a) => a.id === route.origin_airport_id) || {};
	const dest = airports.find((a) => a.id === route.destination_airport_id) || {};

	return (
		<Card sx={{ p: 1, flex: 1 }}>
			<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
				{airline.name}
			</Typography>
			<Typography variant='subtitle2'>{flight.airline_flight_number}</Typography>
			<Typography variant='body2'>
				{origin.iata_code} → {dest.iata_code}
			</Typography>
			<Typography variant='caption' color='text.secondary'>
				{`${formatDate(flight.scheduled_departure)} ${formatTime(flight.scheduled_departure_time)}`}
			</Typography>
		</Card>
	);
};

const SelectTicketDialog = ({ open, onClose, outbound, returnFlight, airlines, airports, routes }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const initialParams = Object.fromEntries(params.entries());

	const seatClass = initialParams.class;

	const [passengers, setPassengers] = useState({
		adults: 1,
		children: 0,
		infants: 0,
		infants_seat: 0,
	});

	const seatsNumber = getSeatsNumber(passengers);

	const { outboundFlightTariffs: outboundTariffs, isLoading: outboundLoading } = useSelector((state) => state.search);
	const { returnFlightTariffs: returnTariffs, isLoading: returnLoading } = useSelector((state) => state.search);

	const { current: priceDetails, isLoading: priceLoading } = useSelector((state) => state.price);
	const { isLoading: bookingLoading } = useSelector((state) => state.bookingProcess);

	useEffect(() => {
		setPassengers({
			adults: parseInt(initialParams.adults || '') || 1,
			children: parseInt(initialParams.children || '') || 0,
			infants: parseInt(initialParams.infants || '') || 0,
			infants_seat: parseInt(initialParams.infants_seat || '') || 0,
		});
	}, [params]);

	useEffect(() => {
		if (!open || !outbound) return;
		dispatch(fetchOutboundFlightTariffs(outbound.id));
	}, [open, outbound]);

	useEffect(() => {
		if (!open || !returnFlight) return;
		dispatch(fetchReturnFlightTariffs(returnFlight.id));
	}, [open, returnFlight]);

	const tariffOptions = useMemo(
		() => buildTariffOptions(outboundTariffs || [], returnTariffs || []),
		[outboundTariffs, returnTariffs]
	);

	const defaultTariffId = useMemo(
		() => getDefaultTariffId(tariffOptions, seatClass, seatsNumber, initialParams.tariff),
		[tariffOptions, seatClass, seatsNumber, initialParams.tariff]
	);

	const [tariffId, setTariffId] = useState(defaultTariffId);

	useEffect(() => {
		setTariffId(defaultTariffId);
	}, [defaultTariffId]);

	const selectedTariff = useMemo(() => tariffOptions.find((t) => t.id === tariffId), [tariffOptions, tariffId]);
	const currencySymbol = selectedTariff ? ENUM_LABELS.CURRENCY_SYMBOL[selectedTariff.currency] || '' : '';

	useEffect(() => {
		if (!tariffId) return;
		const payload = {
			outbound_id: outbound.id,
			tariff_id: tariffId,
			passengers,
		};
		if (returnFlight) payload.return_id = returnFlight.id;
		dispatch(calculatePrice(payload));
	}, [dispatch, passengers, tariffId, outbound, returnFlight]);

	const hasSeats = hasAvailableSeats(selectedTariff, seatsNumber);

	const handleConfirm = async () => {
		const payload = {
			outbound_id: outbound.id,
			tariff_id: tariffId,
			passengers,
		};
		if (returnFlight) payload.return_id = returnFlight.id;
		const res = await dispatch(processBookingCreate(payload)).unwrap();
		navigate(`/booking/${res.public_id}/passengers`);
	};

	const [conditions, setConditions] = useState('');
	const [showConditions, setShowConditions] = useState(false);

	return (
		<>
			<Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
				<DialogContent dividers>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: '2fr auto 1fr',
							gap: 1,
							alignItems: 'start',
						}}
					>
						<Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 2 }}>
							<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
								<FlightInfo flight={outbound} airlines={airlines} airports={airports} routes={routes} />
								{returnFlight ? (
									<FlightInfo
										flight={returnFlight}
										airlines={airlines}
										airports={airports}
										routes={routes}
									/>
								) : (
									<Box />
								)}
							</Box>

							<Box sx={{ display: 'flex', gap: 1 }}>
								{tariffOptions.map((t) => {
									const isSelected = t.id === tariffId;
									return (
										<Card key={t.id} sx={{ p: 0.5 }}>
											<Box display='flex' justifyContent='flex-end'>
												<IconButton
													sx={{ m: 0, p: 0.5 }}
													size='small'
													disabled={!t.conditions}
													onClick={(e) => {
														e.stopPropagation();
														if (t.conditions) {
															setConditions(t.conditions);
															setShowConditions(true);
														}
													}}
												>
													<Tooltip title={UI_LABELS.SEARCH.flight_details.tariff_conditions}>
														<InfoOutlinedIcon fontSize='small' />
													</Tooltip>
												</IconButton>
											</Box>

											<CardActionArea
												onClick={() => setTariffId(t.id)}
												sx={{
													p: 1,
													bgcolor: isSelected ? 'action.selected' : 'background.paper',
												}}
											>
												<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
													{ENUM_LABELS.SEAT_CLASS[t.seat_class]}
												</Typography>
												<Typography variant='body2'>{t.title}</Typography>
												<Typography variant='body1' sx={{ fontWeight: 700 }}>
													{formatNumber(t.price)}{' '}
													{ENUM_LABELS.CURRENCY_SYMBOL[t.currency] || ''}
												</Typography>
												<Typography variant='caption' color='text.secondary'>
													{`${UI_LABELS.SEARCH.flight_details.seats_available}: ${
														t.seats_left ?? '-'
													}`}
												</Typography>
											</CardActionArea>
										</Card>
									);
								})}
							</Box>

							<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
								{passengerCategories.map((row) => (
									<Card
										key={row.key}
										sx={{
											p: 1,
											display: 'flex',
											flexDirection: 'column',
											height: '100%',
										}}
									>
										<Box sx={{ mb: 1 }}>
											<Typography noWrap sx={{ textDecoration: 'underline', lineHeight: 1.2 }}>
												{row.label}
											</Typography>
											<Typography noWrap variant='body2' color='text.secondary'>
												{row.desc}
											</Typography>
										</Box>

										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: 'auto auto auto',
												justifyContent: 'flex-end',
												alignItems: 'center',
												columnGap: 0.5,
											}}
										>
											{/* Remove button */}
											<IconButton
												onClick={() => handlePassengerChange(setPassengers, row.key, -1)}
												disabled={disabledPassengerChange(passengers, row.key, -1)}
												sx={{ p: 0 }}
											>
												<RemoveIcon fontSize='small' />
											</IconButton>

											<Typography sx={{ textAlign: 'center', minWidth: '24px' }}>
												{passengers[row.key]}
											</Typography>

											{/* Add button */}
											<IconButton
												onClick={() => handlePassengerChange(setPassengers, row.key, 1)}
												disabled={disabledPassengerChange(passengers, row.key, 1)}
												sx={{ p: 0 }}
											>
												<AddIcon fontSize='small' />
											</IconButton>
										</Box>
									</Card>
								))}
							</Box>
						</Box>

						<Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

						<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', rowGap: 0.5 }}>
							<Typography sx={{ fontWeight: 600 }}>{UI_LABELS.SEARCH.flight_details.tickets}</Typography>
							{(priceDetails?.directions || []).map((dir) => {
								const route = routes.find((r) => r.id === dir.route_id) || {};
								const origin = airports.find((a) => a.id === route.origin_airport_id) || {};
								const dest = airports.find((a) => a.id === route.destination_airport_id) || {};

								return (
									<Box key={dir.direction} sx={{ mb: 1 }}>
										<Typography variant='subtitle2' sx={{ fontWeight: 500 }}>
											{`${origin.city_name} → ${dest.city_name}`}
										</Typography>
										{dir.passengers.map((b) => {
											const label =
												passengerCategories.find((c) => c.key === b.category)?.label ||
												b.category;
											return (
												<Box key={b.category} sx={{ ml: 1, mt: 0.5 }}>
													<Typography sx={{ textDecoration: 'underline' }}>
														{`${label} x ${b.count}`}
													</Typography>
													<Typography variant='body2'>
														{`${formatNumber(b.fare_price)} ${currencySymbol}`}
													</Typography>
													{b.discount > 0 && (
														<Typography variant='body2' color='text.secondary'>
															{`-${formatNumber(b.discount)} ${currencySymbol}`}
															{b.discount_name ? ` (${b.discount_name})` : ''}
														</Typography>
													)}
												</Box>
											);
										})}
									</Box>
								);
							})}

							{(priceDetails?.fees || []).length > 0 && (
								<>
									<Divider sx={{ my: 0.5 }} />

									<Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 0.5 }}>
										<Typography sx={{ fontWeight: 600 }}>
											{UI_LABELS.SEARCH.flight_details.fees}
										</Typography>
										{(priceDetails?.fees || []).map((f, index) => (
											<Box key={index} sx={{ mb: 1 }}>
												<Typography
													sx={{ textDecoration: 'underline' }}
												>{`${f.name}`}</Typography>
												<Typography variant='body2'>
													{`${formatNumber(f.total)} ${currencySymbol}`}
												</Typography>
											</Box>
										))}
									</Box>
								</>
							)}

							<Divider sx={{ my: 0.5 }} />

							<Typography
								variant='body1'
								sx={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: 'underline' }}
							>
								{UI_LABELS.SEARCH.flight_details.total_price}
							</Typography>
							<Typography variant='body2' sx={{ fontSize: '1.1rem' }}>
								{`${formatNumber(priceDetails?.total_price)} ${currencySymbol}`}
							</Typography>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>{UI_LABELS.BUTTONS.close}</Button>
					<Tooltip title={!hasSeats ? UI_LABELS.SEARCH.flight_details.seats_unavailable : ''}>
						<span>
							<Button
								variant='contained'
								color='orange'
								onClick={handleConfirm}
								disabled={!hasSeats || priceLoading || bookingLoading}
							>
								{UI_LABELS.SEARCH.flight_details.book_ticket}
							</Button>
						</span>
					</Tooltip>
				</DialogActions>
			</Dialog>
			<Dialog open={showConditions} onClose={() => setShowConditions(false)} maxWidth='sm'>
				<DialogTitle>{UI_LABELS.SEARCH.flight_details.tariff_conditions}</DialogTitle>
				<DialogContent dividers>
					<Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
						{conditions}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowConditions(false)}>{UI_LABELS.BUTTONS.close}</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default SelectTicketDialog;
