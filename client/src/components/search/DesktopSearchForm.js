import React from 'react';
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
	CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import useSearchForm from '../utils/search';
import { UI_LABELS } from '../../constants';

const selectProps = {
	sx: {
		width: 220,
		'& .MuiInputBase-root': { fontSize: '0.8rem' },
		'& .MuiInputBase-input': { fontSize: '0.8rem' },
		'& .MuiFormHelperText-root': { fontSize: '0.65rem', minHeight: '1em', lineHeight: '1em' },
	},
	MenuProps: { PaperProps: { sx: { fontSize: '0.8rem' } } },
	MenuItemProps: { sx: { fontSize: '0.8rem', minHeight: 28, height: 28 } },
};

const dateProps = {
	sx: {
		width: 170,
		'& .MuiInputBase-input': { fontSize: '0.8rem', padding: '0 0 0 8px' },
		'& .MuiInputBase-root': { fontSize: '0.8rem' },
		'& .MuiFormHelperText-root': { fontSize: '0.65rem', minHeight: '1em', lineHeight: '1em' },
	},
};

const smallDateProps = {
	sx: {
		width: 130,
		'& .MuiInputBase-input': { fontSize: '0.8rem', padding: '0 0 0 8px' },
		'& .MuiInputBase-root': { fontSize: '0.8rem' },
		'& .MuiFormHelperText-root': { fontSize: '0.65rem', minHeight: '1em', lineHeight: '1em' },
	},
};

const DesktopSearchForm = ({ initialParams = {}, loadLocalStorage = false }) => {
	const theme = useTheme();
	const form = useSearchForm({ initialParams, loadLocalStorage });

	const {
		formValues,
		setFormValues,
		dateMode,
		setDateMode,
		validationErrors,
		airportOptions,
		airportsLoading,
		formFields,
		fromValue,
		toValue,
		swapAirports,
		handleSubmit,
		onScheduleClick,
		isScheduleClickOpen,
		passengersRef,
		passengers,
		setPassengers,
		seatClass,
		setSeatClass,
		seatClassOptions,
		totalPassengers,
		passengerWord,
		seatClassLabel,
		disabledPassengerChange,
		handlePassengerChange,
		departToRef,
		returnFromRef,
		returnToRef,
	} = form;

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
				gridTemplateColumns: 'auto auto auto auto',
			}}
		>
			{/* Date mode toggle */}
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
						disabled: airportsLoading,
					})}
					<IconButton aria-label='swap' onClick={swapAirports} disabled={airportsLoading}>
						<SwapHorizIcon />
					</IconButton>
					{formFields.to.renderField({
						value: toValue,
						onChange: (val) => setFormValues((p) => ({ ...p, to: val })),
						error: !!validationErrors.to,
						helperText: validationErrors.to,
						...selectProps,
						disabled: airportsLoading,
					})}
					{airportsLoading && (
						<Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
							<CircularProgress size={18} />
						</Box>
					)}
				</Box>
			</Box>

			{/* Date fields */}
			<Box
				sx={{ gridRow: 2, gridColumn: '2 / 3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
			>
				{dateMode === 'exact' ? (
					<Box sx={{ display: 'flex' }}>
						<Box sx={{ px: 0.5 }}>
							{formFields.departDate.renderField({
								value: formValues.departDate,
								onChange: (val) => {
									setFormValues((p) => {
										let newReturnDate = p.returnDate;
										if (newReturnDate && val && newReturnDate < val) newReturnDate = null;
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
			<Box sx={{ gridRow: 2, gridColumn: '3 / 4', position: 'relative' }} ref={passengersRef}>
				<TextField
					label={UI_LABELS.SEARCH.form.passengers}
					value={`${totalPassengers} ${passengerWord}, ${seatClassLabel}`}
					onClick={() => form.setShowPassengers((p) => !p)}
					InputProps={{ readOnly: true }}
					sx={{ width: 200, cursor: 'pointer' }}
				/>
				<Collapse in={form.showPassengers} sx={{ position: 'absolute', zIndex: 10, top: '100%', left: 0 }}>
					<Paper sx={{ p: 2, minWidth: 220 }}>
						{[...Object.keys(passengers)].map((key) => {
							const row = UI_LABELS.SEARCH.form.passenger_categories.find((r) => r.key === key);
							if (!row) return null;
							return (
								<Box
									key={row.key}
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr auto 32px auto',
										alignItems: 'center',
										columnGap: 0.5,
										mb: 1,
									}}
								>
									<Box>
										<Typography sx={{ textDecoration: 'underline' }}>{row.label}</Typography>
										<Typography variant='body2' color='text.secondary'>
											{row.desc}
										</Typography>
									</Box>
									<IconButton
										onClick={() => handlePassengerChange(setPassengers, row.key, -1)}
										disabled={disabledPassengerChange(passengers, row.key, -1)}
										sx={{ p: 0 }}
									>
										<RemoveIcon />
									</IconButton>
									<Typography sx={{ textAlign: 'center' }}>{passengers[row.key]}</Typography>
									<IconButton
										onClick={() => handlePassengerChange(setPassengers, row.key, 1)}
										disabled={disabledPassengerChange(passengers, row.key, 1)}
										sx={{ p: 0 }}
									>
										<AddIcon />
									</IconButton>
								</Box>
							);
						})}
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
					sx={{ borderRadius: 1.5, whiteSpace: 'nowrap' }}
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
					sx={{ borderRadius: 1.5, whiteSpace: 'nowrap' }}
				>
					{UI_LABELS.SEARCH.form.button}
				</Button>
			</Box>
		</Box>
	);
};

export default DesktopSearchForm;
