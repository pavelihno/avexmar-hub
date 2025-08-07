import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        CircularProgress,
        Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { formatTime, formatDate, formatNumber, handlePassengerChange, disabledPassengerChange } from '../utils';
import { calculatePrice } from '../../redux/actions/price';
import { calculateOccupiedSeats, hasAvailableSeats } from '../utils/businessLogic';

const passengerCategories = UI_LABELS.SEARCH.form.passenger_categories;

const buildTariffOptions = (outbound, returnFlight) => {
        const outboundTariffs = outbound?.tariffs || [];
        if (!returnFlight) return outboundTariffs.map((t) => ({ ...t }));
        const returnTariffs = returnFlight.tariffs || [];
        const map = {};
        outboundTariffs.forEach((t) => {
                map[t.id] = { ...t };
        });
        const options = [];
        returnTariffs.forEach((t) => {
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
        return options;
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
                                {airline.name || airline.id}
                        </Typography>
                        <Typography variant='body2'>
                                {origin.name || origin.id} → {dest.name || dest.id}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                                {`${formatDate(flight.scheduled_departure)} ${formatTime(flight.scheduled_departure_time)} - ${formatDate(flight.scheduled_arrival)} ${formatTime(flight.scheduled_arrival_time)}`}
                        </Typography>
                </Card>
        );
};

const SelectTicketDialog = ({
	initialParams = {},
	open,
	onClose,
	outbound,
	returnFlight,
	airlines,
	airports,
	routes,
	discounts,
}) => {
	const navigate = useNavigate();

	const tariffOptions = useMemo(() => buildTariffOptions(outbound, returnFlight), [outbound, returnFlight]);

        const [tariffId, setTariffId] = useState(initialParams.tariff || tariffOptions[0]?.id);

        const [passengers, setPassengers] = useState({
                adults: parseInt(initialParams.adults) || 1,
                children: parseInt(initialParams.children) || 0,
                infants: parseInt(initialParams.infants) || 0,
                infants_seat: parseInt(initialParams.infants_seat) || 0,
        });
        const selectedTariff = useMemo(
                () => tariffOptions.find((t) => t.id === tariffId) || null,
                [tariffOptions, tariffId],
        );
        const currencySymbol = selectedTariff ? ENUM_LABELS.CURRENCY_SYMBOL[selectedTariff.currency] || '' : '';

        const totalSeats = calculateOccupiedSeats(passengers);

        const dispatch = useDispatch();
        const { current: priceDetails, isLoading: priceLoading, errors: priceErrors } = useSelector(
                (state) => state.price,
        );
        const errorMessage =
                priceErrors?.message ||
                (typeof priceErrors === 'string' ? priceErrors : priceErrors ? JSON.stringify(priceErrors) : '');

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

        const hasSeats = hasAvailableSeats(selectedTariff, totalSeats);

	const handleConfirm = () => {
		const query = new URLSearchParams();
		query.set('flight', outbound.id);
		if (returnFlight) query.set('return', returnFlight.id);
                if (tariffId) {
                        query.set('tariff', tariffId);
                        if (selectedTariff) query.set('class', selectedTariff.seat_class);
                }
		query.set('adults', passengers.adults);
		query.set('children', passengers.children);
		query.set('infants', passengers.infants);
		query.set('infants_seat', passengers.infants_seat);
		navigate(`/cart?${query.toString()}`);
	};

	return (
                <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
                        <DialogTitle>{UI_LABELS.SEARCH.flight_details.select_ticket}</DialogTitle>
                        <DialogContent dividers>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                        <FlightInfo
                                                                flight={outbound}
                                                                airlines={airlines}
                                                                airports={airports}
                                                                routes={routes}
                                                        />
                                                        {returnFlight && (
                                                                <FlightInfo
                                                                        flight={returnFlight}
                                                                        airlines={airlines}
                                                                        airports={airports}
                                                                        routes={routes}
                                                                />
                                                        )}
                                                </Box>

                                                <Typography gutterBottom>{UI_LABELS.SEARCH.form.seat_class_title}</Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                                        {tariffOptions.map((t) => (
                                                                <Card
                                                                        key={t.id}
                                                                        variant={t.id === tariffId ? 'outlined' : 'elevation'}
                                                                        sx={{ minWidth: 160, position: 'relative' }}
                                                                >
                                                                        <CardActionArea onClick={() => setTariffId(t.id)} sx={{ p: 1 }}>
                                                                                <Tooltip title={t.conditions || ''}>
                                                                                        <InfoOutlinedIcon fontSize='small' sx={{ position: 'absolute', top: 4, right: 4 }} />
                                                                                </Tooltip>
                                                                                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                                                                        {ENUM_LABELS.SEAT_CLASS[t.seat_class]}
                                                                                </Typography>
                                                                                <Typography variant='body2'>{t.title}</Typography>
                                                                                <Typography variant='body1' sx={{ fontWeight: 700 }}>
                                                                                        {formatNumber(t.price)} {ENUM_LABELS.CURRENCY_SYMBOL[t.currency] || ''}
                                                                                </Typography>
                                                                                <Typography variant='caption' color='text.secondary'>
                                                                                        {`${UI_LABELS.SEARCH.flight_details.seats_available}: ${t.seats_left ?? '-'}`}
                                                                                </Typography>
                                                                        </CardActionArea>
                                                                </Card>
                                                        ))}
                                                </Box>

                                                <Typography gutterBottom>{UI_LABELS.SEARCH.form.passengers}</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {passengerCategories.map((row) => (
                                                                <Box
                                                                        key={row.key}
                                                                        sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                border: 1,
                                                                                borderColor: 'divider',
                                                                                borderRadius: 1,
                                                                                p: 0.5,
                                                                        }}
                                                                >
                                                                        <Typography sx={{ mr: 1 }}>{row.label}</Typography>
                                                                        <IconButton
                                                                                size='small'
                                                                                onClick={() => handlePassengerChange(setPassengers, row.key, -1)}
                                                                                disabled={disabledPassengerChange(passengers, row.key, -1)}
                                                                        >
                                                                                <RemoveIcon fontSize='small' />
                                                                        </IconButton>
                                                                        <Typography sx={{ width: 20, textAlign: 'center' }}>{passengers[row.key]}</Typography>
                                                                        <IconButton
                                                                                size='small'
                                                                                onClick={() => handlePassengerChange(setPassengers, row.key, 1)}
                                                                                disabled={disabledPassengerChange(passengers, row.key, 1)}
                                                                        >
                                                                                <AddIcon fontSize='small' />
                                                                        </IconButton>
                                                                </Box>
                                                        ))}
                                                </Box>
                                        </Box>
                                        <Box sx={{ width: 250 }}>
                                                {priceLoading && (
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                                                <CircularProgress size={24} />
                                                        </Box>
                                                )}
                                                {!priceLoading && priceErrors && (
                                                        <Alert severity='error'>{errorMessage}</Alert>
                                                )}
                                                {!priceLoading && !priceErrors && priceDetails && (
                                                        <>
                                                                {priceDetails.breakdown.map((b) => {
                                                                        const label =
                                                                                passengerCategories.find((c) => c.key === b.category)?.label || b.category;
                                                                        return (
                                                                                <Box key={b.category} sx={{ mb: 1 }}>
                                                                                        <Typography>{`${label} ${b.count}x ${selectedTariff.title}`}</Typography>
                                                                                        <Typography variant='body2'>
                                                                                                {formatNumber(b.final_price)} {currencySymbol}
                                                                                        </Typography>
                                                                                        {b.discount > 0 && (
                                                                                                <Typography variant='caption' color='text.secondary'>
                                                                                                        {`${UI_LABELS.SEARCH.flight_details.discount} ${formatNumber(b.discount)} ${currencySymbol}`}
                                                                                                </Typography>
                                                                                        )}
                                                                                </Box>
                                                                        );
                                                                })}
                                                                <Divider sx={{ my: 1 }} />
                                                                <Typography>{`${UI_LABELS.SEARCH.flight_details.fees}: ${formatNumber(priceDetails.fees)} ${currencySymbol}`}</Typography>
                                                                <Divider sx={{ my: 1 }} />
                                                                <Typography sx={{ fontWeight: 700 }}>
                                                                        {`${UI_LABELS.SEARCH.flight_details.total_price}: ${formatNumber(priceDetails.total)} ${currencySymbol}`}
                                                                </Typography>
                                                        </>
                                                )}
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
                                                        disabled={!hasSeats || priceLoading || !!priceErrors}
                                                >
                                                        {UI_LABELS.SEARCH.flight_details.select_ticket}
                                                </Button>
                                        </span>
                                </Tooltip>
                        </DialogActions>
                </Dialog>
        );
};

export default SelectTicketDialog;
