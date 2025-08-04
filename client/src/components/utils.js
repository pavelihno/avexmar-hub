import React from 'react';
import {
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Checkbox,
	FormControlLabel,
	FormHelperText,
	Autocomplete,
} from '@mui/material';
import { DatePicker, DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { format, parse, isValid } from 'date-fns';
import numeral from 'numeral';

import {
	dateLocale,
	DATE_FORMAT,
	TIME_FORMAT,
	DATETIME_FORMAT,
	DEFAULT_EMAIL,
	DEFAULT_PHONE_NUMBER,
	TIME_MASK,
	TIME_DURATION_FORMAT,
	DEFAULT_NUMBER_FORMAT,
} from '../constants';

export const FIELD_TYPES = {
	TEXT: 'text',
	TEXT_AREA: 'text_area',
	NUMBER: 'number',
	EMAIL: 'email',
	PHONE: 'phone',
	DATE: 'date',
	TIME: 'time',
	DATETIME: 'dateTime',
	SELECT: 'select',
	BOOLEAN: 'boolean',
	CUSTOM: 'custom',
};

export const createFieldRenderer = (field, defaultProps = {}) => {
	const type = field.type || FIELD_TYPES.TEXT;

	return (props = {}) => {
		const allProps = { ...defaultProps, ...props };

		switch (type) {
			case FIELD_TYPES.EMAIL: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						inputProps={{
							placeholder: DEFAULT_EMAIL,
							type: 'email',
							autoComplete: 'email',
							...field.inputProps,
							...inputProps,
						}}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.PHONE: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						inputProps={{
							placeholder: DEFAULT_PHONE_NUMBER,
							type: 'tel',
							autoComplete: 'tel',
							...field.inputProps,
							...inputProps,
						}}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.TEXT: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						inputProps={{ ...field.inputProps, ...inputProps }}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.TEXT_AREA: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						multiline
						rows={field.rows || 5}
						inputProps={{ ...field.inputProps, ...inputProps }}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.NUMBER: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => {
							const val = e.target.value;
							const numValue = field.float ? parseFloat(val) : parseInt(val, 10);
							onChange(val === '' ? '' : numValue);
						}}
						type='number'
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						inputProps={{ step: field.float ? 0.01 : 1, ...field.inputProps, ...inputProps }}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.DATE: {
				const { value, onChange, fullWidth, error, helperText, sx, minDate, textFieldProps } = allProps;
				return (
					<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
						<DatePicker
							label={field.label}
							value={value ? new Date(value) : null}
							onChange={(date) => onChange(date)}
							minDate={minDate}
							format={field.dateFormat || DATE_FORMAT}
							slotProps={{
								textField: {
									fullWidth,
									error,
									helperText: error ? helperText : '',
									sx,
									...textFieldProps,
								},
							}}
						/>
					</LocalizationProvider>
				);
			}

			case FIELD_TYPES.TIME: {
				const { value, onChange, fullWidth, error, helperText, sx, textFieldProps } = allProps;

				return (
					<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
						<TimePicker
							label={field.label}
							value={value ? new Date(value) : null}
							onChange={(time) => onChange(time)}
							ampm={false}
							format={field.timeFormat || TIME_FORMAT}
							mask={TIME_MASK}
							slotProps={{
								textField: {
									fullWidth,
									error,
									helperText: error ? helperText : '',
									sx,
									...textFieldProps,
								},
							}}
						/>
					</LocalizationProvider>
				);
			}

			case FIELD_TYPES.DATETIME: {
				const { value, onChange, fullWidth, error, helperText, sx, textFieldProps } = allProps;
				return (
					<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
						<DateTimePicker
							label={field.label}
							value={value ? new Date(value) : null}
							onChange={(dateTime) => onChange(dateTime)}
							format={field.dateTimeFormat || DATETIME_FORMAT}
							slotProps={{
								textField: {
									fullWidth,
									error,
									helperText: error ? helperText : '',
									sx,
									...textFieldProps,
								},
							}}
						/>
					</LocalizationProvider>
				);
			}

			case FIELD_TYPES.SELECT: {
				const {
					value = '',
					onChange,
					fullWidth,
					error,
					helperText,
					options = field.options || [],
					MenuProps,
					MenuItemProps,
					displayEmpty,
					simpleSelect,
					sx,
				} = allProps;

				if (!simpleSelect && options.length > 100) {
					const valueObj = options.find((o) => o.value === value) || null;
					return (
						<Autocomplete
							options={options}
							value={valueObj}
							onChange={(e, val) => onChange(val ? val.value : '')}
							filterOptions={(opts, state) =>
								opts
									.filter((o) => o.label.toLowerCase().includes(state.inputValue.toLowerCase()))
									.slice(0, 100)
							}
							getOptionLabel={(o) => o.label}
							renderInput={(params) => (
								<TextField
									{...params}
									label={field.label}
									error={error}
									helperText={error ? helperText : ''}
									fullWidth={fullWidth}
									sx={{ ...sx }}
								/>
							)}
						/>
					);
				}

				if (simpleSelect) {
					return (
						<Select
							value={value || field.defaultValue || ''}
							onChange={(e) => onChange(e.target.value)}
							fullWidth={fullWidth}
							MenuProps={MenuProps}
							displayEmpty={displayEmpty}
							sx={{ ...sx }}
						>
							{options.map((option) => (
								<MenuItem key={option.value} value={option.value} {...MenuItemProps}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					);
				}

				return (
					<FormControl fullWidth={fullWidth} error={!!error}>
						<InputLabel>{field.label}</InputLabel>
						<Select
							value={value || field.defaultValue || ''}
							onChange={(e) => onChange(e.target.value)}
							label={field.label}
							MenuProps={MenuProps}
							displayEmpty={displayEmpty}
							sx={{ ...sx }}
						>
							{options.map((option) => (
								<MenuItem key={option.value} value={option.value} {...MenuItemProps}>
									{option.label}
								</MenuItem>
							))}
						</Select>
						{error && <FormHelperText>{helperText}</FormHelperText>}
					</FormControl>
				);
			}

			case FIELD_TYPES.BOOLEAN: {
				const { value = false, onChange, sx } = allProps;
				return (
					<FormControlLabel
						control={
							<Checkbox checked={!!value} onChange={(e) => onChange(e.target.checked)} color='primary' />
						}
						label={field.label}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.CUSTOM:
				return (customProps) => field.renderField({ ...allProps, ...customProps });

			default: {
				const { value = '', onChange, fullWidth, inputProps, sx } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						inputProps={{ ...field.inputProps, ...inputProps }}
						sx={{ ...sx }}
					/>
				);
			}
		}
	};
};

export const createFormFields = (fields) => {
	return Object.values(fields)
		.filter((field) => field.key !== 'id' && !field.excludeFromForm)
		.map((field) => ({
			name: field.key,
			fullWidth: field.fullWidth || false,
			defaultValue: field.defaultValue,
			renderField: createFieldRenderer(field),
			validate: field.validate,
		}));
};

export const formatDate = (value, dateFormat = DATE_FORMAT, locale = dateLocale) => {
	if (!value) return '';
	try {
		return format(new Date(value), dateFormat, { locale });
	} catch (error) {
		console.error('Invalid date value:', value);
		return value;
	}
};

export const formatTime = (value, timeFormat = TIME_FORMAT) => {
	if (!value) return '';
	try {
		return format(new Date(`1970-01-01T${value}`), timeFormat);
	} catch (error) {
		console.error('Invalid time value:', value);
		return value;
	}
};

export const formatDateTime = (value, dateTimeFormat = DATETIME_FORMAT) => {
	if (!value) return '';
	try {
		return format(new Date(value), dateTimeFormat);
	} catch (error) {
		console.error('Invalid datetime value:', value);
		return value;
	}
};

export const formatTimeToAPI = (value) => {
	if (!value) return '';
	try {
		return format(value, 'HH:mm:ss');
	} catch (error) {
		console.error('Invalid time value (API):', value);
		return value;
	}
};

export const formatTimeToUI = (value) => {
	if (!value) return '';
	try {
		return new Date(`1970-01-01T${value}`);
	} catch (error) {
		console.error('Invalid time value (UI):', value);
		return value;
	}
};

export const validateDate = (value) => {
	if (!value) return false;
	try {
		const date = value instanceof Date ? value : new Date(value);
		return isValid(date);
	} catch (error) {
		console.error('Invalid date value:', value);
		return false;
	}
};

export const validateTime = (value) => {
	if (!value) return false;
	try {
		const date = value instanceof Date ? value : new Date(value);
		return isValid(date);
	} catch (error) {
		console.error('Invalid time value:', value);
		return false;
	}
};

export const validateDateTime = (value) => {
	if (!value) return false;
	try {
		const date = value instanceof Date ? value : new Date(value);
		return isValid(date);
	} catch (error) {
		console.error('Invalid datetime value:', value);
		return false;
	}
};

export const validateEmail = (value) => {
	// RFC 5322
	if (!value) return false;
	const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
	return emailRegex.test(value);
};

export const validatePhoneNumber = (value) => {
	// E.164 format: +1234567890
	if (!value) return false;
	const phoneRegex = /^\+[1-9]\d{9,14}$/;
	return phoneRegex.test(value);
};

export const getFlightDurationMinutes = (flight) => {
	if (!flight) return 0;
	try {
		const depart = new Date(`${flight.scheduled_departure}T${flight.scheduled_departure_time || '00:00:00'}`);
		const arrive = new Date(`${flight.scheduled_arrival}T${flight.scheduled_arrival_time || '00:00:00'}`);
		return Math.round((arrive - depart) / 60000);
	} catch (e) {
		console.error('Failed to calculate duration', e);
		return 0;
	}
};

export const formatDuration = (minutes) => {
	if (minutes == null) return '';
	const hrs = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return TIME_DURATION_FORMAT(hrs, mins);
};

export const formatNumber = (value, formatString = DEFAULT_NUMBER_FORMAT) => {
	if (value == null || isNaN(value)) return '';
	try {
		return numeral(value).format(formatString);
	} catch (error) {
		console.error('Invalid number value:', value);
		return value;
	}
};

export const isDuplicateInBooking = (
	allBookingPassengers,
	passengers,
	bookingId,
	firstName,
	lastName,
	birthDate,
	ignoreId = null
) => {
	const bookingPassengers = allBookingPassengers.filter((bp) => {
		if (bp.booking_id !== bookingId || bp.id === ignoreId) return false;
		return true;
	});

	return bookingPassengers.some((bp) => {
		const passenger = passengers.find((pass) => pass.id === bp.passenger_id);
		return (
			passenger &&
			passenger.first_name === firstName &&
			passenger.last_name === lastName &&
			passenger.birth_date === formatDate(birthDate, 'yyyy-MM-dd')
		);
	});
};
