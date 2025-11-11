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
import { UI_LABELS, ENUM_LABELS, BUTTONS, FILE_NAME_TEMPLATES } from '../../../constants';
import { formatDate, formatDateTime, formatNumber, createFieldRenderer, FIELD_TYPES } from '../../utils';
import { fetchBookingDashboard } from '../../../redux/actions/bookingDashboard';
import { fetchExportData } from '../../../redux/actions/export';
import { downloadBookingPdf, downloadItineraryPdf } from '../../../redux/actions/bookingProcess';
import { serverApi } from '../../../api';

const LABELS = UI_LABELS.ADMIN.dashboard.bookings;

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
	confirmed: 'default',
	payment_pending: 'default',
	payment_confirmed: 'default',
	payment_failed: 'error',
	completed: 'success',
	expired: 'warning',
	cancelled: 'error',
};

const issueColors = {
	pending_payment: 'info',
	failed_payment: 'error',
};

const getRouteLabel = (route) => {
	if (!route) return '—';
	if (route.label) return route.label;
	const origin =
		route.origin_airport?.city_name || route.origin_airport?.name || route.origin?.city || route.origin || null;
	const destination =
		route.destination_airport?.city_name ||
		route.destination_airport?.name ||
		route.destination?.city ||
		route.destination ||
		null;

	const parts = [origin, destination].filter(Boolean);
	return parts.length ? parts.join(' — ') : '—';
};

const formatPriceDetails = (priceDetails = {}) => {
	if (!priceDetails) return '';
	const parts = [];
	if (priceDetails.fare_price != null) {
		parts.push(`${LABELS.pricing.fare}: ${formatNumber(priceDetails.fare_price)}`);
	}
	if (priceDetails.total_discounts) {
		parts.push(`${LABELS.pricing.discounts}: −${formatNumber(priceDetails.total_discounts)}`);
	}
	if (priceDetails.total_fees != null) {
		parts.push(`${LABELS.pricing.fees}: ${formatNumber(priceDetails.total_fees)}`);
	}
	return parts.join(' • ');
};

const formatCitizenshipLabel = (citizenship) => {
	if (!citizenship) return '—';
	if (typeof citizenship === 'string') {
		return citizenship.trim() || '—';
	}
	if (typeof citizenship === 'object') {
		const code = typeof citizenship.code_a3 === 'string' ? citizenship.code_a3.trim() : '';
		const name = typeof citizenship.name === 'string' ? citizenship.name.trim() : '';
		if (code) return code;
		if (name) return name;
	}
	return '—';
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

const TICKETS_COLUMNS = [
	{ key: 'ticketNumber', label: LABELS.table.tickets.ticketNumber },
	{ key: 'passenger', label: LABELS.table.tickets.passenger },
	{ key: 'document', label: LABELS.table.tickets.document },
];

const mapFlightToRow = (flight) => {
	const seatClass = flight.tariff?.seat_class;
	const seatClassLabel = seatClass ? ENUM_LABELS.SEAT_CLASS[seatClass] || seatClass : '—';
	const departureLabel = flight.scheduled_departure ? formatDateTime(flight.scheduled_departure) : '—';
	const arrivalLabel = flight.scheduled_arrival ? formatDateTime(flight.scheduled_arrival) : '—';
	const airlineName = flight.airline?.name || flight.airline_name || flight.airline || '—';

	return {
		number: flight.airline_flight_number || flight.number || '—',
		route: getRouteLabel(flight.route),
		airline: airlineName,
		departure: departureLabel,
		arrival: arrivalLabel,
		class: seatClassLabel,
		tariff: flight.tariff?.title || '—',
	};
};

const mapPassengerToRow = (passenger) => {
	const fullName = [passenger.last_name, passenger.first_name, passenger.patronymic_name].filter(Boolean).join(' ');
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
	const citizenshipLabel = formatCitizenshipLabel(passenger.citizenship);

	return {
		name: fullName || '—',
		category: categoryLabel,
		document: documentLabel,
		citizenship: citizenshipLabel,
		birthDate: birthDateLabel,
	};
};

const mapPaymentToRow = (payment) => {
	const status = payment.payment_status || payment.status;
	const type = payment.payment_type || payment.type;
	const method = payment.payment_method || payment.method;
	const statusLabel = ENUM_LABELS.PAYMENT_STATUS[status] || status || '—';
	const typeLabel = ENUM_LABELS.PAYMENT_TYPE?.[type] || type || '—';
	const methodLabel = ENUM_LABELS.PAYMENT_METHOD?.[method] || method || '—';
	const amountLabel =
		payment.amount != null
			? `${formatNumber(payment.amount)} ${
					ENUM_LABELS.CURRENCY_SYMBOL[payment.currency] || payment.currency || ''
			  }`
			: '—';
	const paidAt = payment.paid_at || payment.paidAt;
	const expiresAt = payment.expires_at || payment.expiresAt;
	const paidAtLabel = paidAt ? formatDateTime(paidAt) : '—';
	const expiresAtLabel = expiresAt ? formatDateTime(expiresAt) : '—';

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

const mapTicketToRow = (ticket) => {
	const passenger = ticket?.passenger || {};
	const fullName = [passenger.last_name, passenger.first_name, passenger.patronymic_name].filter(Boolean).join(' ');
	const documentTypeLabel = passenger.document_type
		? ENUM_LABELS.DOCUMENT_TYPE?.[passenger.document_type] || passenger.document_type
		: null;
	const documentLabel = [documentTypeLabel, passenger.document_number].filter(Boolean).join(' · ');

	return {
		ticketNumber: ticket?.ticket_number || '—',
		passenger: fullName || '—',
		document: documentLabel || '—',
	};
};

const buildFlightTicketHeader = (flight) => {
	if (!flight) return '—';
	const flightNumber = flight.airline_flight_number || flight.number || '—';
	const routeLabel = getRouteLabel(flight.route);
	return [routeLabel, flightNumber].filter(Boolean).join(' • ');
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

	const triggerFileDownload = (fileData, filename) => {
		if (!fileData) return;
		const name = filename || 'booking.pdf';
		const url = window.URL.createObjectURL(new Blob([fileData]));
		const link = document.createElement('a');
		link.href = url;
		link.download = name;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(url);
	};

	const handleDownloadBookingPdf = async (publicId, bookingNumber) => {
		if (!publicId) return;
		try {
			const dataBlob = await dispatch(downloadBookingPdf({ publicId })).unwrap();
			triggerFileDownload(dataBlob, FILE_NAME_TEMPLATES.BOOKING_PDF(bookingNumber || publicId));
		} catch (err) {
			// ignore download errors in UI
		}
	};

	const handleDownloadItinerary = async (publicId, flight, bookingNumber) => {
		const bookingFlightId = flight?.booking_flight_id;
		if (!publicId || !bookingFlightId) return;
		try {
			const dataBlob = await dispatch(
				downloadItineraryPdf({
					publicId,
					bookingFlightId,
				})
			).unwrap();
			triggerFileDownload(
				dataBlob,
				FILE_NAME_TEMPLATES.ITINERARY_PDF(
					bookingNumber || publicId,
					flight?.airline_flight_number || flight?.number || bookingFlightId,
					formatDate(flight?.scheduled_departure)
				)
			);
		} catch (err) {
			// ignore download errors in UI
		}
	};

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
				const { data: payload } = await dispatch(
					fetchExportData({
						key: 'routes',
						endpoint: '/exports/flight-passengers/flight/routes',
					})
				).unwrap();
				if (!isMounted) return;
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
	}, [dispatch]);

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
				const response = await serverApi.get(`/exports/flight-passengers/flight/routes/${selectedRouteId}`);
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
								const bookingSnapshot = booking.snapshot || {};
								const bookingNumber =
									bookingSnapshot.booking_number || LABELS.placeholders.noBookingNumber;
								const bookingPublicId = bookingSnapshot.public_id;
								const bookingTimestamp = booking.created_at;
								const bookingDateLabel = bookingTimestamp
									? formatDateTime(bookingTimestamp)
									: bookingSnapshot.booking_date
									? formatDate(bookingSnapshot.booking_date)
									: null;
								const buyerName = [
									bookingSnapshot.buyer_last_name,
									bookingSnapshot.buyer_first_name,
									bookingSnapshot.buyer_patronymic_name,
								]
									.filter(Boolean)
									.join(' ');
								const statusLabel = ENUM_LABELS.BOOKING_STATUS[booking.status] || booking.status;
								const passengerCounts = bookingSnapshot.passenger_counts || {};
								const seatsTotal = Object.values(passengerCounts).reduce(
									(acc, rawCount) => acc + Number(rawCount || 0),
									0
								);
								const passengerCountLabel = seatsTotal ? `${LABELS.chips.seats}: ${seatsTotal}` : null;
								const flights = bookingSnapshot.flights || [];
								const passengers = bookingSnapshot.passengers || [];
								const payments = bookingSnapshot.payments || [];
								const activeIssues = Object.entries(booking.issues || {}).filter(
									([key, value]) => key !== 'hold_expired' && value
								);
								const hasActiveIssues = activeIssues.length > 0;
								const bookingKey = `${booking.id}-${
									bookingSnapshot.booking_number || bookingSnapshot.public_id || booking.id
								}`;
								const isExpanded = expandedBookings[bookingKey] || false;
								const priceDetails = bookingSnapshot.price_details || {};
								const finalPrice =
									priceDetails.final_price != null
										? priceDetails.final_price
										: bookingSnapshot.total_price;
								const currencyCode = priceDetails.currency || bookingSnapshot.currency || '';
								const buyerContacts = [
									bookingSnapshot.email_address,
									bookingSnapshot.phone_number,
								].filter(Boolean);
								const flightTariffsById = Array.isArray(priceDetails.directions)
									? priceDetails.directions.reduce((acc, direction) => {
											const flightId = direction?.flight_id;
											const tariff = direction?.tariff;
											if (flightId && tariff) {
												acc[flightId] = tariff;
											}
											return acc;
									  }, {})
									: {};
								const flightsForTable = flights.map((flight) => {
									const flightId = flight?.id;
									if (!flightId) {
										return flight;
									}
									const tariffFromPrice = flight.tariff || flightTariffsById[flightId];
									if (flight.tariff || !tariffFromPrice) {
										return flight;
									}
									return {
										...flight,
										tariff: tariffFromPrice,
									};
								});
								const paymentsWithMeta = payments.map((payment) => {
									const paymentType = payment?.payment_type ?? payment?.type ?? null;
									const expiresAt = payment?.expires_at ?? payment?.expiresAt ?? null;
									const additions = {};
									if (payment.payment_type == null && paymentType != null) {
										additions.payment_type = paymentType;
									}
									if (payment.expires_at == null && expiresAt != null) {
										additions.expires_at = expiresAt;
									}
									return Object.keys(additions).length > 0 ? { ...payment, ...additions } : payment;
								});

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
															{bookingNumber}
														</Typography>
														<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
															<Chip
																label={statusLabel}
																size='small'
																variant='outlined'
																color={bookingStatusColors[booking.status] || 'default'}
																sx={chipBaseSx}
															/>
															{bookingDateLabel && (
																<Typography variant='body2' color='text.secondary'>
																	{bookingDateLabel}
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
													<Box
														sx={{
															display: 'flex',
															flexDirection: 'row',
															gap: 1,
															flexWrap: 'wrap',
														}}
													>
														{booking.user?.email && (
															<Chip
																label={`${LABELS.chips.user}: ${booking.user.email}`}
																size='small'
																variant='outlined'
																sx={chipBaseSx}
															/>
														)}
														{bookingPublicId && (
															<Chip
																label={bookingPublicId}
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
													</Box>
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
																		{buyerContacts.length === 0 ? (
																			<Typography
																				variant='body2'
																				color='text.secondary'
																			>
																				—
																			</Typography>
																		) : (
																			buyerContacts.map((value, index) => (
																				<Typography
																					key={`${bookingKey}-contact-${index}`}
																					variant='body2'
																					color='text.secondary'
																				>
																					{value}
																				</Typography>
																			))
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
																		{finalPrice != null
																			? `${formatNumber(finalPrice)} ${
																					ENUM_LABELS.CURRENCY_SYMBOL[
																						currencyCode
																					] || currencyCode
																			  }`
																			: LABELS.placeholders.noPricing}
																	</Typography>
																	<Typography variant='body2' color='text.secondary'>
																		{formatPriceDetails(priceDetails) ||
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
																data={flightsForTable}
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
																data={passengers}
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
																{LABELS.sections.tickets}
															</Typography>
															{flights.length === 0 ? (
																<Typography variant='body2' color='text.secondary'>
																	{LABELS.placeholders.noFlights}
																</Typography>
															) : (
																<TableContainer
																	component={Paper}
																	variant='outlined'
																	sx={{ borderRadius: 0 }}
																>
																	<Table size='small'>
																		<TableHead>
																			<TableRow>
																				{TICKETS_COLUMNS.map((col) => (
																					<TableCell
																						key={col.key}
																						align={col.align || 'left'}
																					>
																						{col.label}
																					</TableCell>
																				))}
																			</TableRow>
																		</TableHead>
																		<TableBody>
																			{flights.map((flight, flightIdx) => {
																				const tickets = flight.tickets || [];
																				const canDownloadItinerary =
																					bookingPublicId &&
																					flight.booking_flight_id &&
																					tickets.length > 0;
																				const flightHeader =
																					buildFlightTicketHeader(flight) ||
																					LABELS.placeholders.noFlights;

																				return (
																					<React.Fragment
																						key={`${bookingKey}-tickets-${
																							flight.booking_flight_id ||
																							flightIdx
																						}`}
																					>
																						<TableRow>
																							<TableCell
																								colSpan={
																									TICKETS_COLUMNS.length
																								}
																								sx={{
																									py: 1,
																									position:
																										'relative',
																								}}
																							>
																								<Typography
																									variant='body2'
																									color='text.secondary'
																									sx={{
																										fontWeight: 500,
																										textDecoration:
																											'underline',
																									}}
																								>
																									{flightHeader}
																								</Typography>
																								{canDownloadItinerary && (
																									<Typography
																										component='span'
																										variant='body2'
																										color='primary'
																										onClick={() =>
																											handleDownloadItinerary(
																												bookingPublicId,
																												flight,
																												bookingNumber
																											)
																										}
																										sx={{
																											cursor: 'pointer',
																											textDecoration:
																												'underline',
																											'&:hover': {
																												textDecoration:
																													'none',
																											},
																											position:
																												'absolute',
																											right: 16,
																											top: '50%',
																											transform:
																												'translateY(-50%)',
																										}}
																									>
																										{
																											LABELS
																												.actions
																												.downloadItinerary
																										}
																									</Typography>
																								)}
																							</TableCell>
																						</TableRow>
																						{tickets.length === 0 ? (
																							<TableRow>
																								<TableCell
																									colSpan={
																										TICKETS_COLUMNS.length
																									}
																									align='center'
																								>
																									<Typography
																										variant='body2'
																										color='text.secondary'
																									>
																										{
																											LABELS
																												.emptyTableMessages
																												.tickets
																										}
																									</Typography>
																								</TableCell>
																							</TableRow>
																						) : (
																							tickets.map(
																								(ticket, ticketIdx) => {
																									const row =
																										mapTicketToRow(
																											ticket
																										);
																									return (
																										<TableRow
																											key={`${bookingKey}-ticket-${ticketIdx}`}
																										>
																											{TICKETS_COLUMNS.map(
																												(
																													col
																												) => (
																													<TableCell
																														key={
																															col.key
																														}
																														align={
																															col.align ||
																															'left'
																														}
																													>
																														{
																															row[
																																col
																																	.key
																															]
																														}
																													</TableCell>
																												)
																											)}
																										</TableRow>
																									);
																								}
																							)
																						)}
																					</React.Fragment>
																				);
																			})}
																		</TableBody>
																	</Table>
																</TableContainer>
															)}
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
																data={paymentsWithMeta}
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
																<Box
																	sx={{
																		display: 'flex',
																		flexDirection: 'row',
																		gap: 1,
																		flexWrap: 'wrap',
																	}}
																>
																	{activeIssues.map(([key]) => (
																		<Chip
																			key={`${booking.id}-issue-${key}`}
																			label={LABELS.issues[key] || key}
																			color={issueColors[key] || 'default'}
																			size='small'
																			sx={chipBaseSx}
																		/>
																	))}
																</Box>
															</Stack>
														)}

														<Stack spacing={2}>
															<Divider />

															<Box
																sx={{
																	display: 'flex',
																	flexDirection: 'row',
																	gap: 1.5,
																	flexWrap: 'wrap',
																}}
															>
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
																	component={Link}
																	to={
																		bookingPublicId
																			? `/booking/${bookingPublicId}`
																			: '#'
																	}
																	target='_blank'
																	rel='noopener noreferrer'
																	disabled={!bookingPublicId}
																>
																	{LABELS.actions.openBooking}
																</Button>
																<Button
																	variant='contained'
																	color='primary'
																	onClick={() =>
																		handleDownloadBookingPdf(
																			bookingPublicId,
																			bookingNumber
																		)
																	}
																	disabled={!bookingPublicId}
																>
																	{LABELS.actions.download}
																</Button>
															</Box>
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
