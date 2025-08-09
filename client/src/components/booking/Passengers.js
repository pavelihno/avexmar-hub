import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Grid, Typography, Card, CardContent, TextField, Checkbox, FormControlLabel, Button } from '@mui/material';
import Base from '../Base';
import BookingProgress from './BookingProgress';
import PassengerForm from './PassengerForm';
import { processBookingPassengers } from '../../redux/actions/bookingProcess';
import { FIELD_LABELS, UI_LABELS } from '../../constants';


const Passengers = () => {
        const { publicId } = useParams();
        const navigate = useNavigate();
        const dispatch = useDispatch();
        const passengers = [{ id: 1, type: 'ADULT' }];
        const [passengerData, setPassengerData] = useState(passengers);
        const [buyer, setBuyer] = useState({ lastName: '', firstName: '', email: '', phone: '', consent: false });

        const handlePassengerChange = (id) => (field, value, data) => {
                setPassengerData((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
        };

        const handleContinue = async () => {
                await dispatch(processBookingPassengers({ public_id: publicId, passengers: passengerData, buyer }));
                navigate(`/booking/${publicId}/confirmation`);
        };

        return (
                <Base maxWidth='lg'>
                        <BookingProgress activeStep={0} />
                        <Grid container spacing={2}>
                                <Grid item xs={12} md={8}>
                                        {passengers.map((p) => (
                                                <PassengerForm key={p.id} passenger={p} onChange={handlePassengerChange(p.id)} />
                                        ))}
                                        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, mb: 2 }}>
                                                <Typography variant='h6' sx={{ mb: 2 }}>
                                                        {UI_LABELS.BOOKING.buyer_form.title}
                                                </Typography>
                                                <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={6}>
                                                                <TextField label={FIELD_LABELS.PASSENGER.last_name} value={buyer.lastName} onChange={(e) => setBuyer({ ...buyer, lastName: e.target.value })} fullWidth />
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                                <TextField label={FIELD_LABELS.PASSENGER.first_name} value={buyer.firstName} onChange={(e) => setBuyer({ ...buyer, firstName: e.target.value })} fullWidth />
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                                <TextField label={FIELD_LABELS.BOOKING.email_address} value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} fullWidth />
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                                <TextField label={FIELD_LABELS.BOOKING.phone_number} value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} fullWidth />
                                                        </Grid>
                                                </Grid>
                                                <FormControlLabel
                                                        sx={{ mt: 2 }}
                                                        control={<Checkbox checked={buyer.consent} onChange={(e) => setBuyer({ ...buyer, consent: e.target.checked })} />}
                                                        label={UI_LABELS.BOOKING.buyer_form.consent}
                                                />
                                        </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                        <Card>
                                                <CardContent>
                                                        <Typography variant='h6' gutterBottom>
                                                                {UI_LABELS.BOOKING.buyer_form.summary.total_for(passengers.length)}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                <Typography>{UI_LABELS.BOOKING.buyer_form.summary.tickets}</Typography>
                                                                <Typography>0 ₽</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                <Typography>{UI_LABELS.BOOKING.buyer_form.summary.service_fee}</Typography>
                                                                <Typography>0 ₽</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                                <Typography>{UI_LABELS.BOOKING.buyer_form.summary.discount}</Typography>
                                                                <Typography>0 ₽</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                                <Typography variant='subtitle1'>{UI_LABELS.BOOKING.buyer_form.summary.total}</Typography>
                                                                <Typography variant='subtitle1'>0 ₽</Typography>
                                                        </Box>
                                                        <Button variant='contained' fullWidth onClick={handleContinue}>
                                                                {UI_LABELS.BUTTONS.continue}
                                                        </Button>
                                                </CardContent>
                                        </Card>
                                </Grid>
                        </Grid>
                </Base>
        );
};

export default Passengers;
