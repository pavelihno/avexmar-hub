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

import {
	dateLocale,
	DATE_FORMAT,
	TIME_FORMAT,
	DATETIME_FORMAT,
	DEFAULT_EMAIL,
	DEFAULT_PHONE_NUMBER,
	TIME_MASK,
} from '../../constants';

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
						sx={{
							'& .MuiInputBase-root': { padding: '4px' },
							...sx,
						}}
					/>
				);
			}

			case FIELD_TYPES.NUMBER: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx } = allProps;

				const step = field.inputProps?.step ?? (field.float ? 0.01 : 1);
				const min = field.inputProps?.min ?? 0;
				const max = field.inputProps?.max ?? Infinity;

				return (
					<TextField
						type='number'
						label={field.label}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						onBlur={(e) => {
							const num = e.target.valueAsNumber;
							if (!isNaN(num)) {
								const clamped = Math.min(Math.max(min, num), max);
								const rounded = Math.round(clamped / step) * step;
								onChange(rounded);
							}
						}}
						inputProps={{ min, step, ...field.inputProps, ...inputProps }}
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

				const resolvedValue = value !== undefined && value !== null ? value : field.defaultValue;
				const isValidValue = options.some((o) => o.value === resolvedValue);
				const safeValue = isValidValue ? resolvedValue : '';

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
							value={safeValue}
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
							value={safeValue}
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
