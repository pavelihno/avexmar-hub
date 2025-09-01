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
	Box,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

import {
	dateLocale,
	datePickerLocaleText,
	DATE_FORMAT,
	TIME_FORMAT,
	DEFAULT_EMAIL,
	DEFAULT_PHONE_NUMBER,
	TIME_MASK,
	DATE_API_FORMAT,
} from '../../constants';
import { formatDate, formatTime, parseDate, parseTime } from './format';

export const FIELD_TYPES = {
	TEXT: 'text',
	TEXT_AREA: 'text_area',
	NUMBER: 'number',
	EMAIL: 'email',
	PHONE: 'phone',
	DATE: 'date',
	TIME: 'time',
	SELECT: 'select',
	BOOLEAN: 'boolean',
	CUSTOM: 'custom',
	RICH_TEXT: 'rich_text',
};

export const createFieldRenderer = (field, defaultProps = {}) => {
	const type = field.type || FIELD_TYPES.TEXT;

	return (props = {}) => {
		const allProps = { ...defaultProps, ...props };

		switch (type) {
			case FIELD_TYPES.EMAIL: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx, size, disabled } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						disabled={disabled}
						inputProps={{
							placeholder: DEFAULT_EMAIL,
							type: 'email',
							autoComplete: 'email',
							...field.inputProps,
							...inputProps,
						}}
						size={size}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.PHONE: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx, size, disabled } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						disabled={disabled}
						inputProps={{
							placeholder: DEFAULT_PHONE_NUMBER,
							type: 'tel',
							autoComplete: 'tel',
							...field.inputProps,
							...inputProps,
						}}
						size={size}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.TEXT: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx, size, disabled } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						disabled={disabled}
						inputProps={{ ...field.inputProps, ...inputProps }}
						size={size}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.TEXT_AREA: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx, size, disabled } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						error={error}
						helperText={error ? helperText : ''}
						disabled={disabled}
						multiline
						rows={field.rows || 5}
						inputProps={{ ...field.inputProps, ...inputProps }}
						size={size}
						sx={{
							'& .MuiInputBase-root': { padding: '4px' },
							...sx,
						}}
					/>
				);
			}

			case FIELD_TYPES.RICH_TEXT: {
				const { value = '', onChange, fullWidth, error, helperText, sx, rows, disabled } = allProps;
				const editorRows = rows || field.rows || 20;
				const editorMinHeight = editorRows * 24;
				const modules = {
					toolbar: [
						[{ header: [1, 2, false] }],
						['bold', 'italic', 'underline', 'strike', 'blockquote'],
						[{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
						['link', 'clean'],
					],
				};
				const formats = [
					'header',
					'bold',
					'italic',
					'underline',
					'strike',
					'blockquote',
					'list',
					'bullet',
					'indent',
					'link',
				];
				return (
					<FormControl
						fullWidth={fullWidth}
						error={!!error}
						sx={{
							'& .ql-editor': { minHeight: editorMinHeight },
							'& .ql-editor ul': { listStyle: 'disc' },
							'& .ql-editor ol': { listStyle: 'decimal' },
							...sx,
						}}
					>
						<InputLabel shrink>{field.label}</InputLabel>
						<ReactQuill
							theme='snow'
							value={value}
							onChange={onChange}
							modules={modules}
							formats={formats}
							readOnly={disabled}
						/>
						{error && <FormHelperText>{helperText}</FormHelperText>}
					</FormControl>
				);
			}

			case FIELD_TYPES.NUMBER: {
				const { value = '', onChange, fullWidth, error, helperText, inputProps, sx, size, disabled } = allProps;

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
						disabled={disabled}
						onBlur={(e) => {
							const num = e.target.valueAsNumber;
							if (!isNaN(num)) {
								const clamped = Math.min(Math.max(min, num), max);
								const rounded = Math.round(clamped / step) * step;
								onChange(rounded);
							}
						}}
						inputProps={{
							min,
							step,
							...field.inputProps,
							...inputProps,
						}}
						size={size}
						sx={{ ...sx }}
					/>
				);
			}

			case FIELD_TYPES.DATE: {
				const {
					value,
					onChange,
					fullWidth,
					error,
					helperText,
					sx,
					minDate,
					maxDate,
					textFieldProps,
					size,
					disabled,
				} = allProps;
				return (
					<LocalizationProvider
						dateAdapter={AdapterDateFns}
						adapterLocale={dateLocale}
						localeText={datePickerLocaleText}
					>
						<DatePicker
							label={field.label}
							value={value ? parseDate(value) : null}
							onChange={(date) => onChange(formatDate(date, DATE_API_FORMAT))}
							minDate={minDate ? parseDate(minDate) : undefined}
							maxDate={maxDate ? parseDate(maxDate) : undefined}
							format={field.dateFormat || DATE_FORMAT}
							disabled={disabled}
							slotProps={{
								textField: {
									fullWidth,
									error,
									helperText: error ? helperText : '',
									sx,
									size,
									disabled,
									...textFieldProps,
								},
								field: { clearable: true },
							}}
						/>
					</LocalizationProvider>
				);
			}

			case FIELD_TYPES.TIME: {
				const { value, onChange, fullWidth, error, helperText, sx, textFieldProps, size, disabled } = allProps;

				return (
					<LocalizationProvider
						dateAdapter={AdapterDateFns}
						adapterLocale={dateLocale}
						localeText={datePickerLocaleText}
					>
						<TimePicker
							label={field.label}
							value={value ? parseTime(value) : null}
							onChange={(time) => onChange(formatTime(time))}
							ampm={false}
							format={field.timeFormat || TIME_FORMAT}
							mask={TIME_MASK}
							disabled={disabled}
							slotProps={{
								textField: {
									fullWidth,
									error,
									helperText: error ? helperText : '',
									sx,
									size,
									disabled,
									...textFieldProps,
								},
								field: { clearable: true },
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
					size,
					disabled,
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
							disabled={disabled}
							renderInput={(params) => (
								<TextField
									{...params}
									label={field.label}
									error={error}
									helperText={error ? helperText : ''}
									fullWidth={fullWidth}
									size={size}
									sx={{ ...sx }}
									disabled={disabled}
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
							size={size}
							sx={{ ...sx }}
							disabled={disabled}
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
					<FormControl fullWidth={fullWidth} error={!!error} size={size}>
						<InputLabel>{field.label}</InputLabel>
						<Select
							value={safeValue}
							onChange={(e) => onChange(e.target.value)}
							label={field.label}
							MenuProps={MenuProps}
							displayEmpty={displayEmpty}
							size={size}
							sx={{ ...sx }}
							disabled={disabled}
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
				const { value = false, onChange, sx, disabled } = allProps;
				return (
					<FormControlLabel
						control={
							<Checkbox
								checked={!!value}
								onChange={(e) => onChange(e.target.checked)}
								color='primary'
								disabled={disabled}
							/>
						}
						label={field.label}
						sx={{ ...sx }}
						disabled={disabled}
					/>
				);
			}

			case FIELD_TYPES.CUSTOM:
				return (customProps) => field.renderField({ ...allProps, ...customProps });

			default: {
				const { value = '', onChange, fullWidth, inputProps, sx, size, disabled } = allProps;
				return (
					<TextField
						label={field.label}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						fullWidth={fullWidth}
						inputProps={{ ...field.inputProps, ...inputProps }}
						size={size}
						sx={{ ...sx }}
						disabled={disabled}
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
			minDate: field.minDate,
			maxDate: field.maxDate,
		}));
};
