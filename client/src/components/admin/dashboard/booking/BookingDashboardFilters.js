import React from 'react';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Grid2,
	Stack,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SearchIcon from '@mui/icons-material/Search';

import { BUTTONS } from '../../../../constants';

const selectMenuProps = {
	MenuProps: {
		PaperProps: {
			sx: { maxHeight: 280 },
		},
	},
};

const BookingDashboardFilters = ({
	labels,
	filters,
	filtersExpanded,
	onToggleFilters,
	filtersSummaryText,
	filtersError,
	routesLoading,
	flightsLoading,
	routeSelectOptions,
	flightSelectOptions,
	renderBookingNumberField,
        renderRouteField,
        renderFlightField,
        renderBuyerField,
        renderBookingDateFromField,
        renderBookingDateToField,
        onFilterChange,
        onApplyFilters,
        onResetFilters,
	isResetDisabled,
	isLoading,
}) => (
	<Accordion
		variant='outlined'
		expanded={filtersExpanded}
		onChange={(_, expanded) => onToggleFilters(expanded)}
		sx={{
			boxShadow: 'none',
			borderRadius: 2,
			'&:before': { display: 'none' },
		}}
	>
		<AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: { xs: 2, md: 3 }, py: 1.25 }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, width: '100%' }}>
				<Stack direction='row' alignItems='center' justifyContent='space-between' spacing={1}>
					<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
						{labels.title}
					</Typography>
				</Stack>
				<Typography variant='body2' color='text.secondary'>
					{filtersSummaryText}
				</Typography>
			</Box>
		</AccordionSummary>
		<AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
			<Stack spacing={2}>
				{filtersError && <Alert severity='error'>{filtersError}</Alert>}
				<Grid2 container spacing={2}>
					<Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
						{renderBookingNumberField({
							value: filters.bookingNumber,
							onChange: (val) => onFilterChange('bookingNumber', val),
							fullWidth: true,
							size: 'small',
						})}
					</Grid2>
					<Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
						{renderRouteField({
							value: filters.routeId,
							onChange: (val) => onFilterChange('routeId', val),
							fullWidth: true,
							size: 'small',
							options: routeSelectOptions,
							MenuProps: selectMenuProps.MenuProps,
							disabled: routesLoading,
						})}
					</Grid2>
					<Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
						{renderFlightField({
							value: filters.flightId,
							onChange: (val) => onFilterChange('flightId', val),
							fullWidth: true,
							size: 'small',
							options: flightSelectOptions,
							MenuProps: selectMenuProps.MenuProps,
							disabled: !filters.routeId || flightsLoading || flightSelectOptions.length <= 1,
						})}
					</Grid2>
                                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                {renderBuyerField({
                                                        value: filters.buyerQuery,
                                                        onChange: (val) => onFilterChange('buyerQuery', val),
                                                        fullWidth: true,
                                                        size: 'small',
                                                })}
                                        </Grid2>
                                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                {renderBookingDateFromField({
                                                        value: filters.bookingDateFrom,
                                                        onChange: (val) => onFilterChange('bookingDateFrom', val),
                                                        fullWidth: true,
                                                        size: 'small',
                                                        maxDate: filters.bookingDateTo,
                                                        textFieldProps: {
                                                                fullWidth: true,
                                                                InputLabelProps: { shrink: true },
                                                        },
                                                })}
                                        </Grid2>
                                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                                {renderBookingDateToField({
                                                        value: filters.bookingDateTo,
                                                        onChange: (val) => onFilterChange('bookingDateTo', val),
                                                        fullWidth: true,
                                                        size: 'small',
                                                        minDate: filters.bookingDateFrom,
                                                        textFieldProps: {
                                                                fullWidth: true,
                                                                InputLabelProps: { shrink: true },
                                                        },
                                                })}
                                        </Grid2>
				</Grid2>
				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='flex-end' spacing={{ xs: 1, sm: 1.5 }}>
					<Button
						variant='contained'
						type='button'
						color='primary'
						size='small'
						startIcon={<SearchIcon />}
						onClick={onApplyFilters}
						disabled={isLoading}
						sx={{
							alignSelf: { xs: 'stretch', sm: 'flex-end' },
							fontSize: '0.75rem',
							fontWeight: 500,
							minHeight: 32,
							px: 1.75,
							py: 0.75,
							width: { xs: '100%', sm: 'auto' },
						}}
					>
						{BUTTONS.show}
					</Button>
					<Button
						variant='outlined'
						type='button'
						color='primary'
						size='small'
						startIcon={<ClearAllIcon />}
						onClick={onResetFilters}
						disabled={isResetDisabled || isLoading}
						sx={{
							alignSelf: { xs: 'stretch', sm: 'flex-end' },
							fontSize: '0.75rem',
							fontWeight: 500,
							minHeight: 32,
							px: 1.75,
							py: 0.75,
							width: { xs: '100%', sm: 'auto' },
							opacity: isResetDisabled ? 0.6 : 1,
						}}
					>
						{labels.reset}
					</Button>
				</Stack>
			</Stack>
		</AccordionDetails>
	</Accordion>
);

export default BookingDashboardFilters;
