import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import {
	Alert,
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
		emailAddress: '',
		consent: false,
	});
        const [errors, setErrors] = useState({});
        const [successMessage, setSuccessMessage] = useState('');
        const [lastSubmittedData, setLastSubmittedData] = useState(null);

	const formFields = useMemo(() => {
		const fields = {
			lastName: {
				key: 'lastName',
				label: FIELD_LABELS.PASSENGER.last_name,
				type: FIELD_TYPES.TEXT,
				validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED : ''),
			},
			firstName: {
				key: 'firstName',
				label: FIELD_LABELS.PASSENGER.first_name,
				type: FIELD_TYPES.TEXT,
				validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED : ''),
			},
			phoneNumber: {
				key: 'phoneNumber',
				label: FIELD_LABELS.BOOKING.phone_number,
				type: FIELD_TYPES.PHONE,
				validate: (v) => (!v ? VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED : ''),
			},
			emailAddress: {
				key: 'emailAddress',
				label: FIELD_LABELS.BOOKING.email_address,
				type: FIELD_TYPES.EMAIL,
				inputProps: { readOnly: true },
			},
		};
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, []);

	useEffect(() => {
		if (currentUser) {
                        const initData = {
                                firstName: currentUser.first_name || '',
                                lastName: currentUser.last_name || '',
                                phoneNumber: currentUser.phone_number || '',
                                emailAddress: currentUser.email_address || currentUser.email || '',
                        };
                        setFormData((prev) => ({ ...prev, ...initData }));
                        setLastSubmittedData(initData);
                }
        }, [currentUser]);

        const handleFieldChange = (field, value) => {
                setFormData((prev) => {
                        const updated = { ...prev, [field]: value };
                        if (field !== 'consent' && lastSubmittedData && value !== lastSubmittedData[field]) {
                                updated.consent = false;
                        }
                        return updated;
                });
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
		if (!formData.consent) {
			newErrors.consent = VALIDATION_MESSAGES.BOOKING.consent.REQUIRED;
		}
		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			return;
		}
                setSuccessMessage('');
                dispatch(
                        updateUser({
                                id: currentUser.id,
                                first_name: formData.firstName,
                                last_name: formData.lastName,
                                phone_number: formData.phoneNumber,
                                consent: formData.consent,
                        })
                )
                        .unwrap()
                        .then((user) => {
                                dispatch(setCurrentUser(user));
                                setErrors({});
                                setSuccessMessage(UI_LABELS.SUCCESS.update);
                                setLastSubmittedData({
                                        firstName: formData.firstName,
                                        lastName: formData.lastName,
                                        phoneNumber: formData.phoneNumber,
                                        emailAddress: formData.emailAddress,
                                });
                        })
                        .catch((res) => setErrors(res));
        };

	return (
		<Paper sx={{ p: 2, width: '100%' }}>
			<Typography variant='h4' sx={{ mb: 2 }}>
				{UI_LABELS.PROFILE.user_info}
			</Typography>
			<Box component='form' onSubmit={handleSubmit}>
				{errors.message && (
					<Alert severity='error' sx={{ mb: 2 }}>
						{errors.message}
					</Alert>
				)}
                                {successMessage && (
                                        <Alert severity='success' sx={{ mb: 2 }}>
                                                {successMessage}
                                        </Alert>
                                )}
                                {['lastName', 'firstName', 'phoneNumber', 'emailAddress'].map((name, idx) => {
                                        const field = formFields[name];
                                        return (
                                                <Box key={name} sx={{ mt: idx ? 2 : 0 }}>
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
				<FormControl required error={!!errors.consent} sx={{ mt: 2 }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={formData.consent}
								onChange={(e) => handleFieldChange('consent', e.target.checked)}
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
					{errors.consent && <FormHelperText>{errors.consent}</FormHelperText>}
				</FormControl>
				<Button type='submit' fullWidth variant='contained' sx={{ mt: 2 }} disabled={!formData.consent}>
					{UI_LABELS.BUTTONS.save_changes}
				</Button>
			</Box>
		</Paper>
	);
};

export default UserInfo;
