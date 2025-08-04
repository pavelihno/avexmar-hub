import React, { useState, useEffect } from 'react';

import { Box, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { differenceInYears } from 'date-fns';

import { dateLocale, ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const typeLabels = UI_LABELS.BOOKING.passenger_form.type_labels;

const genderOptions = UI_LABELS.BOOKING.passenger_form.genders;

const docTypeOptions = Object.entries(ENUM_LABELS.DOCUMENT_TYPE).map(([value, label]) => ({ value, label }));

const getAgeError = (type, birthDate) => {
	if (!birthDate) return VALIDATION_MESSAGES.PASSENGER.birth_date.REQUIRED;
	const age = differenceInYears(new Date(), new Date(birthDate));
	if (type === 'ADULT' && age < 12) return VALIDATION_MESSAGES.PASSENGER.birth_date.ADULT;
	if (type === 'CHILD' && (age < 2 || age > 12)) return VALIDATION_MESSAGES.PASSENGER.birth_date.CHILD;
	if (type === 'INFANT' && age >= 2) return VALIDATION_MESSAGES.PASSENGER.birth_date.INFANT;
	return '';
};

const PassengerForm = ({ passenger, onChange, onRemove, onSelectDocument }) => {
	const [data, setData] = useState({
		id: passenger?.id || '',
		type: passenger?.type || 'ADULT',
		lastName: passenger?.lastName || '',
		firstName: passenger?.firstName || '',
		gender: passenger?.gender || 'MALE',
		birthDate: passenger?.birthDate || '',
		documentType: passenger?.documentType || 'passport',
		documentNumber: passenger?.documentNumber || '',
	});

	const [errors, setErrors] = useState({});

	useEffect(() => {
		setData((prev) => ({ ...prev, ...passenger }));
	}, [passenger]);

	const handleFieldChange = (field, value) => {
		const next = { ...data, [field]: value };
		setData(next);
		if (onChange) onChange(field, value, next);
		if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
	};

	const validate = () => {
		const errs = {};
		if (!data.lastName) errs.lastName = VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED;
		if (!data.firstName) errs.firstName = VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED;
		const ageErr = getAgeError(data.type, data.birthDate);
		if (ageErr) errs.birthDate = ageErr;
		if (!data.documentType) errs.documentType = VALIDATION_MESSAGES.PASSENGER.document_type.REQUIRED;
		if (!data.documentNumber) errs.documentNumber = VALIDATION_MESSAGES.PASSENGER.document_number.REQUIRED;
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	useEffect(() => {
		validate();
	}, [data.type, data.birthDate]);

	const theme = useTheme();

	return (
		<Box sx={{ p: 2, border: `1px solid ${theme.palette.grey[200]}`, borderRadius: 2, mb: 3 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 2,
				}}
			>
				<Typography variant='h6'>{typeLabels[data.type]}</Typography>
				<Box>
					{onSelectDocument && (
						<IconButton onClick={onSelectDocument} size='small'>
							<DescriptionIcon />
						</IconButton>
					)}
					{onRemove && (
						<IconButton onClick={onRemove} size='small'>
							<DeleteIcon />
						</IconButton>
					)}
				</Box>
			</Box>
			<Grid container spacing={2}>
				<Grid item xs={12} sm={6}>
					<TextField
						label={FIELD_LABELS.PASSENGER.last_name}
						value={data.lastName}
						onChange={(e) => handleFieldChange('lastName', e.target.value)}
						fullWidth
						error={!!errors.lastName}
						helperText={errors.lastName}
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<TextField
						label={FIELD_LABELS.PASSENGER.first_name}
						value={data.firstName}
						onChange={(e) => handleFieldChange('firstName', e.target.value)}
						fullWidth
						error={!!errors.firstName}
						helperText={errors.firstName}
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<FormControl fullWidth error={!!errors.gender}>
						<InputLabel>{FIELD_LABELS.PASSENGER.gender}</InputLabel>
						<Select
							value={data.gender}
							label={FIELD_LABELS.PASSENGER.gender}
							onChange={(e) => handleFieldChange('gender', e.target.value)}
						>
							{genderOptions.map((o) => (
								<MenuItem key={o.value} value={o.value}>
									{o.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={6}>
					<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
						<DatePicker
							label={FIELD_LABELS.PASSENGER.birth_date}
							value={data.birthDate ? new Date(data.birthDate) : null}
							onChange={(date) =>
								handleFieldChange('birthDate', date ? date.toISOString().slice(0, 10) : '')
							}
							slotProps={{
								textField: {
									fullWidth: true,
									error: !!errors.birthDate,
									helperText: errors.birthDate,
								},
							}}
						/>
					</LocalizationProvider>
				</Grid>
				<Grid item xs={12} sm={6}>
					<FormControl fullWidth error={!!errors.documentType}>
						<InputLabel>{FIELD_LABELS.PASSENGER.document_type}</InputLabel>
						<Select
							value={data.documentType}
							label={FIELD_LABELS.PASSENGER.document_type}
							onChange={(e) => handleFieldChange('documentType', e.target.value)}
						>
							{docTypeOptions.map((o) => (
								<MenuItem key={o.value} value={o.value}>
									{o.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={6}>
					<TextField
						label={FIELD_LABELS.PASSENGER.document_number}
						value={data.documentNumber}
						onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
						fullWidth
						error={!!errors.documentNumber}
						helperText={errors.documentNumber}
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default PassengerForm;
