import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Box,
    Alert,
    Fade,
} from '@mui/material';

import {
    createFlightTariff,
    updateFlightTariff,
    fetchFlightTariff,
} from '../../redux/actions/flight_tariff';
import { fetchTariffs } from '../../redux/actions/tariff';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, ENUM_LABELS } from '../../constants';

export const FlightTariffManagement = ({ flightId, tariffDialogOpen, onClose, action = 'add', tariffId }) => {
    const dispatch = useDispatch();
    const { tariffs } = useSelector((state) => state.tariffs);
    const { flightTariff, isLoading } = useSelector((state) => state.flightTariffs);

    const isEditing = action === 'edit';

    const [formData, setFormData] = useState({ seatClass: '', seatsNumber: '', tariffId: '' });
    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!tariffs || tariffs.length === 0) {
            dispatch(fetchTariffs());
        }
    }, [dispatch, tariffs]);

    useEffect(() => {
        if (isEditing && tariffId) {
            dispatch(fetchFlightTariff(tariffId));
        }
    }, [isEditing, tariffId, dispatch]);

    useEffect(() => {
        if (isEditing && flightTariff && tariffs.length) {
            const baseTariff = tariffs.find((t) => t.id === flightTariff.tariff_id) || {};
            setFormData({
                seatClass: baseTariff.seat_class || '',
                seatsNumber: flightTariff.seats_number || '',
                tariffId: flightTariff.tariff_id || '',
            });
        }
    }, [isEditing, flightTariff, tariffs]);

    useEffect(() => {
        if (tariffDialogOpen && !isEditing) {
            setFormData({ seatClass: '', seatsNumber: '', tariffId: '' });
            setErrors({});
            setErrorMessage('');
            setSuccessMessage('');
        }
    }, [tariffDialogOpen, isEditing]);

    const tariffOptions = useMemo(() => {
        return tariffs
            .filter((t) => t.seat_class === formData.seatClass)
            .map((t) => ({
                value: t.id,
                label: `${ENUM_LABELS.SEAT_CLASS[t.seat_class]} - ${UI_LABELS.ADMIN.modules.tariffs.tariff} ${t.order_number}`,
            }));
    }, [tariffs, formData.seatClass]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
        if (successMessage) setSuccessMessage('');
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.seatClass) newErrors.seatClass = VALIDATION_MESSAGES.TARIFF.seat_class.REQUIRED;
        if (formData.seatsNumber === '' || formData.seatsNumber === null || formData.seatsNumber === undefined) {
            newErrors.seatsNumber = VALIDATION_MESSAGES.TARIFF.seats_number.REQUIRED;
        }
        if (!formData.tariffId) newErrors.tariffId = UI_LABELS.MESSAGES.required_field;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const payload = {
            flight_id: flightId,
            tariff_id: formData.tariffId,
            seats_number: formData.seatsNumber,
        };
        if (isEditing) payload.id = tariffId;

        try {
            await dispatch(isEditing ? updateFlightTariff(payload) : createFlightTariff(payload)).unwrap();
            setSuccessMessage(isEditing ? UI_LABELS.SUCCESS.update : UI_LABELS.SUCCESS.add);
            setErrorMessage('');
            setTimeout(() => onClose(), 500);
        } catch (error) {
            let message = '';
            if (typeof error === 'string') message = error;
            else if (error?.message) message = error.message;
            else if (error?.errors) {
                message = Object.entries(error.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join('; ');
            } else {
                message = UI_LABELS.ERRORS.unknown;
            }
            setErrorMessage(message);
            setSuccessMessage('');
        }
    };

    if (isEditing && isLoading && !flightTariff) {
        return (
            <Dialog open={tariffDialogOpen} onClose={onClose} maxWidth='sm' fullWidth>
                <DialogContent>
                    <Typography>{UI_LABELS.MESSAGES.loading}</Typography>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={tariffDialogOpen} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>
                {isEditing ? UI_LABELS.ADMIN.modules.tariffs.edit_button : UI_LABELS.ADMIN.modules.tariffs.add_button}
            </DialogTitle>
            <Box sx={{ px: 3 }}>
                <Fade in={!!errorMessage} timeout={300}>
                    <div>{errorMessage && <Alert severity='error'>{errorMessage}</Alert>}</div>
                </Fade>
                <Fade in={!!successMessage} timeout={300}>
                    <div>{successMessage && <Alert severity='success'>{successMessage}</Alert>}</div>
                </Fade>
            </Box>
            <DialogContent>
                <FormControl fullWidth margin='dense' error={!!errors.seatClass}>
                    <InputLabel>{FIELD_LABELS.TARIFF.seat_class}</InputLabel>
                    <Select
                        value={formData.seatClass}
                        label={FIELD_LABELS.TARIFF.seat_class}
                        onChange={(e) => handleChange('seatClass', e.target.value)}
                    >
                        {Object.entries(ENUM_LABELS.SEAT_CLASS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                                {label}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.seatClass && <FormHelperText>{errors.seatClass}</FormHelperText>}
                </FormControl>

                <TextField
                    margin='dense'
                    label={FIELD_LABELS.FLIGHT_TARIFF.seats_number}
                    type='number'
                    fullWidth
                    value={formData.seatsNumber}
                    onChange={(e) => handleChange('seatsNumber', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    inputProps={{ min: 0, step: 1 }}
                    error={!!errors.seatsNumber}
                    helperText={errors.seatsNumber}
                />

                <FormControl fullWidth margin='dense' error={!!errors.tariffId} disabled={!formData.seatClass}>
                    <InputLabel>{FIELD_LABELS.FLIGHT_TARIFF.tariff_id}</InputLabel>
                    <Select
                        value={formData.tariffId}
                        label={FIELD_LABELS.FLIGHT_TARIFF.tariff_id}
                        onChange={(e) => handleChange('tariffId', e.target.value)}
                    >
                        {tariffOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.tariffId && <FormHelperText>{errors.tariffId}</FormHelperText>}
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{UI_LABELS.BUTTONS.cancel}</Button>
                <Button onClick={handleSubmit} variant='contained'>
                    {UI_LABELS.BUTTONS.save}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FlightTariffManagement;
