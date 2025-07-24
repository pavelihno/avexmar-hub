import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
	RadioGroup,
	FormControlLabel,
	Radio,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { getEnumOptions, UI_LABELS, dateLocale } from '../../constants';
import AIRPORTS from '../../constants/airports';

const seatClassOptions = getEnumOptions('SEAT_CLASS');

const SearchForm = () => {
	const navigate = useNavigate();
	const [from, setFrom] = useState(AIRPORTS[0]);
	const [to, setTo] = useState(AIRPORTS[1]);
	const [departDate, setDepartDate] = useState(null);
	const [returnDate, setReturnDate] = useState(null);
	const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
	const [seatClass, setSeatClass] = useState(seatClassOptions[0].value);
	const [showPassengers, setShowPassengers] = useState(false);
	const [error, setError] = useState('');

	const passengerCategories = UI_LABELS.HOME.search.passenger_categories.length
		? UI_LABELS.HOME.search.passenger_categories
		: [
				{ key: 'adults', label: 'Взрослые', desc: '12 лет и старше' },
				{ key: 'children', label: 'Дети', desc: '2–11 лет' },
				{ key: 'infants', label: 'Младенцы', desc: 'до 2 лет' },
		  ];

	const swapAirports = () => {
		setFrom(to);
		setTo(from);
	};

	const totalPassengers = passengers.adults + passengers.children + passengers.infants;
	const passengerWord =
		totalPassengers % 10 === 1 && totalPassengers % 100 !== 11
			? 'пассажир'
			: totalPassengers % 10 >= 2 &&
			  totalPassengers % 10 <= 4 &&
			  (totalPassengers % 100 < 10 || totalPassengers % 100 >= 20)
			? 'пассажира'
			: 'пассажиров';
	const seatClassLabel = seatClassOptions.find((o) => o.value === seatClass)?.label;

	const handlePassengerChange = (key, delta) => {
		setPassengers((prev) => {
			const value = Math.min(9, Math.max(key === 'adults' ? 1 : 0, prev[key] + delta));
			return { ...prev, [key]: value };
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!from || !to) return;
		if (from.code === to.code) {
			setError('Пункты отправления и назначения не могут совпадать');
			return;
		}
		setError('');
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
					<FormControl sx={{ minWidth: 160 }}>
						<InputLabel id='from-label'>{UI_LABELS.HOME.search.from}</InputLabel>
						<Select
							labelId='from-label'
							value={from.code}
							label={UI_LABELS.HOME.search.from}
							onChange={(e) => setFrom(AIRPORTS.find((a) => a.code === e.target.value))}
						>
							{AIRPORTS.map((a) => (
								<MenuItem key={a.code} value={a.code}>
									{a.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<IconButton aria-label='swap' onClick={swapAirports}>
						<SwapHorizIcon />
					</IconButton>
				</Box>
				<Box sx={{ px: 2, py: 1 }}>
					<FormControl sx={{ minWidth: 160 }}>
						<InputLabel id='to-label'>{UI_LABELS.HOME.search.to}</InputLabel>
						<Select
							labelId='to-label'
							value={to.code}
							label={UI_LABELS.HOME.search.to}
							onChange={(e) => setTo(AIRPORTS.find((a) => a.code === e.target.value))}
						>
							{AIRPORTS.map((a) => (
								<MenuItem key={a.code} value={a.code}>
									{a.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				<Box sx={{ px: 2, py: 1 }}>
					<DatePicker
						label={UI_LABELS.HOME.search.when}
						value={departDate}
						onChange={(newDate) => setDepartDate(newDate)}
						slotProps={{ textField: { sx: { minWidth: 150 } } }}
					/>
				</Box>
				<Box sx={{ px: 2, py: 1 }}>
					<DatePicker
						label={UI_LABELS.HOME.search.return}
						value={returnDate}
						onChange={(newDate) => setReturnDate(newDate)}
						slotProps={{ textField: { sx: { minWidth: 150 } } }}
					/>
				</Box>
				<Box sx={{ px: 2, py: 1, position: 'relative' }}>
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
								<Typography gutterBottom>Класс обслуживания</Typography>
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
				{error && (
					<Box sx={{ px: 2, py: 1, width: '100%' }}>
						<Typography color='error' variant='body2'>
							{error}
						</Typography>
					</Box>
				)}
			</Box>
		</LocalizationProvider>
	);
};

export default SearchForm;
