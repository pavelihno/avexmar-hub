import React, { useMemo, useState } from 'react';

import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	Radio,
	TablePagination,
} from '@mui/material';

import { FIELD_LABELS, ENUM_LABELS, DATE_YEAR_WEEKDAY_FORMAT, UI_LABELS } from '../../constants';
import { formatDate, formatNumber, formatTime, parseDate, parseTime } from '../utils';

function descendingComparator(a, b, orderBy) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

function getComparator(order, orderBy) {
	return order === 'desc'
		? (a, b) => descendingComparator(a, b, orderBy)
		: (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
	const stabilized = array.map((el, index) => [el, index]);
	stabilized.sort((a, b) => {
		const order = comparator(a[0], b[0]);
		if (order !== 0) return order;
		return a[1] - b[1];
	});
	return stabilized.map((el) => el[0]);
}

const ScheduleTable = ({ flights, selectedId = null, onSelect = () => {} }) => {
	const [order, setOrder] = useState('asc');
	const [orderBy, setOrderBy] = useState('scheduledDepartureDate');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleRequestSort = (property) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const sortedRows = useMemo(() => {
		const rows = flights.map((f) => {
			const airline = f.airline;
			return {
				id: f.id,
				flightNumber: f.flight_number,
				airlineFlightNumber: f.airline_flight_number,
				scheduledDepartureDate: parseDate(f.scheduled_departure),
				scheduledDepartureTime: parseTime(f.scheduled_departure_time),
				airline: airline,
				airlineName: airline.name,
				price: f.min_price,
				currency: f.currency,
			};
		});

		return stableSort(rows, getComparator(order, orderBy));
	}, [flights, order, orderBy]);

	const headCells = [
		{ id: 'airlineFlightNumber', label: FIELD_LABELS.FLIGHT.flight_number },
		{ id: 'scheduledDepartureDate', label: FIELD_LABELS.FLIGHT.scheduled_departure },
		{ id: 'scheduledDepartureTime', label: FIELD_LABELS.FLIGHT.scheduled_departure_time },
		{ id: 'airlineName', label: FIELD_LABELS.FLIGHT.airline_id },
		{ id: 'price', label: FIELD_LABELS.TARIFF.price },
		{ id: 'select', label: UI_LABELS.SCHEDULE.select },
	];

	return (
		<Box>
		<TableContainer sx={{ overflowX: { xs: 'auto', sm: 'auto', md: 'visible' } }}>
			<Table size='small' sx={{ minWidth: 650 }}>
					<TableHead>
						<TableRow>
							{headCells.map((headCell) => (
								<TableCell
									key={headCell.id}
									sortDirection={orderBy === headCell.id ? order : false}
									sx={{
										fontWeight: 'bold',
										cursor: headCell.id !== 'select' ? 'pointer' : 'default',
									}}
								>
									{headCell.id !== 'select' ? (
										<TableSortLabel
											active={orderBy === headCell.id}
											direction={orderBy === headCell.id ? order : 'asc'}
											onClick={() => handleRequestSort(headCell.id)}
										>
											{headCell.label}
										</TableSortLabel>
									) : (
										headCell.label
									)}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
							<TableRow key={row.id}>
								<TableCell>{row.airlineFlightNumber}</TableCell>
								<TableCell>
									{formatDate(row.scheduledDepartureDate, DATE_YEAR_WEEKDAY_FORMAT)}
								</TableCell>
								<TableCell>{formatTime(row.scheduledDepartureTime)}</TableCell>
								<TableCell>{row.airlineName}</TableCell>
								<TableCell>
									{`${UI_LABELS.SEARCH.flight_details.price_from.toLowerCase()} ${formatNumber(
										row.price
									)} ${ENUM_LABELS.CURRENCY_SYMBOL[row.currency] || ''}`}
								</TableCell>
								<TableCell padding='checkbox'>
									<Radio checked={selectedId === row.id} onClick={() => onSelect(row)} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				component='div'
				count={sortedRows.length}
				page={page}
				onPageChange={(e, newPage) => setPage(newPage)}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={(e) => {
					setRowsPerPage(parseInt(e.target.value));
					setPage(0);
				}}
				rowsPerPageOptions={[5, 10, 25]}
				labelRowsPerPage={UI_LABELS.SCHEDULE.pagination.rows_per_page}
				labelDisplayedRows={UI_LABELS.SCHEDULE.pagination.displayed_rows}
			/>
		</Box>
	);
};

export default ScheduleTable;
