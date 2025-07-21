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

import AdminEntityForm from './AdminEntityForm';
import { dateLocale } from '../../constants';
import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT, TIME_MASK } from '../../constants/formats';

/**
 * Field type definitions
 */
export const FIELD_TYPES = {
	TEXT: 'text',
	NUMBER: 'number',
	DATE: 'date',
	TIME: 'time',
	DATETIME: 'dateTime',
	SELECT: 'select',
	BOOLEAN: 'boolean',
	CUSTOM: 'custom',
};

/**
 * Generate field renderers based on field type
 */
export const createFieldRenderer = (field, defaultProps = {}) => {
	const type = field.type || FIELD_TYPES.TEXT;

	return (props = {}) => {
		const allProps = { ...defaultProps, ...props };

		switch (type) {
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
				const { value, onChange, fullWidth, error, helperText, sx } = allProps;
				return (
					<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
						<DatePicker
							label={field.label}
							value={value ? new Date(value) : null}
							onChange={(date) => onChange(date)}
							format={field.dateFormat || DATE_FORMAT}
							slotProps={{
								textField: {
									fullWidth,
									error,
									helperText: error ? helperText : '',
									sx,
								},
							}}
						/>
					</LocalizationProvider>
				);
			}

			case FIELD_TYPES.TIME: {
				const { value, onChange, fullWidth, error, helperText, sx } = allProps;

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
								},
							}}
						/>
					</LocalizationProvider>
				);
			}

			case FIELD_TYPES.DATETIME: {
				const { value, onChange, fullWidth, error, helperText, sx } = allProps;
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

/**
 * Create field configurations for AdminEntityForm
 */
export const createFormFields = (fields) => {
	return Object.values(fields)
		.filter((field) => field.key !== 'id' && !field.excludeFromForm)
		.map((field) => ({
			name: field.key,
			fullWidth: field.fullWidth || false,
			renderField: createFieldRenderer(field),
			validate: field.validate,
		}));
};

/**
 * Create column configurations for AdminDataTable
 */
export const createTableColumns = (fields) => {
	return Object.values(fields)
		.filter((field) => field.key !== 'id' && !field.excludeFromTable)
		.map((field) => {
			const column = {
				field: field.key,
				header: field.label,
				formatter: field.formatter,
				render: field.renderField ? (item) => field.renderField(item) : null,
				type: field.type,
				options: field.options,
			};

			return column;
		});
};

/**
 * Generate a function to transform UI data to API format
 */
export const createToApiFormatter = (fields) => {
	return (uiData) => {
		const result = {};

		Object.values(fields).forEach((field) => {
			if (field.apiKey) {
				// Handle special transformations if needed
				if (field.toApi) {
					result[field.apiKey] = field.toApi(uiData[field.key]);
				} else {
					result[field.apiKey] = uiData[field.key];
				}
			}
		});

		// ID is handled specially since it's optional (not present for new items)
		if (uiData.id) {
			result.id = uiData.id;
		}

		return result;
	};
};

/**
 * Generate a function to transform API data to UI format
 */
export const createToUiFormatter = (fields) => {
	return (apiData) => {
		const result = { id: apiData.id };

		Object.values(fields).forEach((field) => {
			if (field.key !== 'id' && field.apiKey) {
				if (field.toUi) {
					result[field.key] = field.toUi(apiData[field.apiKey]);
				} else {
					result[field.key] = apiData[field.apiKey];
				}
			}
		});

		return result;
	};
};

/**
 * Create a complete set of admin management props
 */
export const createAdminManager = (fields, options = {}) => {
	const formFields = createFormFields(fields);
	const columns = createTableColumns(fields);
	const toApiFormat = createToApiFormatter(fields);
	const toUiFormat = createToUiFormatter(fields);

	return {
		fields,
		formFields,
		columns,
		toApiFormat,
		toUiFormat,
                renderForm: ({ isEditing, currentItem, onSave, onChange, onClose, ...rest }) => (
                        <AdminEntityForm
                                fields={formFields}
                                initialData={currentItem}
                                onSave={onSave}
                                onChange={onChange}
                                onClose={onClose}
                                isEditing={isEditing}
                                addButtonText={options.addButtonText(currentItem)}
                                editButtonText={options.editButtonText(currentItem)}
                                {...rest}
                        />
                ),
	};
};
