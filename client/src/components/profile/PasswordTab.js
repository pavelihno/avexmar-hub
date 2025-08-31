import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { Box, Button, Alert, Paper, Typography, CircularProgress } from '@mui/material';

import { changePassword } from '../../redux/actions/user';
import { UI_LABELS } from '../../constants/uiLabels';
import { VALIDATION_MESSAGES } from '../../constants/validationMessages';
import { createFormFields, FIELD_TYPES } from '../utils';

const PasswordTab = () => {
	const dispatch = useDispatch();
	const [passwordData, setPasswordData] = useState({
		newPassword: '',
		confirmPassword: '',
		code: '',
	});
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');
	const [codeSent, setCodeSent] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const formFields = useMemo(() => {
		const fields = {
			newPassword: {
				key: 'newPassword',
				label: UI_LABELS.AUTH.new_password,
				type: FIELD_TYPES.TEXT,
				inputProps: { type: 'password' },
				validate: (v) => (!v ? VALIDATION_MESSAGES.USER.password.REQUIRED : ''),
			},
			confirmPassword: {
				key: 'confirmPassword',
				label: UI_LABELS.AUTH.confirm_password,
				type: FIELD_TYPES.TEXT,
				inputProps: { type: 'password' },
				validate: (v) => (!v ? VALIDATION_MESSAGES.USER.password2.REQUIRED : ''),
			},
			code: { key: 'code', label: UI_LABELS.AUTH.two_factor_code_label },
		};
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, []);

	const handleFieldChange = (field, value) => {
		setPasswordData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const newErrors = {};
		['newPassword', 'confirmPassword'].forEach((name) => {
			const field = formFields[name];
			if (field?.validate) {
				const err = field.validate(passwordData[name]);
				if (err) newErrors[name] = err;
			}
		});
		if (
			!newErrors.newPassword &&
			!newErrors.confirmPassword &&
			passwordData.newPassword !== passwordData.confirmPassword
		) {
			newErrors.confirmPassword = UI_LABELS.PROFILE.passwords_dont_match;
		}
		if (codeSent && !passwordData.code) {
			newErrors.code = VALIDATION_MESSAGES.AUTH.code.REQUIRED;
		}
		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			return;
		}
		setIsSubmitting(true);
		dispatch(
			changePassword({
				password: passwordData.newPassword,
				code: codeSent ? passwordData.code : undefined,
			})
		)
			.unwrap()
			.then((res) => {
				if (res.message) {
					setCodeSent(true);
					setSuccessMessage(UI_LABELS.PROFILE.verification_code_sent);
				} else {
					setPasswordData({
						newPassword: '',
						confirmPassword: '',
						code: '',
					});
					setErrors({});
					setCodeSent(false);
					setSuccessMessage(UI_LABELS.PROFILE.password_changed);
				}
			})
			.catch((res) => {
				setErrors(res);
			})
			.finally(() => setIsSubmitting(false));
	};

	return (
		<Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
			<Typography variant='h4' sx={{ mb: 2 }}>
				{UI_LABELS.PROFILE.change_password}
			</Typography>
			<Box component='form' onSubmit={handleSubmit}>
				{errors.message && (
					<Alert severity='error' sx={{ mb: 2 }}>
						{errors.message}
					</Alert>
				)}
				{successMessage && (
					<Alert severity={codeSent ? 'info' : 'success'} sx={{ mb: 2 }}>
						{successMessage}
					</Alert>
				)}
				{['newPassword', 'confirmPassword'].map((name, idx) => {
					const field = formFields[name];
					return (
						<Box key={name} sx={{ mt: idx ? 2 : 0 }}>
							{field.renderField({
								value: passwordData[name],
								onChange: (val) => handleFieldChange(name, val),
								fullWidth: true,
								error: !!errors[name],
								helperText: errors[name] || '',
								disabled: isSubmitting || codeSent,
							})}
						</Box>
					);
				})}
				{codeSent && (
					<Box sx={{ mt: 1 }}>
						{formFields.code.renderField({
							value: passwordData.code,
							onChange: (val) => handleFieldChange('code', val),
							fullWidth: true,
							error: !!errors.code,
							helperText: errors.code || '',
							disabled: isSubmitting,
						})}
					</Box>
				)}
				<Button
					type='submit'
					fullWidth
					variant='contained'
					sx={{ mt: 2 }}
					disabled={(codeSent && !passwordData.code) || isSubmitting}
				>
					{isSubmitting ? <CircularProgress size={24} color='inherit' /> : UI_LABELS.BUTTONS.change_password}
				</Button>
			</Box>
		</Paper>
	);
};

export default PasswordTab;
