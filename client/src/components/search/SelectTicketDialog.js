import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardActionArea,
  IconButton,
  Divider
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UI_LABELS, ENUM_LABELS, MAX_PASSENGERS } from '../../constants';
import { formatTime, formatDate, formatNumber } from '../utils';

const passengerCategories = UI_LABELS.HOME.search.passenger_categories;

const buildTariffOptions = (outbound, returnFlight) => {
  const map = {};
  (outbound?.tariffs || []).forEach((t) => {
    map[t.seat_class] = {
      price: t.price,
      currency: t.currency,
      seats_left: t.seats_left
    };
  });
  if (returnFlight) {
    (returnFlight.tariffs || []).forEach((t) => {
      if (map[t.seat_class]) {
        map[t.seat_class].price += t.price;
        if (t.seats_left !== undefined) {
          const current = map[t.seat_class].seats_left;
          map[t.seat_class].seats_left =
            current !== undefined ? Math.min(current, t.seats_left) : t.seats_left;
        }
      } else {
        map[t.seat_class] = {
          price: t.price,
          currency: t.currency,
          seats_left: t.seats_left
        };
      }
    });
  }
  return Object.entries(map).map(([seat_class, info]) => ({
    seat_class,
    ...info
  }));
};

const FlightInfo = ({ flight, airlines, airports, routes }) => {
  if (!flight) return null;
  const airline = airlines.find((a) => a.id === flight.airline_id) || {};
  const route = routes.find((r) => r.id === flight.route_id) || {};
  const origin = airports.find((a) => a.id === route.origin_airport_id) || {};
  const dest = airports.find((a) => a.id === route.destination_airport_id) || {};

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
        {airline.name || airline.id}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {origin.name || origin.id} → {dest.name || dest.id}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {formatDate(flight.scheduled_departure, 'dd.MM.yyyy')} {formatTime(flight.scheduled_departure_time)} - {formatDate(flight.scheduled_arrival, 'dd.MM.yyyy')} {formatTime(flight.scheduled_arrival_time)}
      </Typography>
    </Box>
  );
};

const SelectTicketDialog = ({ open, onClose, outbound, returnFlight, airlines, airports, routes }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const tariffOptions = useMemo(
    () => buildTariffOptions(outbound, returnFlight),
    [outbound, returnFlight]
  );

  const initialSeatClass = params.get('class') || tariffOptions[0]?.seat_class || '';
  const [seatClass, setSeatClass] = useState(initialSeatClass);

  const [passengers, setPassengers] = useState({
    adults: parseInt(params.get('adults') || '1', 10),
    children: parseInt(params.get('children') || '0', 10),
    infants: parseInt(params.get('infants') || '0', 10)
  });

  const totalPassengers =
    passengers.adults + passengers.children + passengers.infants;

  const selectedTariff = tariffOptions.find((t) => t.seat_class === seatClass) || tariffOptions[0];
  const currencySymbol = selectedTariff
    ? ENUM_LABELS.CURRENCY_SYMBOL[selectedTariff.currency] || ''
    : '';
  const totalPrice = selectedTariff
    ? selectedTariff.price * totalPassengers
    : 0;

  const handlePassengerChange = (key, delta) => {
    setPassengers((prev) => {
      const nextVal = prev[key] + delta;
      const newTotal =
        prev.adults + prev.children + prev.infants + delta;
      const min = key === 'adults' ? 1 : 0;
      if (nextVal < min || newTotal < 1 || newTotal > MAX_PASSENGERS)
        return prev;
      return { ...prev, [key]: nextVal };
    });
  };

  const handleConfirm = () => {
    const query = new URLSearchParams();
    query.set('flight', outbound.id);
    if (returnFlight) query.set('return', returnFlight.id);
    if (seatClass) query.set('class', seatClass);
    query.set('adults', passengers.adults);
    query.set('children', passengers.children);
    query.set('infants', passengers.infants);
    navigate(`/cart?${query.toString()}`);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{UI_LABELS.SEARCH.flight_details.select_flight}</DialogTitle>
      <DialogContent dividers>
        <FlightInfo
          flight={outbound}
          airlines={airlines}
          airports={airports}
          routes={routes}
        />
        {returnFlight && (
          <>
            <FlightInfo
              flight={returnFlight}
              airlines={airlines}
              airports={airports}
              routes={routes}
            />
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        <Typography gutterBottom>
          {UI_LABELS.HOME.search.seat_class_title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {tariffOptions.map((t) => (
            <Card
              key={t.seat_class}
              variant={t.seat_class === seatClass ? 'outlined' : 'elevation'}
              sx={{ minWidth: 100 }}
            >
              <CardActionArea onClick={() => setSeatClass(t.seat_class)} sx={{ p: 1 }}>
                <Typography>{ENUM_LABELS.SEAT_CLASS[t.seat_class]}</Typography>
                <Typography>
                  {formatNumber(t.price)} {ENUM_LABELS.CURRENCY_SYMBOL[t.currency] || ''}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Мест: {t.seats_left ?? '-'}
                </Typography>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        <Typography gutterBottom>
          {UI_LABELS.HOME.search.passengers}
        </Typography>
        <Box>
          {passengerCategories.map((row) => (
            <Card key={row.key} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography>{row.label}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {row.desc}
                </Typography>
              </Box>
              <IconButton
                onClick={() => handlePassengerChange(row.key, -1)}
                disabled={
                  passengers[row.key] <= (row.key === 'adults' ? 1 : 0)
                }
              >
                -
              </IconButton>
              <Typography sx={{ width: 20, textAlign: 'center' }}>
                {passengers[row.key]}
              </Typography>
              <IconButton
                onClick={() => handlePassengerChange(row.key, 1)}
                disabled={totalPassengers >= MAX_PASSENGERS}
              >
                +
              </IconButton>
            </Card>
          ))}
        </Box>

        <Typography sx={{ mt: 2, textAlign: 'right' }}>
          {UI_LABELS.SEARCH.flight_details.price}: {formatNumber(totalPrice)} {currencySymbol}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{UI_LABELS.BUTTONS.close}</Button>
        <Button
          variant='contained'
          color='orange'
          onClick={handleConfirm}
        >
          {UI_LABELS.SEARCH.flight_details.select_flight}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectTicketDialog;

