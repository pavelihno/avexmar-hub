import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
	Box,
	Typography,
        Paper,
        Button,
        FormControl,
        FormControlLabel,
        Checkbox,
        FormHelperText,
} from '@mui/material';

import { UI_LABELS } from '../../constants/uiLabels';
import { FIELD_LABELS } from '../../constants/fieldLabels';
import { VALIDATION_MESSAGES } from '../../constants/validationMessages';
import { updateUser } from '../../redux/actions/user';
import { setCurrentUser } from '../../redux/reducers/auth';
import { createFormFields, FIELD_TYPES } from '../utils';

const UserInfo = () => {
        const dispatch = useDispatch();
        const currentUser = useSelector((state) => state.auth.currentUser);
        const [formData, setFormData] = useState({
                firstName: '',
                lastName: '',
                phoneNumber: '',
                consent: false,
        });
        const [errors, setErrors] = useState({});

        const formFields = useMemo(() => {
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
                        phoneNumber: {
                                key: 'phoneNumber',
                                label: FIELD_LABELS.BOOKING.phone_number,
                                validate: (v) => (!v ? VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED : ''),
                        },
                        consent: {
                                key: 'consent',
                                type: FIELD_TYPES.CUSTOM,
                                renderField: ({ value, onChange, error, helperText }) => (
                                        <FormControl required error={error} sx={{ mt: 2 }}>
                                                <FormControlLabel
                                                        control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />}
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
                                                {error && <FormHelperText>{helperText}</FormHelperText>}
                                        </FormControl>
                                ),
                                validate: (v) => (v ? '' : VALIDATION_MESSAGES.BOOKING.consent.REQUIRED),
                        },
                };
                const arr = createFormFields(fields);
                return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
        }, []);

        useEffect(() => {
                if (currentUser) {
                        setFormData((prev) => ({
                                ...prev,
                                firstName: currentUser.first_name || '',
                                lastName: currentUser.last_name || '',
                                phoneNumber: currentUser.phone_number || '',
                        }));
                }
        }, [currentUser]);

        const handleFieldChange = (field, value) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
                if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
        };

        const handleSubmit = (e) => {
                e.preventDefault();
                const newErrors = {};
                Object.values(formFields).forEach((f) => {
                        if (f.validate) {
                                const err = f.validate(formData[f.name]);
                                if (err) newErrors[f.name] = err;
                        }
                });
                if (Object.keys(newErrors).length) {
                        setErrors(newErrors);
                        return;
                }
                dispatch(
                        updateUser({
                                id: currentUser.id,
                                first_name: formData.firstName,
                                last_name: formData.lastName,
                                phone_number: formData.phoneNumber,
                                consent: formData.consent,
                        }),
                )
                        .unwrap()
                        .then((user) => {
                                dispatch(setCurrentUser(user));
                                setErrors({});
                                setFormData((prev) => ({ ...prev, consent: false }));
                        })
                        .catch((res) => setErrors(res));
        };

        return (
                <Paper sx={{ p: 2, width: '100%', maxWidth: 400 }}>
                        <Typography variant='h6' sx={{ mb: 2 }}>
                                {UI_LABELS.PROFILE.user_info}
                        </Typography>
                        <Box component='form' onSubmit={handleSubmit}>
                                {['lastName', 'firstName', 'phoneNumber'].map((name, idx) => {
                                        const field = formFields[name];
                                        return (
                                                <Box key={name} sx={{ mt: idx ? 1 : 0 }}>
                                                        {field.renderField({
                                                                value: formData[name],
                                                                onChange: (val) => handleFieldChange(name, val),
                                                                fullWidth: true,
                                                                error: !!errors[name],
                                                                helperText: errors[name] || '',
                                                        })}
                                                </Box>
                                        );
                                })}
                                {formFields.consent.renderField({
                                        value: formData.consent,
                                        onChange: (val) => handleFieldChange('consent', val),
                                        error: !!errors.consent,
                                        helperText: errors.consent || '',
                                })}
                                <Button type='submit' fullWidth variant='contained' sx={{ mt: 2 }}>
                                        {UI_LABELS.BUTTONS.save_changes}
                                </Button>
                        </Box>
                </Paper>
        );
};

export default UserInfo;
