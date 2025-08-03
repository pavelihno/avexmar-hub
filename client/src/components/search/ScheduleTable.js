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
import { FIELD_LABELS, ENUM_LABELS } from '../../constants';
import { formatDate, formatTime } from '../utils';

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

const ScheduleTable = ({ flights, airlines, selectedId = null, onSelect = () => {} }) => {
        const [order, setOrder] = useState('asc');
        const [orderBy, setOrderBy] = useState('date');
        const [page, setPage] = useState(0);
        const [rowsPerPage, setRowsPerPage] = useState(10);

	const rows = useMemo(
		() =>
			flights.map((f) => {
				const airline = airlines.find((a) => a.id === f.airline_id);
                                return {
                                        id: f.id,
                                        flight: f,
                                        flight_number: f.airline_flight_number,
                                        date: formatDate(f.scheduled_departure, 'dd.MM.yyyy'),
                                        dateRaw: f.scheduled_departure,
                                        departure: formatTime(f.scheduled_departure_time),
                                        airline: airline ? airline.name : f.airline_id,
                                        price: f.min_price
                                                ? `${f.min_price} ${ENUM_LABELS.CURRENCY_SYMBOL[f.currency] || ''}`
                                                : '',
                                };
                        }),
                [flights, airlines]
        );

	const handleRequestSort = (property) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const sortedRows = useMemo(
		() => stableSort(rows, getComparator(order, orderBy)),
		[rows, order, orderBy]
	);

        const headCells = [
                { id: 'select', label: '' },
                { id: 'flight_number', label: FIELD_LABELS.FLIGHT.flight_number },
                { id: 'date', label: FIELD_LABELS.FLIGHT.scheduled_departure },
                { id: 'departure', label: FIELD_LABELS.FLIGHT.scheduled_departure_time },
                { id: 'airline', label: FIELD_LABELS.FLIGHT.airline_id },
                { id: 'price', label: FIELD_LABELS.TARIFF.price },
        ];

	return (
		<Box>
			<TableContainer>
				<Table size='small'>
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
                                                {sortedRows
                                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                        .map((row) => (
                                                                <TableRow key={row.id}>
                                                                        <TableCell padding='checkbox'>
                                                                                <Radio
                                                                                        checked={selectedId === row.id}
                                                                                        onClick={() =>
                                                                                                onSelect(
                                                                                                        selectedId === row.id
                                                                                                                ? null
                                                                                                                : row.flight
                                                                                                )
                                                                                        }
                                                                                />
                                                                        </TableCell>
                                                                        <TableCell>{row.flight_number}</TableCell>
                                                                        <TableCell>{row.date}</TableCell>
                                                                        <TableCell>{row.departure}</TableCell>
                                                                        <TableCell>{row.airline}</TableCell>
                                                                        <TableCell>{row.price}</TableCell>
                                                                </TableRow>
                                                        ))}
                                        </TableBody>
                                </Table>
                        </TableContainer>
                        <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component='div'
                                count={sortedRows.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                }}
                        />
                </Box>
        );
};

export default ScheduleTable;
