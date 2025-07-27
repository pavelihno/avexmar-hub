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
	RadioGroup,
	FormControlLabel,
	Radio,
	TextField,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { FIELD_TYPES, createFormFields, formatDate } from '../utils';

import { getEnumOptions, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';
import { fetchSearchAirports } from '../../redux/actions/search';
import { MAX_PASSENGERS } from '../../constants/formats';

const sharedSx = {
	'& .MuiInputBase-root': {
		fontSize: '0.75rem',
	},
	'& .MuiInputBase-input': {
		fontSize: '0.75rem',
	},
	'& .MuiFormHelperText-root': {
		fontSize: '0.65rem',
		minHeight: '1em',
		lineHeight: '1em',
	},
};

const selectProps = {
	sx: {
		width: 220,
		...sharedSx,
	},
	MenuProps: {
		PaperProps: {
			sx: { fontSize: '0.75rem' },
		},
	},
	MenuItemProps: {
		sx: {
			fontSize: '0.75rem',
			minHeight: 28,
			height: 28,
		},
	},
};

const dateProps = {
	sx: {
		width: 170,
		...sharedSx,
	},
};

const seatClassOptions = getEnumOptions('SEAT_CLASS');

const parseDate = (value) => {
	if (!value) return null;
	const d = new Date(value);
	return isNaN(d) ? null : d;
};

const STORAGE_KEY = 'lastSearchParams';

const SearchForm = ({ initialParams = {} }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { airports } = useSelector((state) => state.search);

	const [dateMode, setDateMode] = useState(
		initialParams.when_from || initialParams.when_to || initialParams.return_from || initialParams.return_to
			? 'flex'
			: 'exact'
	);

	const storedParams = useMemo(() => {
		if (Object.keys(initialParams).length) return {};
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
		} catch (e) {
			return {};
		}
	}, [initialParams]);

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
	const [seatClass, setSeatClass] = useState(combinedParams.class || seatClassOptions[0].value);
	const [showPassengers, setShowPassengers] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});

	const passengersRef = useRef(null);
	const airportOptions = useMemo(
		() => airports.map((a) => ({ value: a.iata_code, label: `${a.city_name} (${a.iata_code})` })),
		[airports]
	);

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

	const passengerCategories = UI_LABELS.HOME.search.passenger_categories;

	const swapAirports = () => {
		setFormValues((prev) => ({ ...prev, from: prev.to, to: prev.from }));
	};

	const totalPassengers = passengers.adults + passengers.children + passengers.infants;
	const passengerWord = UI_LABELS.HOME.search.passenger_word(totalPassengers);
	const seatClassLabel = seatClassOptions.find((o) => o.value === seatClass)?.label;

	const fields = useMemo(
		() => ({
			from: { key: 'from', label: UI_LABELS.HOME.search.from, type: FIELD_TYPES.SELECT, options: airportOptions },
			to: { key: 'to', label: UI_LABELS.HOME.search.to, type: FIELD_TYPES.SELECT, options: airportOptions },
			departDate: { key: 'departDate', label: UI_LABELS.HOME.search.when, type: FIELD_TYPES.DATE },
			returnDate: { key: 'returnDate', label: UI_LABELS.HOME.search.return, type: FIELD_TYPES.DATE },
			departFrom: { key: 'departFrom', label: `${UI_LABELS.HOME.search.when} c`, type: FIELD_TYPES.DATE },
			departTo: { key: 'departTo', label: `${UI_LABELS.HOME.search.when} до`, type: FIELD_TYPES.DATE },
			returnFrom: { key: 'returnFrom', label: `${UI_LABELS.HOME.search.return} c`, type: FIELD_TYPES.DATE },
			returnTo: { key: 'returnTo', label: `${UI_LABELS.HOME.search.return} до`, type: FIELD_TYPES.DATE },
		}),
		[airportOptions]
	);

	const formFields = useMemo(() => {
		const arr = createFormFields(fields);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, [fields]);

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
			if (!formValues.departFrom) errors.departFrom = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			if (!formValues.departTo) errors.departTo = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
			if (formValues.departFrom && formValues.departTo && formValues.departTo < formValues.departFrom) {
				errors.departTo = VALIDATION_MESSAGES.SEARCH.return.INVALID;
			}
			if (formValues.returnFrom && formValues.returnTo && formValues.returnTo < formValues.returnFrom) {
				errors.returnTo = VALIDATION_MESSAGES.SEARCH.return.INVALID;
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
		if (dateMode === 'exact') {
			params.set('when', formatDate(formValues.departDate, 'yyyy-MM-dd'));
			if (formValues.returnDate) params.set('return', formatDate(formValues.returnDate, 'yyyy-MM-dd'));
		} else {
			params.set('when_from', formatDate(formValues.departFrom, 'yyyy-MM-dd'));
			params.set('when_to', formatDate(formValues.departTo, 'yyyy-MM-dd'));
			if (formValues.returnFrom && formValues.returnTo) {
				params.set('return_from', formatDate(formValues.returnFrom, 'yyyy-MM-dd'));
				params.set('return_to', formatDate(formValues.returnTo, 'yyyy-MM-dd'));
			}
		}
		params.set('adults', passengers.adults);
		params.set('children', passengers.children);
		params.set('infants', passengers.infants);
		params.set('class', seatClass);
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					from: formValues.from,
					to: formValues.to,
					when: formatDate(formValues.departDate, 'yyyy-MM-dd'),
					return: formValues.returnDate ? formatDate(formValues.returnDate, 'yyyy-MM-dd') : null,
					when_from: formatDate(formValues.departFrom, 'yyyy-MM-dd'),
					when_to: formatDate(formValues.departTo, 'yyyy-MM-dd'),
					return_from: formatDate(formValues.returnFrom, 'yyyy-MM-dd'),
					return_to: formatDate(formValues.returnTo, 'yyyy-MM-dd'),
					adults: passengers.adults,
					children: passengers.children,
					infants: passengers.infants,
					class: seatClass,
				})
			);
		} catch (e) {
			console.error('Failed to save search params', e);
		}
		navigate(`/search?${params.toString()}`);
	};

	const fromValue = airportOptions.some((o) => o.value === formValues.from) ? formValues.from : '';
	const toValue = airportOptions.some((o) => o.value === formValues.to) ? formValues.to : '';

	return (
		<Box
			component='form'
			onSubmit={handleSubmit}
			sx={{
				display: 'flex',
				background: '#fff',
				borderRadius: 1,
				boxShadow: 1,
				p: 1,
				marginTop: 2,
				alignItems: 'center',
			}}
		>
			<Box sx={{ px: 0.5, py: 1 }}>
				{formFields.from.renderField({
					value: fromValue,
					onChange: (val) => setFormValues((p) => ({ ...p, from: val })),
					error: !!validationErrors.from,
					helperText: validationErrors.from,
					...selectProps,
				})}
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				<IconButton aria-label='swap' onClick={swapAirports}>
					<SwapHorizIcon />
				</IconButton>
			</Box>
			<Box sx={{ px: 0.5, py: 1 }}>
				{formFields.to.renderField({
					value: toValue,
					onChange: (val) => setFormValues((p) => ({ ...p, to: val })),
					error: !!validationErrors.to,
					helperText: validationErrors.to,
					...selectProps,
				})}
			</Box>
			<Box sx={{ px: 0.5, py: 1 }}>
				<RadioGroup row value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
					<FormControlLabel
						value='exact'
						control={<Radio size='small' />}
						label={UI_LABELS.HOME.search.date_modes.exact}
					/>
					<FormControlLabel
						value='flex'
						control={<Radio size='small' />}
						label={UI_LABELS.HOME.search.date_modes.flexible}
					/>
				</RadioGroup>
			</Box>
			{dateMode === 'exact' ? (
				<>
					<Box sx={{ px: 0.5, py: 1 }}>
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
							...dateProps,
						})}
					</Box>
					<Box sx={{ px: 0.5, py: 1 }}>
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
				</>
			) : (
				<>
					<Box sx={{ px: 0.5, py: 1 }}>
						{formFields.departFrom.renderField({
							value: formValues.departFrom,
							onChange: (val) => setFormValues((p) => ({ ...p, departFrom: val })),
							error: !!validationErrors.departFrom,
							helperText: validationErrors.departFrom,
							minDate: new Date(),
							...dateProps,
						})}
					</Box>
					<Box sx={{ px: 0.5, py: 1 }}>
						{formFields.departTo.renderField({
							value: formValues.departTo,
							onChange: (val) => setFormValues((p) => ({ ...p, departTo: val })),
							error: !!validationErrors.departTo,
							helperText: validationErrors.departTo,
							minDate: formValues.departFrom || new Date(),
							...dateProps,
						})}
					</Box>
					<Box sx={{ px: 0.5, py: 1 }}>
						{formFields.returnFrom.renderField({
							value: formValues.returnFrom,
							onChange: (val) => setFormValues((p) => ({ ...p, returnFrom: val })),
							error: !!validationErrors.returnFrom,
							helperText: validationErrors.returnFrom,
							minDate: formValues.departTo || formValues.departFrom || new Date(),
							...dateProps,
						})}
					</Box>
					<Box sx={{ px: 0.5, py: 1 }}>
						{formFields.returnTo.renderField({
							value: formValues.returnTo,
							onChange: (val) => setFormValues((p) => ({ ...p, returnTo: val })),
							error: !!validationErrors.returnTo,
							helperText: validationErrors.returnTo,
							minDate:
								formValues.returnFrom || formValues.departTo || formValues.departFrom || new Date(),
							...dateProps,
						})}
					</Box>
				</>
			)}
			<Box sx={{ px: 0.5, py: 1, position: 'relative' }} ref={passengersRef}>
				<TextField
					label={UI_LABELS.HOME.search.passengers}
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
										disabled={passengers[row.key] >= 9}
									>
										+
									</IconButton>
								</Box>
							</Box>
						))}
						<Box sx={{ mt: 2 }}>
							<Typography gutterBottom>{UI_LABELS.HOME.search.seat_class_title}</Typography>
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
			<Box sx={{ px: 0.5, py: 1, display: 'flex', alignItems: 'center' }}>
				<Button
					type='submit'
					variant='contained'
					sx={{
						background: '#ff7f2a',
						color: '#fff',
						borderRadius: 2,
						px: 4,
						py: 2,
						boxShadow: 'none',
						textTransform: 'none',
						whiteSpace: 'nowrap',
						'&:hover': { background: '#ff6600' },
					}}
				>
					{UI_LABELS.HOME.search.button}
				</Button>
				{formValues.from && formValues.to && (
					<Button
						variant='outlined'
						size='small'
						sx={{ ml: 1, whiteSpace: 'nowrap' }}
						onClick={() => {
							const params = new URLSearchParams();
							params.set('from', formValues.from);
							params.set('to', formValues.to);
							navigate(`/schedule?${params.toString()}`);
						}}
					>
						{UI_LABELS.HOME.search.schedule_button}
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default SearchForm;
