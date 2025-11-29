import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { Alert, Box, CircularProgress, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Base from '../../../Base';
import { UI_LABELS, ENUM_LABELS, FILE_NAME_TEMPLATES } from '../../../../constants';
import { formatDate, createFieldRenderer, FIELD_TYPES, formatTime } from '../../../utils';
import { fetchBookingDashboard } from '../../../../redux/actions/bookingDashboard';
import { fetchExportData } from '../../../../redux/actions/export';
import { downloadBookingPdf, downloadItineraryPdf } from '../../../../redux/actions/bookingProcess';
import { serverApi } from '../../../../api';
import BookingDashboardFilters from './BookingDashboardFilters';
import BookingDashboardSummary from './BookingDashboardSummary';
import BookingDashboardList from './BookingDashboardList';
import BookingRefundDialog from './BookingRefundDialog';

const LABELS = UI_LABELS.ADMIN.dashboard.bookings;

const initialFilters = {
	bookingNumber: '',
	routeId: '',
	flightId: '',
	buyerQuery: '',
	bookingDateFrom: '',
	bookingDateTo: '',
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
	ticket_refund: 'error',
	ticket_in_progress: 'info',
};

const mapFiltersToParams = (filters) => {
	const params = {};
	if (filters.bookingNumber) params.booking_number = filters.bookingNumber.trim();
	if (filters.routeId) params.route_id = Number(filters.routeId);
	if (filters.flightId) params.flight_id = Number(filters.flightId);
	if (filters.buyerQuery) params.buyer_query = filters.buyerQuery.trim();
	if (filters.bookingDateFrom) params.booking_date_from = filters.bookingDateFrom;
	if (filters.bookingDateTo) params.booking_date_to = filters.bookingDateTo;
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

const createInitialRefundConfirmationState = () => ({
	open: false,
	bookingId: null,
	bookingNumber: null,
	ticket: null,
	loading: false,
	data: null,
	error: null,
	submitting: false,
	success: false,
	actionType: null,
	rejectionReason: '',
	showRejectionReason: false,
});

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
	const [refundDialogState, setRefundDialogState] = useState(() => createInitialRefundConfirmationState());

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

	const resetRefundDialogState = () => {
		setRefundDialogState(createInitialRefundConfirmationState());
	};

	const handleCloseRefundDialog = () => {
		if (refundDialogState.submitting) return;
		resetRefundDialogState();
	};

	const handleOpenTicketRefundDialog = async (bookingItem, ticket, bookingNumberLabel) => {
		if (!bookingItem?.id || !ticket?.id) return;
		setRefundDialogState({
			...createInitialRefundConfirmationState(),
			open: true,
			bookingId: bookingItem.id,
			bookingNumber: bookingNumberLabel || bookingItem.booking_number || '',
			ticket,
			loading: true,
		});

		try {
			const response = await serverApi.get(
				`/booking/dashboard/bookings/${bookingItem.id}/tickets/${ticket.id}/refund`
			);
			const payload = response?.data || null;
			setRefundDialogState((prev) => ({
				...prev,
				loading: false,
				data: payload,
				error: null,
			}));
		} catch (err) {
			setRefundDialogState((prev) => ({
				...prev,
				loading: false,
				error: extractErrorMessage(err) || LABELS.refund.dialog.fetchError,
			}));
		}
	};

	const handleSubmitRefundAction = async (actionType) => {
		const bookingId = refundDialogState.bookingId;
		const ticketId = refundDialogState.ticket?.id;
		if (!bookingId || !ticketId) return;
		const resolvedAction = actionType === 'confirm' ? 'confirm' : 'reject';

		setRefundDialogState((prev) => ({
			...prev,
			submitting: true,
			success: false,
			actionType: resolvedAction,
			error: null,
		}));

		try {
			const requestData =
				resolvedAction === 'reject'
					? {
							rejection_reason: refundDialogState.rejectionReason.trim(),
					  }
					: {};

			await serverApi.post(
				`/booking/dashboard/bookings/${bookingId}/tickets/${ticketId}/refund/${resolvedAction}`,
				requestData
			);
			setRefundDialogState((prev) => ({
				...prev,
				submitting: false,
				success: true,
				showRejectionReason: false,
				error: null,
			}));

			if (hasSearched && appliedFilters) {
				dispatch(fetchBookingDashboard(mapFiltersToParams(appliedFilters)));
			}
		} catch (err) {
			setRefundDialogState((prev) => ({
				...prev,
				submitting: false,
				success: false,
				error: extractErrorMessage(err) || LABELS.refund.dialog.submitError,
			}));
		}
	};

	const handleRejectionReasonChange = (reason) => {
		setRefundDialogState((prev) => ({
			...prev,
			rejectionReason: reason,
		}));
	};

	const handleToggleRejectionReason = (show) => {
		setRefundDialogState((prev) => ({
			...prev,
			showRejectionReason: show,
		}));
	};

	const renderTicketAction = (bookingItem, ticket, bookingNumberLabel) => {
		const status = ticket?.status;

		if (status == 'refund_in_progress') {
			if (bookingItem?.id) {
				return (
					<Typography
						component='button'
						type='button'
						variant='body2'
						fontWeight={500}
						onClick={() => handleOpenTicketRefundDialog(bookingItem, ticket, bookingNumberLabel)}
						sx={{
							border: 'none',
							cursor: 'pointer',
							borderRadius: '4px',
							textDecoration: 'underline',
							'&:hover': {
								textDecoration: 'none',
							},
						}}
					>
						{LABELS.refund.link}
					</Typography>
				);
			}
		} else {
			return (
				<Typography variant='body2' color='text.secondary'>
					{ENUM_LABELS.BOOKING_FLIGHT_PASSENGER_STATUS[status] || status}
				</Typography>
			);
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
					const departureLabel = `${formatDate(flight.scheduled_departure)} ${formatTime(
						flight.scheduled_departure
					)}`.trim();

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

		if (normalized.bookingDateFrom || normalized.bookingDateTo) {
			const formattedFrom = normalized.bookingDateFrom ? formatDate(normalized.bookingDateFrom) : '';
			const formattedTo = normalized.bookingDateTo ? formatDate(normalized.bookingDateTo) : '';
			const rangeLabel = `${formattedFrom || normalized.bookingDateFrom || '—'} — ${
				formattedTo || normalized.bookingDateTo || '—'
			}`;
			parts.push(`${LABELS.filters.bookingDateRange}: ${rangeLabel}`);
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

			if (field === 'bookingDateFrom' && next.bookingDateTo) {
				if (new Date(value) > new Date(next.bookingDateTo)) {
					next.bookingDateTo = '';
				}
			}

			if (field === 'bookingDateTo' && next.bookingDateFrom) {
				if (new Date(value) < new Date(next.bookingDateFrom)) {
					next.bookingDateFrom = '';
				}
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

	const renderBookingDateFromField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.bookingDateFrom,
				type: FIELD_TYPES.DATE,
			}),
		[LABELS.filters.bookingDateFrom]
	);

	const renderBookingDateToField = useMemo(
		() =>
			createFieldRenderer({
				label: LABELS.filters.bookingDateTo,
				type: FIELD_TYPES.DATE,
			}),
		[LABELS.filters.bookingDateTo]
	);

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
					<BookingDashboardFilters
						labels={LABELS.filters}
						filters={filters}
						filtersExpanded={filtersExpanded}
						onToggleFilters={setFiltersExpanded}
						filtersSummaryText={filtersSummaryText}
						filtersError={filtersError}
						routesLoading={routesLoading}
						flightsLoading={flightsLoading}
						routeSelectOptions={routeSelectOptions}
						flightSelectOptions={flightSelectOptions}
						renderBookingNumberField={renderBookingNumberField}
						renderRouteField={renderRouteField}
						renderFlightField={renderFlightField}
						renderBuyerField={renderBuyerField}
						renderBookingDateFromField={renderBookingDateFromField}
						renderBookingDateToField={renderBookingDateToField}
						onFilterChange={handleFilterValueChange}
						onApplyFilters={handleApplyFilters}
						onResetFilters={handleResetFilters}
						isResetDisabled={isResetDisabled}
						isLoading={isLoading}
					/>
				</Box>

				{errors && (
					<Alert severity='error' sx={{ mt: 3 }}>
						{errors?.message || UI_LABELS.ERRORS.unknown}
					</Alert>
				)}

				{hasSearched && (
					<BookingDashboardSummary
						labels={LABELS.summary}
						summary={summary}
						statusSummary={statusSummary}
						issueSummary={issueSummary}
						statusFilter={statusFilter}
						issueFilter={issueFilter}
						onStatusChipClick={handleStatusChipClick}
						onIssueChipClick={handleIssueChipClick}
						statusColors={bookingStatusColors}
						issueColors={issueColors}
						chipSx={chipBaseSx}
						hasSearched={hasSearched}
					/>
				)}

				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
						<CircularProgress />
					</Box>
				) : (
					<BookingDashboardList
						bookings={paginatedBookings}
						totalCount={filteredBookings.length}
						emptyMessage={emptyListMessage}
						expandedBookings={expandedBookings}
						onToggleBooking={handleToggleBooking}
						page={page}
						rowsPerPage={rowsPerPage}
						onPageChange={handlePageChange}
						onRowsPerPageChange={handleRowsPerPageChange}
						labels={LABELS}
						statusColors={bookingStatusColors}
						issueColors={issueColors}
						chipBaseSx={chipBaseSx}
						renderTicketAction={renderTicketAction}
						onDownloadBookingPdf={handleDownloadBookingPdf}
						onDownloadItinerary={handleDownloadItinerary}
					/>
				)}
			</Box>
			<BookingRefundDialog
				state={refundDialogState}
				labels={LABELS}
				refundLabels={LABELS.refund}
				onClose={handleCloseRefundDialog}
				onAction={handleSubmitRefundAction}
				onRejectionReasonChange={handleRejectionReasonChange}
				onToggleRejectionReason={handleToggleRejectionReason}
			/>
		</Base>
	);
};

export default BookingDashboard;
