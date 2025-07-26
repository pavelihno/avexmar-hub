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
		height: 40,
		minHeight: 40,
	},
	'& .MuiInputBase-input': {
		fontSize: '0.75rem',
		height: 28,
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
			sx: { fontSize: '0.5rem' },
		},
	},
	MenuItemProps: {
		sx: {
			fontSize: '0.5rem',
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

const SearchForm = ({ initialParams = {} }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { airports } = useSelector((state) => state.search);

	const [formValues, setFormValues] = useState({
		from: initialParams.from || '',
		to: initialParams.to || '',
		departDate: parseDate(initialParams.when),
		returnDate: parseDate(initialParams.return),
	});
	const [passengers, setPassengers] = useState({
		adults: parseInt(initialParams.adults, 10) || 1,
		children: parseInt(initialParams.children, 10) || 0,
		infants: parseInt(initialParams.infants, 10) || 0,
	});
	const [seatClass, setSeatClass] = useState(initialParams.class || seatClassOptions[0].value);
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
		if (!formValues.departDate) errors.departDate = VALIDATION_MESSAGES.SEARCH.when.REQUIRED;
		if (formValues.returnDate && formValues.departDate && formValues.returnDate < formValues.departDate) {
			errors.returnDate = VALIDATION_MESSAGES.SEARCH.return.INVALID;
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
		params.set('when', formatDate(formValues.departDate, 'yyyy-MM-dd'));
		if (formValues.returnDate) params.set('return', formatDate(formValues.returnDate, 'yyyy-MM-dd'));
		params.set('adults', passengers.adults);
		params.set('children', passengers.children);
		params.set('infants', passengers.infants);
		params.set('class', seatClass);
		navigate(`/search?${params.toString()}`);
	};

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
					value: formValues.from,
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
					value: formValues.to,
					onChange: (val) => setFormValues((p) => ({ ...p, to: val })),
					error: !!validationErrors.to,
					helperText: validationErrors.to,
					...selectProps,
				})}
			</Box>
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
			</Box>
		</Box>
	);
};

export default SearchForm;
