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

import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

import AdminEntityForm from './AdminEntityForm';

/**
 * Field type definitions
 */
export const FIELD_TYPES = {
	TEXT: 'text',
	NUMBER: 'number',
	DATE: 'date',
	DATETIME: 'dateTime',
	SELECT: 'select',
	BOOLEAN: 'boolean',
	CUSTOM: 'custom',
};

/**
 * Generate field renderers based on field type
 */
export const createFieldRenderer = (field) => {
	const type = field.type || FIELD_TYPES.TEXT;

	switch (type) {
		case FIELD_TYPES.TEXT:
			return (props) => (
				<TextField
					label={field.label}
					value={props.value || ''}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
					error={props.error}
					helperText={props.error ? props.helperText : ''}
					inputProps={field.inputProps}
				/>
			);

		case FIELD_TYPES.NUMBER:
			return (props) => (
				<TextField
					label={field.label}
					value={props.value ?? ''}
					onChange={(e) => {
						const value = e.target.value;
						const numValue = field.float
							? parseFloat(value)
							: parseInt(value, 10);
						props.onChange(value === '' ? '' : numValue);
					}}
					type='number'
					fullWidth={props.fullWidth}
					error={props.error}
					helperText={props.error ? props.helperText : ''}
					inputProps={{
						step: field.float ? 0.01 : 1,
						...field.inputProps,
					}}
				/>
			);

		case FIELD_TYPES.DATE:
			return (props) => (
				<LocalizationProvider dateAdapter={AdapterDateFns}>
					<DatePicker
						label={field.label}
						value={props.value ? new Date(props.value) : null}
						onChange={(date) => props.onChange(date)}
						slotProps={{
							textField: {
								fullWidth: props.fullWidth,
								error: props.error,
								helperText: props.error ? props.helperText : '',
							},
						}}
						format={field.dateFormat || 'dd.MM.yyyy'}
					/>
				</LocalizationProvider>
			);

		case FIELD_TYPES.DATETIME:
			return (props) => (
				<LocalizationProvider dateAdapter={AdapterDateFns}>
					<DateTimePicker
						label={field.label}
						value={props.value ? new Date(props.value) : null}
						onChange={(dateTime) => props.onChange(dateTime)}
						slotProps={{
							textField: {
								fullWidth: props.fullWidth,
								error: props.error,
								helperText: props.error ? props.helperText : '',
							},
						}}
						format={field.dateTimeFormat || 'dd.MM.yyyy HH:mm'}
					/>
				</LocalizationProvider>
			);

                case FIELD_TYPES.SELECT:
                        return (props) => {
                                if (field.options && field.options.length > 100) {
                                        const valueObj = field.options.find((o) => o.value === props.value) || null;
                                        return (
                                                <Autocomplete
                                                        options={field.options}
                                                        value={valueObj}
                                                        onChange={(e, val) => props.onChange(val ? val.value : '')}
                                                        filterOptions={(opts, state) =>
                                                                opts
                                                                        .filter((o) =>
                                                                                o.label
                                                                                        .toLowerCase()
                                                                                        .includes(state.inputValue.toLowerCase())
                                                                        )
                                                                        .slice(0, 100)
                                                        }
                                                        getOptionLabel={(o) => o.label}
                                                        renderInput={(params) => (
                                                                <TextField
                                                                        {...params}
                                                                        label={field.label}
                                                                        error={props.error}
                                                                        helperText={props.error ? props.helperText : ''}
                                                                />
                                                        )}
                                                />
                                        );
                                }
                                return (
                                        <FormControl fullWidth={props.fullWidth} error={!!props.error}>
                                                <InputLabel>{field.label}</InputLabel>
                                                <Select
                                                        value={props.value || ''}
                                                        onChange={(e) => props.onChange(e.target.value)}
                                                        label={field.label}
                                                >
                                                        {field.options.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                        {option.label}
                                                                </MenuItem>
                                                        ))}
                                                </Select>
                                                {props.error && <FormHelperText>{props.helperText}</FormHelperText>}
                                        </FormControl>
                                );
                        };

		case FIELD_TYPES.BOOLEAN:
			return (props) => (
				<FormControlLabel
					control={
						<Checkbox
							checked={!!props.value}
							onChange={(e) => props.onChange(e.target.checked)}
							color='primary'
						/>
					}
					label={field.label}
				/>
			);

		case FIELD_TYPES.CUSTOM:
			return (props) => {
				return field.renderField(props);
			};

		default:
			return (props) => (
				<TextField
					label={field.label}
					value={props.value || ''}
					onChange={(e) => props.onChange(e.target.value)}
					fullWidth={props.fullWidth}
				/>
			);
	}
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
				render: field.renderField
					? (item) => field.renderField(item)
					: null,
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
		renderForm: ({ isEditing, currentItem, onClose, onSave }) => (
			<AdminEntityForm
				fields={formFields}
				initialData={currentItem}
				onSave={onSave}
				onClose={onClose}
				isEditing={isEditing}
				addButtonText={options.addButtonText}
				editButtonText={options.editButtonText}
			/>
		),
	};
};

export const formatDate = (value, dateFormat = 'dd.MM.yyyy') => {
	if (!value) return '';
	try {
		return format(new Date(value), dateFormat);
	} catch (error) {
		console.error('Invalid date value:', value);
		return value;
	}
};

export const formatDateTime = (value, dateTimeFormat = 'dd.MM.yyyy HH:mm') => {
	if (!value) return '';
	try {
		return format(new Date(value), dateTimeFormat);
	} catch (error) {
		console.error('Invalid datetime value:', value);
		return value;
	}
};
