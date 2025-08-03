import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	TextField,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	FormControlLabel,
	Switch,
} from '@mui/material';
import { FIELD_LABELS, ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatDate, formatTime } from '../utils';
import { DATE_YEAR_WEEKDAY_FORMAT } from '../../constants/formats';

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

const ScheduleTable = ({ flights, airlines, from, to }) => {
	const [order, setOrder] = useState('asc');
	const [orderBy, setOrderBy] = useState('date');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [needReturn, setNeedReturn] = useState(false);
	const [returnDate, setReturnDate] = useState('');
	const [selected, setSelected] = useState(null);
	const navigate = useNavigate();

	const rows = useMemo(
		() =>
			flights.map((f) => {
				const airline = airlines.find((a) => a.id === f.airline_id);
				return {
					id: f.id,
					flight_number: f.airline_flight_number,
					date: formatDate(f.scheduled_departure, DATE_YEAR_WEEKDAY_FORMAT),
					dateRaw: f.scheduled_departure,
					departure: formatTime(f.scheduled_departure_time),
					airline: airline ? airline.name : f.airline_id,
					price: f.min_price ? `${f.min_price} ${ENUM_LABELS.CURRENCY_SYMBOL[f.currency] || ''}` : '',
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
		{ id: 'flight_number', label: FIELD_LABELS.FLIGHT.flight_number },
		{ id: 'date', label: FIELD_LABELS.FLIGHT.scheduled_departure },
		{ id: 'departure', label: FIELD_LABELS.FLIGHT.scheduled_departure_time },
		{ id: 'airline', label: FIELD_LABELS.FLIGHT.airline_id },
		{ id: 'price', label: FIELD_LABELS.TARIFF.price },
		{ id: 'action', label: '' },
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
										cursor: headCell.id !== 'action' ? 'pointer' : 'default',
									}}
								>
									{headCell.id !== 'action' ? (
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
						{sortedRows.map((row) => (
							<TableRow key={row.id}>
								<TableCell>{row.flight_number}</TableCell>
								<TableCell>{row.date}</TableCell>
								<TableCell>{row.departure}</TableCell>
								<TableCell>{row.airline}</TableCell>
								<TableCell>{row.price}</TableCell>
								<TableCell>
									<Button
										size='small'
										variant='outlined'
										onClick={() => {
											setSelected(row);
											setNeedReturn(false);
											setReturnDate('');
											setDialogOpen(true);
										}}
									>
										{UI_LABELS.SCHEDULE.discuss}
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
				<DialogTitle>{UI_LABELS.SCHEDULE.discuss}</DialogTitle>
				<DialogContent>
					<FormControlLabel
						control={<Switch checked={needReturn} onChange={(e) => setNeedReturn(e.target.checked)} />}
						label={UI_LABELS.SCHEDULE.ask_return}
					/>
					{needReturn && (
						<TextField
							type='date'
							label={UI_LABELS.HOME.search.return}
							value={returnDate}
							onChange={(e) => setReturnDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
							sx={{ mt: 2 }}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialogOpen(false)}>{UI_LABELS.BUTTONS.cancel}</Button>
					<Button
						onClick={() => {
							if (!selected) return;
							const params = new URLSearchParams();
							params.set('from', from);
							params.set('to', to);
							params.set('when', selected.dateRaw);
							params.set('date_mode', 'exact');
							params.set('flight', selected.flight_number);
							if (needReturn && returnDate) params.set('return', returnDate);
							navigate(`/search?${params.toString()}`);
						}}
						disabled={needReturn && !returnDate}
					>
						{UI_LABELS.BUTTONS.confirm}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ScheduleTable;
