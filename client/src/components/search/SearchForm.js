import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
	Box,
	Button,
	IconButton,
	Typography,
	Collapse,
	Paper,
	Switch,
	RadioGroup,
	Radio,
	TextField,
	FormControlLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { FIELD_TYPES, createFormFields, formatDate } from '../utils';
import { getEnumOptions, UI_LABELS, VALIDATION_MESSAGES, MAX_PASSENGERS, DATE_API_FORMAT } from '../../constants';
import { fetchSearchAirports } from '../../redux/actions/search';

const selectProps = {
	sx: {
		width: 220,
		'& .MuiInputBase-root': {
			fontSize: '0.8rem',
		},
		'& .MuiInputBase-input': {
			fontSize: '0.8rem',
		},
		'& .MuiFormHelperText-root': {
			fontSize: '0.65rem',
			minHeight: '1em',
			lineHeight: '1em',
		},
	},
	MenuProps: {
		PaperProps: {
			sx: { fontSize: '0.8rem' },
		},
	},
	MenuItemProps: {
		sx: {
			fontSize: '0.8rem',
			minHeight: 28,
			height: 28,
		},
	},
};

const dateProps = {
	sx: {
		width: 170,
		'& .MuiInputBase-input': {
			fontSize: '0.8rem',
			padding: '0 0 0 8px',
		},
		'& .MuiInputBase-root': {
			fontSize: '0.8rem',
		},
		'& .MuiFormHelperText-root': {
			fontSize: '0.65rem',
			minHeight: '1em',
			lineHeight: '1em',
		},
	},
};

const smallDateProps = {
	sx: {
		width: 130,
		'& .MuiInputBase-input': {
			fontSize: '0.8rem',
			padding: '0 0 0 8px',
		},
		'& .MuiInputBase-root': {
			fontSize: '0.8rem',
		},
		'& .MuiFormHelperText-root': {
			fontSize: '0.65rem',
			minHeight: '1em',
			lineHeight: '1em',
		},
	},
};

const seatClassOptions = getEnumOptions('SEAT_CLASS');

const parseDate = (value) => {
	if (!value) return null;
	const d = new Date(value);
	return isNaN(d) ? null : d;
};

const STORAGE_KEY = 'lastSearchParams';

const SearchForm = ({ initialParams = {}, loadLocalStorage = false }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const theme = useTheme();

	const { airports } = useSelector((state) => state.search);

	let storedParams = {};
	if (loadLocalStorage) {
		try {
			storedParams = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
		} catch (e) {
			storedParams = {};
		}
	}

	const combinedParams = { ...storedParams, ...initialParams };

	const [formValues, setFormValues] = useState({
		from: combinedParams.from || '',
		to: combinedParams.to || '',
		departDate: parseDate(combinedParams.when),
		returnDate: parseDate(combinedParams.return),
		departFrom: parseDate(combinedParams.when_from),
		departTo: parseDate(combinedParams.when_to),
		returnFrom: parseDate(combinedParams.return_from),
		returnTo: parseDate(combinedParams.return_to),
	});
	const [passengers, setPassengers] = useState({
		adults: parseInt(combinedParams.adults, 10) || 1,
		children: parseInt(combinedParams.children, 10) || 0,
		infants: parseInt(combinedParams.infants, 10) || 0,
	});
	const [dateMode, setDateMode] = useState(combinedParams.date_mode || 'exact');
	const [seatClass, setSeatClass] = useState(combinedParams.class || seatClassOptions[0].value);
	const [showPassengers, setShowPassengers] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});

	const passengersRef = useRef(null);
	const departToRef = useRef(null);
	const returnFromRef = useRef(null);
	const returnToRef = useRef(null);
	const airportOptions = useMemo(
		() => airports.map((a) => ({ value: a.iata_code, label: `${a.city_name} (${a.iata_code})` })),
		[airports]
	);

	// Update on direction or date changes
	useEffect(() => {
		if (
			initialParams.from ||
			initialParams.to ||
			initialParams.date_mode ||
			initialParams.when ||
			initialParams.return ||
			initialParams.when_from ||
			initialParams.when_to ||
			initialParams.return_from ||
			initialParams.return_to
		) {
			setFormValues((prev) => ({
				...prev,
				from: initialParams.from || prev.from,
				to: initialParams.to || prev.to,
				dateMode: initialParams.date_mode || prev.dateMode,
				departDate: initialParams.when ? parseDate(initialParams.when) : prev.departDate,
				returnDate: initialParams.return ? parseDate(initialParams.return) : prev.returnDate,
				departFrom: initialParams.when_from ? parseDate(initialParams.when_from) : prev.departFrom,
				departTo: initialParams.when_to ? parseDate(initialParams.when_to) : prev.departTo,
				returnFrom: initialParams.return_from ? parseDate(initialParams.return_from) : prev.returnFrom,
				returnTo: initialParams.return_to ? parseDate(initialParams.return_to) : prev.returnTo,
			}));
		}
	}, [initialParams]);

	useEffect(() => {
		dispatch(fetchSearchAirports());
	}, [dispatch]);

	useEffect(() => {
		if (!airportOptions.length) return;

		const isFromValid = airportOptions.some((o) => o.value === formValues.from);
		const isToValid = airportOptions.some((o) => o.value === formValues.to);

		if (!isFromValid || !isToValid) {
			setFormValues((prev) => ({
				...prev,
				from: isFromValid ? prev.from : '',
				to: isToValid ? prev.to : '',
			}));
		}
	}, [airportOptions]);

	useEffect(() => {
		const handleClick = (e) => {
			if (passengersRef.current && !passengersRef.current.contains(e.target)) {
				setShowPassengers(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	useEffect(() => {
		if (!seatClassOptions.find((o) => o.value === seatClass)) {
			setSeatClass(seatClassOptions[0].value);
		}
	}, [seatClassOptions, seatClass]);

	const passengerCategories = UI_LABELS.SEARCH.form.passenger_categories;

	const swapAirports = () => {
		setFormValues((prev) => ({ ...prev, from: prev.to, to: prev.from }));
	};

	const totalPassengers = passengers.adults + passengers.children + passengers.infants;
	const passengerWord = UI_LABELS.SEARCH.form.passenger_word(totalPassengers);
	const seatClassLabel = seatClassOptions.find((o) => o.value === seatClass)?.label;

	const formFields = useMemo(() => {
		const fields = {
			from: { key: 'from', label: UI_LABELS.SEARCH.form.from, type: FIELD_TYPES.SELECT, options: airportOptions },
			to: { key: 'to', label: UI_LABELS.SEARCH.form.to, type: FIELD_TYPES.SELECT, options: airportOptions },
			departDate: { key: 'departDate', label: UI_LABELS.SEARCH.form.when, type: FIELD_TYPES.DATE },
			returnDate: { key: 'returnDate', label: UI_LABELS.SEARCH.form.return, type: FIELD_TYPES.DATE },
			departFrom: { key: 'departFrom', label: UI_LABELS.SEARCH.form.when_from, type: FIELD_TYPES.DATE },
			departTo: { key: 'departTo', label: UI_LABELS.SEARCH.form.when_to, type: FIELD_TYPES.DATE },
			returnFrom: { key: 'returnFrom', label: UI_LABELS.SEARCH.form.return_from, type: FIELD_TYPES.DATE },
			returnTo: { key: 'returnTo', label: UI_LABELS.SEARCH.form.return_to, type: FIELD_TYPES.DATE },
		};
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, [airportOptions]);

	const saveToLocalStorage = () => {
		const isExact = dateMode === 'exact';
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				from: formValues.from,
				to: formValues.to,
				date_mode: dateMode,
				when: isExact ? formatDate(formValues.departDate, DATE_API_FORMAT) : null,
				return: isExact ? formatDate(formValues.returnDate, DATE_API_FORMAT) : null,
				when_from: !isExact ? formatDate(formValues.departFrom, DATE_API_FORMAT) : null,
				when_to: !isExact ? formatDate(formValues.departTo, DATE_API_FORMAT) : null,
				return_from: !isExact ? formatDate(formValues.returnFrom, DATE_API_FORMAT) : null,
				return_to: !isExact ? formatDate(formValues.returnTo, DATE_API_FORMAT) : null,
				adults: passengers.adults,
				children: passengers.children,
				infants: passengers.infants,
				class: seatClass,
			})
		);
	};

	const handlePassengerChange = (key, delta) => {
		setPassengers((prev) => {
			const nextValue = prev[key] + delta;
			const min = key === 'adults' ? 1 : 0;
			const max = MAX_PASSENGERS;

			const newTotal = prev.adults + prev.children + prev.infants + delta;
			if (nextValue < min || nextValue > max || newTotal > MAX_PASSENGERS) return prev;
			return { ...prev, [key]: nextValue };
		});
	};

	const validateForm = () => {
		const errors = {};
		if (!formValues.from) errors.from = VALIDATION_MESSAGES.SEARCH.from.REQUIRED;
		if (!formValues.to) errors.to = VALIDATION_MESSAGES.SEARCH.to.REQUIRED;
		if (formValues.from && formValues.to && formValues.from === formValues.to) {
			errors.to = VALIDATION_MESSAGES.SEARCH.to.SAME_AIRPORT;
		}

		if (dateMode === 'exact') {
			if (!formValues.departDate) errors.departDate = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			if (formValues.returnDate && formValues.departDate && formValues.returnDate < formValues.departDate) {
				errors.returnDate = VALIDATION_MESSAGES.SEARCH.return.INVALID;
			}
		} else {
			const { departFrom, departTo, returnFrom, returnTo } = formValues;
			if (!departFrom) errors.departFrom = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			if (!departTo) errors.departTo = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			if (departFrom && departTo && departTo < departFrom) {
				errors.departTo = VALIDATION_MESSAGES.SEARCH.return.INVALID;
			}
			if (returnFrom || returnTo) {
				if (!(returnFrom && returnTo)) {
					if (!returnFrom) errors.returnFrom = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
					if (!returnTo) errors.returnTo = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
				} else if (returnTo < returnFrom || (departTo && returnFrom < departTo)) {
					errors.returnFrom = VALIDATION_MESSAGES.SEARCH.return.INVALID;
				}
			}
		}
		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validateForm()) return;
		const params = new URLSearchParams();
		params.set('from', formValues.from);
		params.set('to', formValues.to);
		params.set('date_mode', dateMode);
		if (dateMode === 'exact') {
			params.set('when', formatDate(formValues.departDate, DATE_API_FORMAT));
			if (formValues.returnDate) params.set('return', formatDate(formValues.returnDate, DATE_API_FORMAT));
		} else {
			const { departFrom, departTo, returnFrom, returnTo } = formValues;
			params.set('when_from', formatDate(departFrom, DATE_API_FORMAT));
			params.set('when_to', formatDate(departTo, DATE_API_FORMAT));
			if (returnFrom && returnTo) {
				params.set('return_from', formatDate(returnFrom, DATE_API_FORMAT));
				params.set('return_to', formatDate(returnTo, DATE_API_FORMAT));
			}
		}
		params.set('adults', passengers.adults);
		params.set('children', passengers.children);
		params.set('infants', passengers.infants);
		params.set('class', seatClass);
		try {
			saveToLocalStorage();
		} catch (e) {
			console.error('Failed to save search params', e);
		}
		navigate(`/search?${params.toString()}`);
	};

	const isScheduleClickOpen = useMemo(
		() => !!formValues.from && !!formValues.to && formValues.from !== formValues.to,
		[formValues]
	);

	const onScheduleClick = () => {
		if (!isScheduleClickOpen) return;
		setValidationErrors({});
		const { from, to } = formValues;
		const params = new URLSearchParams();
		params.set('from', from);
		params.set('to', to);
		try {
			saveToLocalStorage();
		} catch (e) {
			console.error('Failed to save search params', e);
		}
		navigate(`/schedule?${params.toString()}`);
	};

	const fromValue = airportOptions.some((o) => o.value === formValues.from) ? formValues.from : '';
	const toValue = airportOptions.some((o) => o.value === formValues.to) ? formValues.to : '';

	return (
		<Box
			component='form'
			onSubmit={handleSubmit}
			sx={{
				display: 'grid',
				backgroundColor: theme.palette.background.paper,
				p: 1,
				mt: 2,
				alignItems: 'start',
				rowGap: 1,
				columnGap: 1,
				borderBottom: 1,
				borderColor: 'divider',
			}}
		>
			<Box
				sx={{
					gridRow: 1,
					gridColumn: '2 / 3',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Typography variant='body2' sx={{ mr: 1 }}>
					{UI_LABELS.SEARCH.form.date_modes.exact}
				</Typography>
				<Switch
					size='small'
					checked={dateMode === 'flex'}
					onChange={(e) => setDateMode(e.target.checked ? 'flex' : 'exact')}
					sx={{ mx: 1 }}
				/>
				<Typography variant='body2' sx={{ ml: 1 }}>
					{UI_LABELS.SEARCH.form.date_modes.flexible}
				</Typography>
			</Box>

			{/* Empty boxes */}
			<Box sx={{ gridRow: 1, gridColumn: '3 / 4' }} />
			<Box sx={{ gridRow: 1, gridColumn: '4 / 5' }} />

			{/* From/To */}
			<Box
				sx={{
					gridRow: 2,
					gridColumn: '1 / 2',
					display: 'flex',
					alignItems: 'center',
					flexDirection: 'column',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{formFields.from.renderField({
						value: fromValue,
						onChange: (val) => setFormValues((p) => ({ ...p, from: val })),
						error: !!validationErrors.from,
						helperText: validationErrors.from,
						...selectProps,
					})}
					<IconButton aria-label='swap' onClick={swapAirports}>
						<SwapHorizIcon />
					</IconButton>
					{formFields.to.renderField({
						value: toValue,
						onChange: (val) => setFormValues((p) => ({ ...p, to: val })),
						error: !!validationErrors.to,
						helperText: validationErrors.to,
						...selectProps,
					})}
				</Box>
			</Box>

			{/* Date fields */}
			<Box
				sx={{
					gridRow: 2,
					gridColumn: '2 / 3',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				{dateMode === 'exact' ? (
					<Box sx={{ display: 'flex' }}>
						<Box sx={{ px: 0.5 }}>
							{formFields.departDate.renderField({
								value: formValues.departDate,
								onChange: (val) => {
									setFormValues((p) => {
										let newReturnDate = p.returnDate;
										if (newReturnDate && val && newReturnDate < val) {
											newReturnDate = null;
										}
										return { ...p, departDate: val, returnDate: newReturnDate };
									});
								},
								error: !!validationErrors.departDate,
								helperText: validationErrors.departDate,
								minDate: new Date(),
								maxDate:
									formValues.returnDate ||
									new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
								...dateProps,
							})}
						</Box>
						<Box sx={{ px: 0.5 }}>
							{formFields.returnDate.renderField({
								value: formValues.returnDate,
								onChange: (val) => {
									if (formValues.departDate && val && val < formValues.departDate) return;
									setFormValues((p) => ({ ...p, returnDate: val }));
								},
								error: !!validationErrors.returnDate,
								helperText: validationErrors.returnDate,
								minDate: formValues.departDate || new Date(),
								...dateProps,
							})}
						</Box>
					</Box>
				) : (
					<Box sx={{ display: 'flex' }}>
						<Box sx={{ px: 0.5 }}>
							{formFields.departFrom.renderField({
								value: formValues.departFrom,
								onChange: (val) => {
									setFormValues((p) => {
										let newDepartTo = p.departTo;
										if (newDepartTo && val && newDepartTo < val) newDepartTo = null;
										return { ...p, departFrom: val, departTo: newDepartTo };
									});
									if (departToRef.current) departToRef.current.focus();
								},
								error: !!validationErrors.departFrom,
								helperText: validationErrors.departFrom,
								minDate: new Date(),
								maxDate:
									formValues.departTo ||
									new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
								textFieldProps: { inputRef: departToRef },
								...smallDateProps,
							})}
						</Box>
						<Box sx={{ px: 0.5 }}>
							{formFields.departTo.renderField({
								value: formValues.departTo,
								onChange: (val) => {
									setFormValues((p) => ({ ...p, departTo: val }));
									if (returnFromRef.current) returnFromRef.current.focus();
								},
								error: !!validationErrors.departTo,
								helperText: validationErrors.departTo,
								minDate: formValues.departFrom || new Date(),
								textFieldProps: { inputRef: returnFromRef },
								...smallDateProps,
							})}
						</Box>
						<Box sx={{ px: 0.5 }}>
							{formFields.returnFrom.renderField({
								value: formValues.returnFrom,
								onChange: (val) => {
									setFormValues((p) => {
										let newReturnTo = p.returnTo;
										if (newReturnTo && val && newReturnTo < val) newReturnTo = null;
										return { ...p, returnFrom: val, returnTo: newReturnTo };
									});
									if (returnToRef.current) returnToRef.current.focus();
								},
								error: !!validationErrors.returnFrom,
								helperText: validationErrors.returnFrom,
								minDate: formValues.departTo || formValues.departFrom || new Date(),
								maxDate:
									formValues.returnTo ||
									new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
								textFieldProps: { inputRef: returnToRef },
								...smallDateProps,
							})}
						</Box>
						<Box sx={{ px: 0.5 }}>
							{formFields.returnTo.renderField({
								value: formValues.returnTo,
								onChange: (val) => setFormValues((p) => ({ ...p, returnTo: val })),
								error: !!validationErrors.returnTo,
								helperText: validationErrors.returnTo,
								minDate:
									formValues.returnFrom || formValues.departTo || formValues.departFrom || new Date(),
								...smallDateProps,
							})}
						</Box>
					</Box>
				)}
			</Box>

			{/* Passenger selection */}
			<Box
				sx={{
					gridRow: 2,
					gridColumn: '3 / 4',
					position: 'relative',
				}}
				ref={passengersRef}
			>
				<TextField
					label={UI_LABELS.SEARCH.form.passengers}
					value={`${totalPassengers} ${passengerWord}, ${seatClassLabel}`}
					onClick={() => setShowPassengers((p) => !p)}
					InputProps={{ readOnly: true }}
					sx={{ width: 200, cursor: 'pointer' }}
				/>
				<Collapse in={showPassengers} sx={{ position: 'absolute', zIndex: 10, top: '100%', left: 0 }}>
					<Paper sx={{ p: 2, minWidth: 220 }}>
						{passengerCategories.map((row) => (
							<Box
								key={row.key}
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									mb: 1,
								}}
							>
								<Box>
									<Typography>{row.label}</Typography>
									<Typography variant='body2' color='text.secondary'>
										{row.desc}
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									<IconButton
										onClick={() => handlePassengerChange(row.key, -1)}
										disabled={passengers[row.key] <= (row.key === 'adults' ? 1 : 0)}
									>
										–
									</IconButton>
									<Typography>{passengers[row.key]}</Typography>
									<IconButton
										onClick={() => handlePassengerChange(row.key, 1)}
										disabled={
											passengers.adults + passengers.children + passengers.infants >=
											MAX_PASSENGERS
										}
									>
										+
									</IconButton>
								</Box>
							</Box>
						))}
						<Box sx={{ mt: 2 }}>
							<Typography gutterBottom>{UI_LABELS.SEARCH.form.seat_class_title}</Typography>
							<RadioGroup value={seatClass} onChange={(e) => setSeatClass(e.target.value)}>
								{seatClassOptions.map((o) => (
									<FormControlLabel
										key={o.value}
										value={o.value}
										control={<Radio />}
										label={o.label}
									/>
								))}
							</RadioGroup>
						</Box>
					</Paper>
				</Collapse>
			</Box>

			{/* Schedule button */}
			<Box
				sx={{
					gridRow: 1,
					gridColumn: '4 / 5',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Button
					variant='contained'
					color='primary'
					onClick={onScheduleClick}
					disabled={!isScheduleClickOpen}
					sx={{
						borderRadius: 1.5,
						whiteSpace: 'nowrap',
					}}
				>
					{UI_LABELS.SEARCH.form.show_schedule}
				</Button>
			</Box>
			{/* Search Button */}
			<Box
				sx={{
					gridRow: 2,
					gridColumn: '4 / 5',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Button
					type='submit'
					variant='contained'
					color='orange'
					sx={{
						borderRadius: 1.5,
						whiteSpace: 'nowrap',
					}}
				>
					{UI_LABELS.SEARCH.form.button}
				</Button>
			</Box>
		</Box>
	);
};

export default SearchForm;
