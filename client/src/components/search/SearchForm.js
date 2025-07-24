import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
	Box,
	Button,
	IconButton,
	Typography,
	Collapse,
	Paper,
        Select,
        FormControl,
        InputLabel,
        MenuItem,
        FormHelperText,
        Autocomplete,
        TextField,
	RadioGroup,
	FormControlLabel,
	Radio,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { getEnumOptions, UI_LABELS, dateLocale } from '../../constants';
import { fetchSearchAirports } from '../../redux/actions/search';

const seatClassOptions = getEnumOptions('SEAT_CLASS');

const SearchForm = () => {
        const navigate = useNavigate();
        const dispatch = useDispatch();
        const { airports } = useSelector((state) => state.search);

        const [from, setFrom] = useState(null);
        const [to, setTo] = useState(null);
        const [departDate, setDepartDate] = useState(null);
        const [returnDate, setReturnDate] = useState(null);
        const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
        const [seatClass, setSeatClass] = useState(seatClassOptions[0].value);
        const [showPassengers, setShowPassengers] = useState(false);
        const [validationErrors, setValidationErrors] = useState({});

        const passengersRef = useRef(null);

        useEffect(() => {
                dispatch(fetchSearchAirports());
        }, [dispatch]);

        useEffect(() => {
                if (airports.length && !from) {
                        const opts = airports.map((a) => ({ code: a.iata_code, label: `${a.city_name} (${a.name})` }));
                        setFrom(opts[0] || null);
                        setTo(opts[1] || null);
                }
        }, [airports]);

        useEffect(() => {
                const handleClick = (e) => {
                        if (passengersRef.current && !passengersRef.current.contains(e.target)) {
                                setShowPassengers(false);
                        }
                };
                document.addEventListener('mousedown', handleClick);
                return () => document.removeEventListener('mousedown', handleClick);
        }, []);

        const passengerCategories = UI_LABELS.HOME.search.passenger_categories;

	const swapAirports = () => {
		setFrom(to);
		setTo(from);
	};

        const totalPassengers = passengers.adults + passengers.children + passengers.infants;
        const passengerWord = UI_LABELS.HOME.search.passenger_word(totalPassengers);
        const seatClassLabel = seatClassOptions.find((o) => o.value === seatClass)?.label;
        const airportOptions = airports.map((a) => ({ code: a.iata_code, label: `${a.city_name} (${a.name})` }));

	const handlePassengerChange = (key, delta) => {
		setPassengers((prev) => {
			const value = Math.min(9, Math.max(key === 'adults' ? 1 : 0, prev[key] + delta));
			return { ...prev, [key]: value };
		});
	};

        const validateForm = () => {
                const errors = {};
                if (!from) errors.from = UI_LABELS.MESSAGES.required_field;
                if (!to) errors.to = UI_LABELS.MESSAGES.required_field;
                if (from && to && from.code === to.code) {
                        errors.to = UI_LABELS.HOME.search.errors.same_airport;
                }
                if (!departDate) errors.departDate = UI_LABELS.MESSAGES.required_field;
                if (returnDate && departDate && returnDate < departDate) {
                        errors.returnDate = UI_LABELS.HOME.search.errors.invalid_return;
                }
                setValidationErrors(errors);
                return Object.keys(errors).length === 0;
        };

        const handleSubmit = (e) => {
                e.preventDefault();
                if (!validateForm()) return;
                const params = new URLSearchParams();
		params.set('from', from.code);
		params.set('to', to.code);
		if (departDate) params.set('when', departDate.toISOString().split('T')[0]);
		if (returnDate) params.set('return', returnDate.toISOString().split('T')[0]);
		params.set('adults', passengers.adults);
		params.set('children', passengers.children);
		params.set('infants', passengers.infants);
		params.set('class', seatClass);
		navigate(`/search?${params.toString()}`);
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
			<Box
				component='form'
				onSubmit={handleSubmit}
				sx={{ display: 'flex', background: '#fff', borderRadius: 3, boxShadow: 1, p: 1 }}
			>
                                <Box sx={{ px: 2, py: 1 }}>
                                        {airportOptions.length > 100 ? (
                                                <Autocomplete
                                                        options={airportOptions}
                                                        value={from}
                                                        onChange={(e, val) => setFrom(val)}
                                                        getOptionLabel={(o) => o.label}
                                                        sx={{ width: 160 }}
                                                        renderInput={(params) => (
                                                                <TextField
                                                                        {...params}
                                                                        label={UI_LABELS.HOME.search.from}
                                                                        error={!!validationErrors.from}
                                                                        helperText={validationErrors.from}
                                                                />
                                                        )}
                                                />
                                        ) : (
                                                <FormControl sx={{ width: 160 }} error={!!validationErrors.from}>
                                                        <InputLabel id='from-label'>{UI_LABELS.HOME.search.from}</InputLabel>
                                                        <Select
                                                                labelId='from-label'
                                                                value={from ? from.code : ''}
                                                                label={UI_LABELS.HOME.search.from}
                                                                onChange={(e) =>
                                                                        setFrom(
                                                                                airportOptions.find((a) => a.code === e.target.value) || null
                                                                        )
                                                                }
                                                                sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' }, width: 160 }}
                                                        >
                                                                {airportOptions.map((a) => (
                                                                        <MenuItem key={a.code} value={a.code}>
                                                                                {a.label}
                                                                        </MenuItem>
                                                                ))}
                                                        </Select>
                                                        {validationErrors.from && <FormHelperText>{validationErrors.from}</FormHelperText>}
                                                </FormControl>
                                        )}
                                </Box>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<IconButton aria-label='swap' onClick={swapAirports}>
						<SwapHorizIcon />
					</IconButton>
				</Box>
                                <Box sx={{ px: 2, py: 1 }}>
                                        {airportOptions.length > 100 ? (
                                                <Autocomplete
                                                        options={airportOptions}
                                                        value={to}
                                                        onChange={(e, val) => setTo(val)}
                                                        getOptionLabel={(o) => o.label}
                                                        sx={{ width: 160 }}
                                                        renderInput={(params) => (
                                                                <TextField
                                                                        {...params}
                                                                        label={UI_LABELS.HOME.search.to}
                                                                        error={!!validationErrors.to}
                                                                        helperText={validationErrors.to}
                                                                />
                                                        )}
                                                />
                                        ) : (
                                                <FormControl sx={{ width: 160 }} error={!!validationErrors.to}>
                                                        <InputLabel id='to-label'>{UI_LABELS.HOME.search.to}</InputLabel>
                                                        <Select
                                                                labelId='to-label'
                                                                value={to ? to.code : ''}
                                                                label={UI_LABELS.HOME.search.to}
                                                                onChange={(e) =>
                                                                        setTo(
                                                                                airportOptions.find((a) => a.code === e.target.value) || null
                                                                        )
                                                                }
                                                                sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' }, width: 160 }}
                                                        >
                                                                {airportOptions.map((a) => (
                                                                        <MenuItem key={a.code} value={a.code}>
                                                                                {a.label}
                                                                        </MenuItem>
                                                                ))}
                                                        </Select>
                                                        {validationErrors.to && <FormHelperText>{validationErrors.to}</FormHelperText>}
                                                </FormControl>
                                        )}
                                </Box>
                                <Box sx={{ px: 2, py: 1 }}>
                                        <DatePicker
                                                label={UI_LABELS.HOME.search.when}
                                                value={departDate}
                                                onChange={(newDate) => setDepartDate(newDate)}
                                                slotProps={{
                                                        textField: {
                                                                sx: { minWidth: 150 },
                                                                error: !!validationErrors.departDate,
                                                                helperText: validationErrors.departDate,
                                                        },
                                                }}
                                        />
                                </Box>
                                <Box sx={{ px: 2, py: 1 }}>
                                        <DatePicker
                                                label={UI_LABELS.HOME.search.return}
                                                value={returnDate}
                                                onChange={(newDate) => setReturnDate(newDate)}
                                                slotProps={{
                                                        textField: {
                                                                sx: { minWidth: 150 },
                                                                error: !!validationErrors.returnDate,
                                                                helperText: validationErrors.returnDate,
                                                        },
                                                }}
                                        />
                                </Box>
                                <Box sx={{ px: 2, py: 1, position: 'relative' }} ref={passengersRef}>
					<Button variant='text' onClick={() => setShowPassengers((p) => !p)}>
						{`${totalPassengers} ${passengerWord}, ${seatClassLabel}`}
					</Button>
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
                                                                <Typography gutterBottom>
                                                                        {UI_LABELS.HOME.search.seat_class_title}
                                                                </Typography>
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
                                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
                                        <Button type='submit' variant='contained' sx={{ textTransform: 'none' }}>
                                                {UI_LABELS.HOME.search.button}
                                        </Button>
                                </Box>
                        </Box>
                </LocalizationProvider>
        );
};

export default SearchForm;
