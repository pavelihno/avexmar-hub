import { useRef } from 'react';
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
	Typography,
	Button,
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
						size={size}
						sx={{ ...sx }}
						slotProps={{
							htmlInput: {
								placeholder: DEFAULT_EMAIL,
								type: 'email',
								autoComplete: 'email',
								...field.inputProps,
								...inputProps,
							},
						}}
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
						size={size}
						sx={{ ...sx }}
						slotProps={{
							htmlInput: {
								placeholder: DEFAULT_PHONE_NUMBER,
								type: 'tel',
								autoComplete: 'tel',
								...field.inputProps,
								...inputProps,
							},
						}}
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
						size={size}
						sx={{ ...sx }}
						slotProps={{
							htmlInput: { ...field.inputProps, ...inputProps },
						}}
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
						size={size}
						sx={{
							'& .MuiInputBase-root': { padding: '4px' },
							...sx,
						}}
						slotProps={{
							htmlInput: { ...field.inputProps, ...inputProps },
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
						size={size}
						sx={{ ...sx }}
						slotProps={{
							htmlInput: {
								min,
								step,
								...field.inputProps,
								...inputProps,
							},
						}}
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
						size={size}
						sx={{ ...sx }}
						disabled={disabled}
						slotProps={{
							htmlInput: { ...field.inputProps, ...inputProps },
						}}
					/>
				);
			}
		}
	};
};

export const DragAndDropUploadField = ({
	onFileSelect,
	dragText,
	buttonText,
	startIcon = null,
	accept,
	multiple = false,
	disabled = false,
	sx,
	buttonProps,
	inputProps,
	inputRef: externalInputRef,
	children,
}) => {
	const inputRef = useRef(null);
	const { onClick: buttonOnClick, ...restButtonProps } = buttonProps || {};
	const { onChange: inputOnChange, ...restInputProps } = inputProps || {};

	const assignInputRef = (node) => {
		inputRef.current = node;
		if (!externalInputRef) return;
		if (typeof externalInputRef === 'function') {
			externalInputRef(node);
		} else {
			externalInputRef.current = node;
		}
	};

	const handleFiles = (files) => {
		if (!files?.length || typeof onFileSelect !== 'function') return;
		const payload = multiple ? Array.from(files) : files[0];
		onFileSelect(payload);
	};

	const handleDrop = (event) => {
		event.preventDefault();
		if (disabled) return;
		handleFiles(event.dataTransfer.files);
	};

	const handleDragOver = (event) => {
		event.preventDefault();
		if (disabled) {
			event.dataTransfer.dropEffect = 'none';
			return;
		}
		event.dataTransfer.dropEffect = 'copy';
	};

	const handleInputChange = (event) => {
		if (disabled) return;
		handleFiles(event.target.files);
		if (inputOnChange) {
			inputOnChange(event);
		}
		event.target.value = '';
	};

	const handleButtonClick = (event) => {
		if (disabled) return;
		if (buttonOnClick) {
			buttonOnClick(event);
			if (event.defaultPrevented) return;
		}
		inputRef.current?.click();
	};

	return (
		<Box
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			sx={{
				border: '2px dashed',
				borderColor: 'grey.400',
				p: { xs: 3, sm: 4 },
				textAlign: 'center',
				borderRadius: 2,
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				transition: 'background-color 0.2s ease, border-color 0.2s ease',
				'&:hover': disabled
					? undefined
					: {
							borderColor: 'primary.main',
							backgroundColor: 'action.hover',
					  },
				...sx,
			}}
		>
			{dragText && (
				<Typography sx={{ mb: 2 }} color='text.secondary'>
					{dragText}
				</Typography>
			)}

			<Button
				variant='outlined'
				onClick={handleButtonClick}
				startIcon={startIcon}
				disabled={disabled}
				{...restButtonProps}
			>
				{buttonText}
			</Button>

			<input
				type='file'
				hidden
				ref={assignInputRef}
				accept={accept}
				multiple={multiple}
				disabled={disabled}
				onChange={handleInputChange}
				{...restInputProps}
			/>

			{children}
		</Box>
	);
};

export const createFormFields = (fields) => {
	return Object.values(fields)
		.filter((field) => field.key !== 'id' && !field.excludeFromForm)
		.map((field) => ({
			name: field.key,
			fullWidth: field.fullWidth || false,
			defaultValue: field.defaultValue,
			renderField: createFieldRenderer(field, { disabled: field.disabled }),
			validate: field.validate,
			minDate: field.minDate,
			maxDate: field.maxDate,
		}));
};
