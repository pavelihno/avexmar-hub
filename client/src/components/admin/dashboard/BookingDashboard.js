import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import {
	Alert,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Box,
	Button,
	Collapse,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	Grid2,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';

import Base from '../../Base';
import { UI_LABELS, ENUM_LABELS, BUTTONS } from '../../../constants';
import { formatDate, formatDateTime, formatNumber, createFieldRenderer, FIELD_TYPES } from '../../utils';
import { fetchBookingDashboard } from '../../../redux/actions/bookingDashboard';
import { serverApi } from '../../../api';

const LABELS = UI_LABELS.ADMIN.exports.bookingDashboard;

const initialFilters = {
	bookingNumber: '',
	routeId: '',
	flightId: '',
	buyerQuery: '',
	bookingDate: '',
};

const bookingStatusColors = {
	created: 'default',
	passengers_added: 'default',
	confirmed: 'info',
	payment_pending: 'warning',
	payment_confirmed: 'primary',
	payment_failed: 'error',
	completed: 'success',
	expired: 'warning',
	cancelled: 'error',
};

const issueColors = {
	pending_payment: 'info',
	failed_payment: 'error',
};

const formatNamePart = (value) => {
	if (!value) return '';
	const lower = String(value).toLowerCase();
	return lower.replace(/(^|\s|-)([а-яa-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);
};

const buildPricingDetails = (price) => {
	if (!price) return '';
	const parts = [];
	if (price.fare_price != null) {
		parts.push(`${LABELS.pricing.fare}: ${formatNumber(price.fare_price)}`);
	}
	if (price.total_discounts) {
		parts.push(`${LABELS.pricing.discounts}: −${formatNumber(price.total_discounts)}`);
	}
	if (price.fees) {
		parts.push(`${LABELS.pricing.fees}: ${formatNumber(price.fees)}`);
	}
	return parts.join(' • ');
};

const mapFiltersToParams = (filters) => {
	const params = {};
	if (filters.bookingNumber) params.booking_number = filters.bookingNumber.trim();
	if (filters.routeId) params.route_id = Number(filters.routeId);
	if (filters.flightId) params.flight_id = Number(filters.flightId);
	if (filters.buyerQuery) params.buyer_query = filters.buyerQuery.trim();
	if (filters.bookingDate) params.booking_date = filters.bookingDate;
	return params;
};

const normalizeFilters = (filters) => ({
	...filters,
	bookingNumber: filters.bookingNumber.trim(),
	buyerQuery: filters.buyerQuery.trim(),
});

const extractErrorMessage = (error) => {
	if (!error) return UI_LABELS.ERRORS.unknown;
	if (typeof error === 'string') return error;
	return error.response?.data?.message || error.message || UI_LABELS.ERRORS.unknown;
};

const chipBaseSx = {
	borderRadius: 0.5,
	fontWeight: 500,
};

const defaultSummary = {
	total: 0,
	status_counts: {},
	issue_counts: {},
};

// Table configurations
const FLIGHTS_COLUMNS = [
	{ key: 'number', label: LABELS.table.flights.number },
	{ key: 'route', label: LABELS.table.flights.route },
	{ key: 'airline', label: LABELS.table.flights.airline },
	{ key: 'departure', label: LABELS.table.flights.departure },
	{ key: 'arrival', label: LABELS.table.flights.arrival },
	{ key: 'class', label: LABELS.table.flights.class },
	{ key: 'tariff', label: LABELS.table.flights.tariff },
];

const PASSENGERS_COLUMNS = [
	{ key: 'name', label: LABELS.table.passengers.name },
	{ key: 'category', label: LABELS.table.passengers.category },
	{ key: 'document', label: LABELS.table.passengers.document },
	{ key: 'citizenship', label: LABELS.table.passengers.citizenship },
	{ key: 'birthDate', label: LABELS.table.passengers.birthDate },
];

const PAYMENTS_COLUMNS = [
	{ key: 'providerId', label: LABELS.table.payments.providerId },
	{ key: 'status', label: LABELS.table.payments.status },
	{ key: 'type', label: LABELS.table.payments.type },
	{ key: 'method', label: LABELS.table.payments.method },
	{ key: 'amount', label: LABELS.table.payments.amount, align: 'right' },
	{ key: 'paidAt', label: LABELS.table.payments.paidAt },
	{ key: 'expiresAt', label: LABELS.table.payments.expiresAt },
];

const mapFlightToRow = (flight) => {
	const seatClassLabel = flight.tariff?.seat_class
		? ENUM_LABELS.SEAT_CLASS[flight.tariff.seat_class] || flight.tariff.seat_class
		: '—';
	const departureLabel = flight.scheduled_departure ? formatDateTime(flight.scheduled_departure) : '—';
	const arrivalLabel = flight.scheduled_arrival ? formatDateTime(flight.scheduled_arrival) : '—';

	return {
		number: flight.number || '—',
		route: flight.route?.label || '—',
		airline: flight.airline || '—',
		departure: departureLabel,
		arrival: arrivalLabel,
		class: seatClassLabel,
		tariff: flight.tariff?.title || '—',
	};
};

const mapPassengerToRow = (passenger) => {
	const fullName = [
		formatNamePart(passenger.last_name),
		formatNamePart(passenger.first_name),
		formatNamePart(passenger.patronymic_name),
	]
		.filter(Boolean)
		.join(' ');
	const categoryLabel = passenger.category
		? ENUM_LABELS.PASSENGER_CATEGORY[passenger.category] || passenger.category
		: '—';
	const documentTypeLabel = passenger.document_type
		? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
		: null;
	const documentExpiryLabel = passenger.document_expiry_date ? formatDate(passenger.document_expiry_date) : null;
	const documentParts = [documentTypeLabel, passenger.document_number, documentExpiryLabel].filter(Boolean);
	const documentLabel = documentParts.length > 0 ? documentParts.join(' · ') : '—';
	const birthDateLabel = passenger.birth_date ? formatDate(passenger.birth_date) : '—';

	return {
		name: fullName || '—',
		category: categoryLabel,
		document: documentLabel,
		citizenship: passenger.citizenship || '—',
		birthDate: birthDateLabel,
	};
};

const mapPaymentToRow = (payment) => {
	const statusLabel = ENUM_LABELS.PAYMENT_STATUS[payment.status] || payment.status || '—';
	const typeLabel = ENUM_LABELS.PAYMENT_TYPE?.[payment.type] || payment.type || '—';
	const methodLabel = ENUM_LABELS.PAYMENT_METHOD?.[payment.method] || payment.method || '—';
	const amountLabel =
		payment.amount != null
			? `${formatNumber(payment.amount)} ${
					ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || payment.currency || ''
			  }`
			: '—';
	const paidAtLabel = payment.paid_at ? formatDateTime(payment.paid_at) : '—';
	const expiresAtLabel = payment.expires_at ? formatDateTime(payment.expires_at) : '—';

	return {
		providerId: payment.provider_payment_id || '—',
		status: statusLabel,
		type: typeLabel,
		method: methodLabel,
		amount: amountLabel,
		paidAt: paidAtLabel,
		expiresAt: expiresAtLabel,
	};
};

const DataTable = ({ columns, data, mapDataToRow, emptyMessage }) => {
	const rows = data.map(mapDataToRow);

	return (
		<TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 0 }}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						{columns.map((col) => (
							<TableCell key={col.key} align={col.align || 'left'}>
								{col.label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.length === 0 ? (
						<TableRow>
							<TableCell colSpan={columns.length} align='center'>
								<Typography variant='body2' color='text.secondary'>
									{emptyMessage}
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						rows.map((row, idx) => (
							<TableRow key={idx}>
								{columns.map((col) => (
									<TableCell key={col.key} align={col.align || 'left'}>
										{row[col.key]}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

const BookingDashboard = () => {
	const dispatch = useDispatch();
	const { data, isLoading, errors } = useSelector((state) => state.bookingDashboard);

	const [filters, setFilters] = useState(initialFilters);
	const [appliedFilters, setAppliedFilters] = useState(null);
	const [hasSearched, setHasSearched] = useState(false);
	const [filtersExpanded, setFiltersExpanded] = useState(true);
	const [routesOptions, setRoutesOptions] = useState([]);
	const [routesLoading, setRoutesLoading] = useState(false);
	const [flightsOptions, setFlightsOptions] = useState([]);
	const [flightsLoading, setFlightsLoading] = useState(false);
	const [filtersError, setFiltersError] = useState(null);
	const [statusFilter, setStatusFilter] = useState(null);
	const [issueFilter, setIssueFilter] = useState(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [expandedBookings, setExpandedBookings] = useState({});

	const hasInputFilters = useMemo(() => {
		const normalized = normalizeFilters(filters);
		return Object.values(normalized).some(Boolean);
	}, [filters]);

	const hasAppliedFilters = useMemo(() => {
		if (!appliedFilters) return false;
		const normalized = normalizeFilters(appliedFilters);
		return Object.values(normalized).some(Boolean);
	}, [appliedFilters]);

	const isResetDisabled = !hasSearched;

	useEffect(() => {
		if (!hasSearched || !appliedFilters) return;
		dispatch(fetchBookingDashboard(mapFiltersToParams(appliedFilters)));
	}, [dispatch, appliedFilters, hasSearched]);

	useEffect(() => {
		if (hasInputFilters || hasAppliedFilters) {
			setFiltersExpanded(true);
		}
	}, [hasInputFilters, hasAppliedFilters]);

	useEffect(() => {
		let isMounted = true;

		const loadRoutes = async () => {
			setRoutesLoading(true);
			setFiltersError(null);
			try {
				const response = await serverApi.get('/exports/flight-passengers/routes');
				if (!isMounted) return;
				const payload = response?.data?.data || response?.data || [];
				const items = Array.isArray(payload) ? payload : [];
				const mapped = items.map((item) => ({
					id: item.id,
					label: item.label || item.name || `${item.id}`,
				}));
				setRoutesOptions(mapped);
			} catch (err) {
				if (!isMounted) return;
				setFiltersError(extractErrorMessage(err));
				setRoutesOptions([]);
			} finally {
				if (isMounted) {
					setRoutesLoading(false);
				}
			}
		};

		loadRoutes();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		let isMounted = true;
		const selectedRouteId = filters.routeId;

		if (!selectedRouteId) {
			setFlightsOptions([]);
			setFlightsLoading(false);
			return () => {
				isMounted = false;
			};
		}

		const loadFlights = async () => {
			setFlightsLoading(true);
			setFiltersError(null);
			try {
				const response = await serverApi.get(`/exports/flight-passengers/routes/${selectedRouteId}/flights`);
				if (!isMounted) return;
				const payload = response?.data?.data || response?.data || [];
				const items = Array.isArray(payload) ? payload : [];
				const mapped = items.map((flight) => {
					const departureLabel = flight.scheduled_departure ? formatDate(flight.scheduled_departure) : '';
					const airlineNumber = flight.airline_flight_number || '';
					const airlineName = flight.airline?.name || flight.airline_name || '';
					const parts = [airlineNumber, departureLabel].filter(Boolean);
					const suffix = airlineName ? ` (${airlineName})` : '';
					return {
						id: flight.id,
						label: `${parts.join(' · ')}${suffix}`,
					};
				});
				setFlightsOptions(mapped);
			} catch (err) {
				if (!isMounted) return;
				setFiltersError(extractErrorMessage(err));
				setFlightsOptions([]);
			} finally {
				if (isMounted) {
					setFlightsLoading(false);
				}
			}
		};

		loadFlights();

		return () => {
			isMounted = false;
		};
	}, [filters.routeId]);

	const routeSelectOptions = useMemo(
		() => [
			{ value: '', label: '—' },
			...routesOptions.map((route) => ({
				value: route.id,
				label: route.label,
			})),
		],
		[routesOptions]
	);

	const flightSelectOptions = useMemo(
		() => [
			{ value: '', label: '—' },
			...flightsOptions.map((flight) => ({
				value: flight.id,
				label: flight.label,
			})),
		],
		[flightsOptions]
	);

	const filtersSummaryText = useMemo(() => {
		if (!hasSearched || !appliedFilters) return '—';

		const normalized = normalizeFilters(appliedFilters);
		const parts = [];

		if (normalized.bookingNumber) {
			parts.push(`${LABELS.filters.bookingNumber}: ${normalized.bookingNumber}`);
		}

		if (normalized.routeId) {
			const option = routesOptions.find((route) => String(route.id) === String(normalized.routeId));
			parts.push(`${LABELS.filters.route}: ${option?.label || normalized.routeId}`);
		}

		if (normalized.flightId) {
			const option = flightsOptions.find((flight) => String(flight.id) === String(normalized.flightId));
			parts.push(`${LABELS.filters.flight}: ${option?.label || normalized.flightId}`);
		}

		if (normalized.buyerQuery) {
			parts.push(`${LABELS.filters.buyer}: ${normalized.buyerQuery}`);
		}

		if (normalized.bookingDate) {
			const formattedDate = formatDate(normalized.bookingDate);
			parts.push(`${LABELS.filters.bookingDate}: ${formattedDate || normalized.bookingDate}`);
		}

		return parts.length ? parts.join(' • ') : '—';
	}, [appliedFilters, hasSearched, routesOptions, flightsOptions]);

	const serverBookings = hasSearched ? data?.items || [] : [];

	const filteredBookings = useMemo(() => {
		if (!hasSearched) return [];
		return serverBookings.filter((booking) => {
			if (statusFilter && booking.status !== statusFilter) return false;
			if (issueFilter && !booking.issues?.[issueFilter]) return false;
			return true;
		});
	}, [serverBookings, statusFilter, issueFilter, hasSearched]);

	const summary = useMemo(() => {
		if (!hasSearched) return defaultSummary;

		const statusCounts = {};
		const issueCounts = {};

		filteredBookings.forEach((booking) => {
			if (booking.status) {
				statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
			}
			Object.entries(booking.issues || {}).forEach(([key, value]) => {
				if (key === 'hold_expired' || !value) return;
				issueCounts[key] = (issueCounts[key] || 0) + 1;
			});
		});

		return {
			total: filteredBookings.length,
			status_counts: statusCounts,
			issue_counts: issueCounts,
		};
	}, [filteredBookings, hasSearched]);

	const emptyListMessage = hasSearched ? LABELS.emptyState : LABELS.emptyStateBeforeSearch;

	const statusSummary = useMemo(() => {
		const counts = summary.status_counts || {};
		const entries = Object.keys(counts)
			.filter((status) => status && counts[status] > 0)
			.map((status) => ({
				status,
				label: ENUM_LABELS.BOOKING_STATUS[status] || status,
				count: counts[status],
			}));

		if (statusFilter && !entries.some((item) => item.status === statusFilter)) {
			entries.push({
				status: statusFilter,
				label: ENUM_LABELS.BOOKING_STATUS[statusFilter] || statusFilter,
				count: 0,
			});
		}

		return entries.sort((a, b) => b.count - a.count);
	}, [summary.status_counts, statusFilter]);

	const issueSummary = useMemo(() => {
		const counts = summary.issue_counts || {};
		const entries = Object.keys(counts)
			.filter((key) => key !== 'hold_expired' && counts[key] > 0)
			.map((key) => ({
				key,
				label: LABELS.issues[key] || key,
				count: counts[key],
			}));

		if (issueFilter && !entries.some((item) => item.key === issueFilter)) {
			entries.push({
				key: issueFilter,
				label: LABELS.issues[issueFilter] || issueFilter,
				count: 0,
			});
		}

		return entries.sort((a, b) => b.count - a.count);
	}, [summary.issue_counts, issueFilter]);

	const handleFilterValueChange = (field, value = '') => {
		setFilters((prev) => {
			const next = { ...prev, [field]: value ?? '' };
			if (field === 'routeId') {
				next.flightId = '';
			}
			return next;
		});
	};

	const handleApplyFilters = () => {
		setFiltersError(null);
		setAppliedFilters(normalizeFilters(filters));
		setHasSearched(true);
		setStatusFilter(null);
		setIssueFilter(null);
		setExpandedBookings({});
		setPage(0);
	};

	const handleResetFilters = () => {
		setFilters(initialFilters);
		setAppliedFilters(null);
		setHasSearched(false);
		setFlightsOptions([]);
		setFiltersError(null);
		setStatusFilter(null);
		setIssueFilter(null);
		setExpandedBookings({});
		setPage(0);
	};
	const handlePageChange = (event, newPage) => {
		setPage(newPage);
	};
	const handleRowsPerPageChange = (event) => {
		const value = Number(event.target.value) || 10;
		setRowsPerPage(value);
		setPage(0);
	};

	const handleStatusChipClick = (status) => {
		setStatusFilter((prev) => (prev === status ? null : status));
	};

	const handleIssueChipClick = (issueKey) => {
		setIssueFilter((prev) => (prev === issueKey ? null : issueKey));
	};

	const handleToggleBooking = (bookingId) => {
		setExpandedBookings((prev) => ({
			...prev,
			[bookingId]: !prev[bookingId],
		}));
	};

	const filteredCount = filteredBookings.length;

	useEffect(() => {
		setPage(0);
	}, [appliedFilters, statusFilter, issueFilter, filteredCount]);

	const paginatedBookings = useMemo(() => {
		const start = page * rowsPerPage;
		return filteredBookings.slice(start, start + rowsPerPage);
	}, [filteredBookings, page, rowsPerPage]);

	const renderBookingNumberField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.bookingNumber,
				type: FIELD_TYPES.TEXT,
			}),
		[LABELS.filters.bookingNumber]
	);

	const renderBuyerField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.buyer,
				type: FIELD_TYPES.TEXT,
			}),
		[LABELS.filters.buyer]
	);

	const renderRouteField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.route,
				type: FIELD_TYPES.SELECT,
			}),
		[LABELS.filters.route]
	);

	const renderFlightField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.flight,
				type: FIELD_TYPES.SELECT,
			}),
		[LABELS.filters.flight]
	);

	const renderBookingDateField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.bookingDate,
				type: FIELD_TYPES.DATE,
			}),
		[LABELS.filters.bookingDate]
	);

	const selectMenuProps = {
		MenuProps: {
			PaperProps: {
				sx: { maxHeight: 280 },
			},
		},
	};

	return (
		<Base>
			<Box sx={{ p: { xs: 2, md: 3 }, pb: 6 }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: 1.5,
						mb: { xs: 2, md: 3 },
					}}
				>
					<IconButton
						component={Link}
						to='/admin'
						sx={{
							mr: { xs: 0, md: 1 },
							alignSelf: 'center',
						}}
					>
						<ArrowBackIcon />
					</IconButton>
					<Typography variant='h4'>{LABELS.title}</Typography>
				</Box>

				<Box sx={{ mb: { xs: 3, md: 4 } }}>
					<Accordion
						variant='outlined'
						expanded={filtersExpanded}
						onChange={(_, expanded) => setFiltersExpanded(expanded)}
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
										{LABELS.filters.title}
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
											onChange: (val) => handleFilterValueChange('bookingNumber', val),
											fullWidth: true,
											size: 'small',
										})}
									</Grid2>
									<Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
										{renderRouteField({
											value: filters.routeId,
											onChange: (val) => handleFilterValueChange('routeId', val),
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
											onChange: (val) => handleFilterValueChange('flightId', val),
											fullWidth: true,
											size: 'small',
											options: flightSelectOptions,
											MenuProps: selectMenuProps.MenuProps,
											disabled:
												!filters.routeId || flightsLoading || flightSelectOptions.length <= 1,
										})}
									</Grid2>
									<Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
										{renderBuyerField({
											value: filters.buyerQuery,
											onChange: (val) => handleFilterValueChange('buyerQuery', val),
											fullWidth: true,
											size: 'small',
										})}
									</Grid2>
									<Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
										{renderBookingDateField({
											value: filters.bookingDate,
											onChange: (val) => handleFilterValueChange('bookingDate', val),
											fullWidth: true,
											size: 'small',
											textFieldProps: {
												fullWidth: true,
												InputLabelProps: { shrink: true },
											},
										})}
									</Grid2>
								</Grid2>
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									justifyContent='flex-end'
									spacing={{ xs: 1, sm: 1.5 }}
								>
									<Button
										variant='contained'
										type='button'
										color='primary'
										size='small'
										startIcon={<SearchIcon />}
										onClick={handleApplyFilters}
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
										onClick={handleResetFilters}
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
										{LABELS.filters.reset}
									</Button>
								</Stack>
							</Stack>
						</AccordionDetails>
					</Accordion>
				</Box>

				{errors && (
					<Alert severity='error' sx={{ mt: 3 }}>
						{errors?.message || UI_LABELS.ERRORS.unknown}
					</Alert>
				)}

				{hasSearched && (
					<Box sx={{ mt: { xs: 3, md: 4 } }}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems='stretch'>
							<Paper
								variant='outlined'
								sx={{
									borderRadius: 2,
									px: 2.5,
									py: 2,
									minWidth: { md: 200 },
								}}
							>
								<Typography variant='subtitle2' color='text.secondary' sx={{ fontWeight: 500 }}>
									{LABELS.summary.total}
								</Typography>
								<Typography variant='h3' sx={{ fontWeight: 600, lineHeight: 1.1 }}>
									{summary.total || 0}
								</Typography>
							</Paper>
							<Paper
								variant='outlined'
								sx={{
									flex: 1,
									borderRadius: 2,
									px: 2.5,
									py: 2,
								}}
							>
								<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1, fontWeight: 500 }}>
									{LABELS.summary.statuses}
								</Typography>
								<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
									{hasSearched && statusSummary.length === 0 && (
										<Typography variant='body2' color='text.secondary'>
											{LABELS.summary.emptyStatuses}
										</Typography>
									)}
									{statusSummary.map((item) => (
										<Chip
											key={item.status}
											label={`${item.label} · ${item.count}`}
											variant={statusFilter === item.status ? 'filled' : 'outlined'}
											color={bookingStatusColors[item.status] || 'default'}
											size='small'
											onClick={() => handleStatusChipClick(item.status)}
											clickable
											sx={{
												...chipBaseSx,
												cursor: 'pointer',
												opacity: statusFilter && statusFilter !== item.status ? 0.7 : 1,
											}}
										/>
									))}
								</Box>
							</Paper>
							<Paper
								variant='outlined'
								sx={{
									flex: 1,
									borderRadius: 2,
									px: 2.5,
									py: 2,
								}}
							>
								<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1, fontWeight: 500 }}>
									{LABELS.summary.issues}
								</Typography>
								<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
									{hasSearched && issueSummary.length === 0 && (
										<Typography variant='body2' color='text.secondary'>
											{LABELS.summary.emptyIssues}
										</Typography>
									)}
									{issueSummary.map((issue) => (
										<Chip
											key={issue.key}
											label={`${issue.label} · ${issue.count}`}
											variant={issueFilter === issue.key ? 'filled' : 'outlined'}
											color={issueColors[issue.key] || 'default'}
											size='small'
											onClick={() => handleIssueChipClick(issue.key)}
											clickable
											sx={{
												...chipBaseSx,
												cursor: 'pointer',
												opacity: issueFilter && issueFilter !== issue.key ? 0.7 : 1,
											}}
										/>
									))}
								</Box>
							</Paper>
						</Stack>
					</Box>
				)}

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
						<CircularProgress />
					</Box>
				) : (
					<Stack spacing={3} sx={{ mt: 4 }}>
						{filteredBookings.length === 0 ? (
							<Paper
								elevation={0}
								sx={{
									p: 4,
									borderRadius: 3,
									border: (theme) => `1px dashed ${theme.palette.divider}`,
									textAlign: 'center',
								}}
							>
								<Typography variant='body1' color='text.secondary'>
									{emptyListMessage}
								</Typography>
							</Paper>
						) : (
							paginatedBookings.map((booking) => {
								const buyerName = [
									formatNamePart(booking.buyer?.last_name),
									formatNamePart(booking.buyer?.first_name),
								]
									.filter(Boolean)
									.join(' ');
								const statusLabel = ENUM_LABELS.BOOKING_STATUS[booking.status] || booking.status;
								const price = booking.pricing || {};
								const passengerCountLabel = booking.seats_number
									? `${LABELS.chips.seats}: ${booking.seats_number}`
									: null;
								const activeIssues = Object.entries(booking.issues || {}).filter(
									([key, value]) => key !== 'hold_expired' && value
								);
								const hasActiveIssues = activeIssues.length > 0;
								const bookingKey = `${booking.id}-${booking.booking_number}`;
								const isExpanded = expandedBookings[bookingKey] || false;

								return (
									<Card
										key={bookingKey}
										elevation={0}
										sx={{
											borderRadius: 3,
											border: (theme) => `1px solid ${theme.palette.divider}`,
										}}
									>
										<CardContent>
											<Stack spacing={2}>
												<Stack
													direction={{ xs: 'column', md: 'row' }}
													justifyContent='space-between'
													spacing={2}
													alignItems={{ md: 'center' }}
												>
													<Stack spacing={0.5}>
														<Typography variant='h5' sx={{ fontWeight: 600 }}>
															{booking.booking_number ||
																LABELS.placeholders.noBookingNumber}
														</Typography>
														<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
															<Chip
																label={statusLabel}
																size='small'
																variant='outlined'
																color={bookingStatusColors[booking.status] || 'default'}
																sx={chipBaseSx}
															/>
															{booking.booking_date && (
																<Typography variant='body2' color='text.secondary'>
																	{formatDateTime(booking.booking_date)}
																</Typography>
															)}
															{passengerCountLabel && (
																<Chip
																	label={passengerCountLabel}
																	size='small'
																	variant='outlined'
																	sx={chipBaseSx}
																/>
															)}
														</Box>
													</Stack>
													<Stack
														direction='row'
														spacing={1}
														flexWrap='wrap'
														alignItems='center'
													>
														{booking.user?.email && (
															<Chip
																label={`${LABELS.chips.user}: ${booking.user.email}`}
																size='small'
																variant='outlined'
																sx={chipBaseSx}
															/>
														)}
														{booking.public_id && (
															<Chip
																label={booking.public_id}
																size='small'
																variant='outlined'
																sx={chipBaseSx}
															/>
														)}
														<IconButton
															onClick={() => handleToggleBooking(bookingKey)}
															size='small'
															sx={{ ml: 1 }}
														>
															{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
														</IconButton>
													</Stack>
												</Stack>

												<Collapse in={isExpanded} timeout={200}>
													<Stack spacing={2}>
														<Divider />

														<Grid2 container spacing={2}>
															<Grid2 size={{ xs: 12, md: 6 }}>
																<Stack spacing={1}>
																	<Typography
																		variant='subtitle2'
																		color='text.secondary'
																		sx={{ fontWeight: 600 }}
																	>
																		{LABELS.sections.buyer}
																	</Typography>
																	<Stack spacing={0.5}>
																		<Typography
																			variant='body1'
																			sx={{ fontWeight: 500 }}
																		>
																			{buyerName || LABELS.placeholders.noBuyer}
																		</Typography>
																		{booking.buyer?.email && (
																			<Typography
																				variant='body2'
																				color='text.secondary'
																			>
																				{booking.buyer.email}
																			</Typography>
																		)}
																		{booking.buyer?.phone && (
																			<Typography
																				variant='body2'
																				color='text.secondary'
																			>
																				{booking.buyer.phone}
																			</Typography>
																		)}
																	</Stack>
																</Stack>
															</Grid2>
															<Grid2 size={{ xs: 12, md: 6 }}>
																<Stack spacing={1}>
																	<Typography
																		variant='subtitle2'
																		color='text.secondary'
																		sx={{ fontWeight: 600 }}
																	>
																		{LABELS.sections.pricing}
																	</Typography>
																	<Typography
																		variant='body1'
																		sx={{ fontWeight: 600 }}
																	>
																		{formatNumber(price.total_price)}{' '}
																		{ENUM_LABELS.CURRENCY_SYMBOL[price.currency] ||
																			price.currency ||
																			''}
																	</Typography>
																	<Typography variant='body2' color='text.secondary'>
																		{buildPricingDetails(price) ||
																			LABELS.placeholders.noPricing}
																	</Typography>
																</Stack>
															</Grid2>
														</Grid2>

														<Divider />

														<Stack spacing={1}>
															<Typography
																variant='subtitle2'
																color='text.secondary'
																sx={{ fontWeight: 600 }}
															>
																{LABELS.sections.flights}
															</Typography>
															<DataTable
																columns={FLIGHTS_COLUMNS}
																data={booking.flights || []}
																mapDataToRow={mapFlightToRow}
																emptyMessage={LABELS.emptyTableMessages.flights}
															/>
														</Stack>

														<Stack spacing={1}>
															<Typography
																variant='subtitle2'
																color='text.secondary'
																sx={{ fontWeight: 600 }}
															>
																{LABELS.sections.passengers}
															</Typography>
															<DataTable
																columns={PASSENGERS_COLUMNS}
																data={booking.passengers || []}
																mapDataToRow={mapPassengerToRow}
																emptyMessage={LABELS.emptyTableMessages.passengers}
															/>
														</Stack>

														<Stack spacing={1}>
															<Typography
																variant='subtitle2'
																color='text.secondary'
																sx={{ fontWeight: 600 }}
															>
																{LABELS.sections.payments}
															</Typography>
															<DataTable
																columns={PAYMENTS_COLUMNS}
																data={booking.payments || []}
																mapDataToRow={mapPaymentToRow}
																emptyMessage={LABELS.emptyTableMessages.payments}
															/>
														</Stack>

														<Stack spacing={1}>
															<Typography variant='subtitle2' color='text.secondary'>
																{LABELS.sections.statusHistory}
															</Typography>
															{(booking.status_history || []).length === 0 ? (
																<Typography variant='body2' color='text.secondary'>
																	{LABELS.placeholders.noStatusHistory}
																</Typography>
															) : (
																<Box
																	sx={{
																		mb: 2,
																		display: 'flex',
																		gap: 1,
																		flexWrap: 'wrap',
																	}}
																>
																	{(booking.status_history || []).map(
																		(entry, idx) => (
																			<Tooltip
																				key={`${booking.id}-status-${idx}`}
																				title={
																					entry.at
																						? formatDateTime(entry.at)
																						: ''
																				}
																			>
																				<Chip
																					label={
																						ENUM_LABELS.BOOKING_STATUS[
																							entry.status
																						] || entry.status
																					}
																					size='small'
																					variant='filled'
																					color={
																						bookingStatusColors[
																							entry.status
																						] || 'default'
																					}
																					sx={chipBaseSx}
																				/>
																			</Tooltip>
																		)
																	)}
																</Box>
															)}
														</Stack>

														{hasActiveIssues && (
															<Stack spacing={1}>
																<Typography variant='subtitle2' color='text.secondary'>
																	{LABELS.sections.issues}
																</Typography>
																<Stack direction='row' spacing={1} flexWrap='wrap'>
																	{activeIssues.map(([key]) => (
																		<Chip
																			key={`${booking.id}-issue-${key}`}
																			label={LABELS.issues[key] || key}
																			color={issueColors[key] || 'default'}
																			size='small'
																			sx={chipBaseSx}
																		/>
																	))}
																</Stack>
															</Stack>
														)}

														<Stack spacing={2}>
															<Divider />

															<Stack direction='row' spacing={1.5} flexWrap='wrap'>
																<Button
																	variant='contained'
																	color='error'
																	onClick={() => {}}
																>
																	{LABELS.actions.cancel}
																</Button>
																<Button
																	variant='outlined'
																	color='primary'
																	onClick={() => {}}
																>
																	{LABELS.actions.download}
																</Button>
															</Stack>
														</Stack>
													</Stack>
												</Collapse>
											</Stack>
										</CardContent>
									</Card>
								);
							})
						)}
						{filteredBookings.length > 0 && (
							<TablePagination
								component='div'
								count={filteredBookings.length}
								page={page}
								onPageChange={handlePageChange}
								rowsPerPage={rowsPerPage}
								onRowsPerPageChange={handleRowsPerPageChange}
								rowsPerPageOptions={[10, 25, 50, 100]}
								labelRowsPerPage={BUTTONS.pagination.rows_per_page}
								labelDisplayedRows={BUTTONS.pagination.displayed_rows}
							/>
						)}
					</Stack>
				)}
			</Box>
		</Base>
	);
};

export default BookingDashboard;
