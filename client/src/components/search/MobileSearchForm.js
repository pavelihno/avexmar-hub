import React from 'react';
import {
	Box,
	Button,
	IconButton,
	Typography,
	Switch,
	TextField,
	MenuItem,
	Card,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import useSearchForm from '../utils/search';
import { UI_LABELS } from '../../constants';

const selectProps = {
	sx: {
		width: '100%',
		'& .MuiInputBase-root': { fontSize: '0.9rem' },
		'& .MuiInputBase-input': { fontSize: '0.9rem' },
		'& .MuiFormHelperText-root': { fontSize: '0.7rem', minHeight: '1em', lineHeight: '1em' },
	},
};

const dateProps = {
	sx: {
		width: '100%',
		'& .MuiInputBase-input': { fontSize: '0.9rem', padding: '0 0 0 8px' },
		'& .MuiInputBase-root': { fontSize: '0.9rem' },
		'& .MuiFormHelperText-root': { fontSize: '0.7rem', minHeight: '1em', lineHeight: '1em' },
	},
};

const MobileSearchForm = ({ initialParams = {}, loadLocalStorage = false }) => {
	const theme = useTheme();
	const form = useSearchForm({ initialParams, loadLocalStorage });

	const {
		formValues,
		setFormValues,
		dateMode,
		setDateMode,
		validationErrors,
		formFields,
		fromValue,
		toValue,
		handleSubmit,
		onScheduleClick,
		isScheduleClickOpen,
		passengers,
		setPassengers,
		seatClass,
		setSeatClass,
		seatClassOptions,
		disabledPassengerChange,
		handlePassengerChange,
		departToRef,
		returnFromRef,
		returnToRef,
		totalPassengers,
		passengerWord,
		seatClassLabel,
		airportOptions,
	} = form;

	const [collapsed, setCollapsed] = React.useState(Boolean(initialParams?.from && initialParams?.to));

	const fromLabel = React.useMemo(() => {
		const item = (airportOptions || []).find((o) => o.value === formValues.from);
		return item?.value || formValues.from || '';
	}, [airportOptions, formValues.from]);

	const toLabel = React.useMemo(() => {
		const item = (airportOptions || []).find((o) => o.value === formValues.to);
		return item?.value || formValues.to || '';
	}, [airportOptions, formValues.to]);

	return (
		<Box
			component='form'
			onSubmit={handleSubmit}
			sx={{
				display: 'grid',
				gridTemplateColumns: '1fr',
				backgroundColor: theme.palette.background.paper,
				p: 0,
				mt: 1,
				gap: 1,
			}}
		>
			<Accordion
				variant='outlined'
				expanded={!collapsed}
				onChange={() => setCollapsed((p) => !p)}
				sx={{ boxShadow: 'none', p: 0, mb: 1, width: '100%' }}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant='body1' sx={{ fontWeight: 'bold' }}>
						{UI_LABELS.SEARCH.from_to_date(
							fromLabel,
							toLabel,
							formValues.departDate,
							formValues.returnDate
						)}
					</Typography>
				</AccordionSummary>
				<AccordionDetails sx={{ py: 1 }}>
					{/* From/To */}
					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
						{formFields.from.renderField({
							value: fromValue,
							onChange: (val) => setFormValues((p) => ({ ...p, from: val })),
							error: !!validationErrors.from,
							helperText: validationErrors.from,
							...selectProps,
						})}

						{formFields.to.renderField({
							value: toValue,
							onChange: (val) => setFormValues((p) => ({ ...p, to: val })),
							error: !!validationErrors.to,
							helperText: validationErrors.to,
							...selectProps,
						})}
					</Box>

					{/* Dates */}
					<Box sx={{ my: 1 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
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
						{dateMode === 'exact' ? (
							<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
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
									...dateProps,
								})}
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
						) : (
							<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
								{/* Depart range */}
								{formFields.departFrom.renderField({
									value: formValues.departFrom,
									onChange: (val) => {
										setFormValues((p) => {
											let newDepartTo = p.departTo;
											if (newDepartTo && val && newDepartTo < val) newDepartTo = null;
											return { ...p, departFrom: val, departTo: newDepartTo };
										});
									},
									error: !!validationErrors.departFrom,
									helperText: validationErrors.departFrom,
									minDate: new Date(),
									textFieldProps: { inputRef: departToRef },
									...dateProps,
								})}
								{formFields.departTo.renderField({
									value: formValues.departTo,
									onChange: (val) => setFormValues((p) => ({ ...p, departTo: val })),
									error: !!validationErrors.departTo,
									helperText: validationErrors.departTo,
									minDate: formValues.departFrom || new Date(),
									textFieldProps: { inputRef: returnFromRef },
									...dateProps,
								})}
								{/* Return range */}
								{formFields.returnFrom.renderField({
									value: formValues.returnFrom,
									onChange: (val) => {
										setFormValues((p) => {
											let newReturnTo = p.returnTo;
											if (newReturnTo && val && newReturnTo < val) newReturnTo = null;
											return { ...p, returnFrom: val, returnTo: newReturnTo };
										});
									},
									error: !!validationErrors.returnFrom,
									helperText: validationErrors.returnFrom,
									minDate: formValues.departTo || formValues.departFrom || new Date(),
									textFieldProps: { inputRef: returnToRef },
									...dateProps,
								})}
								{formFields.returnTo.renderField({
									value: formValues.returnTo,
									onChange: (val) => setFormValues((p) => ({ ...p, returnTo: val })),
									error: !!validationErrors.returnTo,
									helperText: validationErrors.returnTo,
									minDate:
										formValues.returnFrom ||
										formValues.departTo ||
										formValues.departFrom ||
										new Date(),
									...dateProps,
								})}
							</Box>
						)}
					</Box>

					{/* Passengers */}
					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 1 }}>
						{UI_LABELS.SEARCH.form.passenger_categories.map((row) => (
							<Card key={row.key} sx={{ p: 1, display: 'flex', flexDirection: 'column' }}>
								<Box sx={{ mb: 0.5 }}>
									<Typography noWrap sx={{ textDecoration: 'underline', lineHeight: 1.2 }}>
										{row.label}
									</Typography>
									<Typography noWrap variant='body2' color='text.secondary'>
										{row.desc}
									</Typography>
								</Box>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: 'auto auto auto',
										justifyContent: 'flex-end',
										alignItems: 'center',
										columnGap: 0.5,
									}}
								>
									<IconButton
										size='small'
										onClick={() => handlePassengerChange(setPassengers, row.key, -1)}
										disabled={disabledPassengerChange(passengers, row.key, -1)}
										sx={{ p: 0 }}
									>
										<RemoveIcon fontSize='small' />
									</IconButton>
									<Typography sx={{ textAlign: 'center', minWidth: '24px' }}>
										{passengers[row.key]}
									</Typography>
									<IconButton
										size='small'
										onClick={() => handlePassengerChange(setPassengers, row.key, 1)}
										disabled={disabledPassengerChange(passengers, row.key, 1)}
										sx={{ p: 0 }}
									>
										<AddIcon fontSize='small' />
									</IconButton>
								</Box>
							</Card>
						))}
					</Box>

					{/* Seat class */}
					<Box sx={{ my: 1 }}>
						<TextField
							select
							fullWidth
							label={UI_LABELS.SEARCH.form.seat_class_title}
							value={seatClass}
							onChange={(e) => setSeatClass(e.target.value)}
							size='small'
							sx={{ width: '100%' }}
						>
							{seatClassOptions.map((o) => (
								<MenuItem key={o.value} value={o.value}>
									{o.label}
								</MenuItem>
							))}
						</TextField>
					</Box>

					{/* Buttons */}
					<Box sx={{ display: 'flex', gap: 1, my: 1 }}>
						<Button
							type='button'
							variant='contained'
							color='primary'
							onClick={onScheduleClick}
							disabled={!isScheduleClickOpen}
							sx={{ flex: 1, borderRadius: 1.5 }}
						>
							{UI_LABELS.SEARCH.form.show_schedule}
						</Button>
						<Button type='submit' variant='contained' color='orange' sx={{ flex: 1, borderRadius: 1.5 }}>
							{UI_LABELS.SEARCH.form.button}
						</Button>
					</Box>
				</AccordionDetails>
			</Accordion>

			<Divider />
		</Box>
	);
};

export default MobileSearchForm;
