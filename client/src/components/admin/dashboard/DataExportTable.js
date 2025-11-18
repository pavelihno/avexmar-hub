import React from 'react';
import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	Typography,
	CircularProgress,
	Radio,
	Checkbox,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { UI_LABELS } from '../../../constants';

const DataExportTable = ({
	headCells,
	rows,
	emptyMessage,
	isLoading = false,
	order,
	orderBy,
	onRequestSort,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	renderRow,
	selectedId,
	onSelectRow,
	showSelection = false,
	multiSelect = false,
	selectedIds = [],
	onToggleAll,
	minWidth = { xs: 500, sm: 600 },
}) => {
	const theme = useTheme();

	const handleSortClick = (property) => {
		if (onRequestSort) {
			onRequestSort(property);
		}
	};

	const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const isAllSelected = multiSelect && rows.length > 0 && selectedIds.length === rows.length;
	const isSomeSelected = multiSelect && selectedIds.length > 0 && selectedIds.length < rows.length;

	return (
		<Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
			<Paper variant='outlined' sx={{ borderRadius: 2 }}>
				<TableContainer sx={{ overflowX: { xs: 'auto', sm: 'auto', md: 'visible' } }}>
					<Table size='small' sx={{ minWidth }}>
						<TableHead>
							<TableRow>
								{showSelection && multiSelect && (
									<TableCell padding='checkbox' sx={{ width: 48 }}>
										<Checkbox
											indeterminate={isSomeSelected}
											checked={isAllSelected}
											onChange={onToggleAll}
											size='small'
											color='primary'
										/>
									</TableCell>
								)}
								{headCells.map((headCell) => (
									<TableCell
										key={headCell.id}
										sortDirection={orderBy === headCell.id ? order : false}
										sx={{
											fontWeight: 'bold',
											cursor: onRequestSort ? 'pointer' : 'default',
										}}
									>
										{onRequestSort ? (
											<TableSortLabel
												active={orderBy === headCell.id}
												direction={orderBy === headCell.id ? order : 'asc'}
												onClick={() => handleSortClick(headCell.id)}
											>
												{headCell.label}
											</TableSortLabel>
										) : (
											headCell.label
										)}
									</TableCell>
								))}
								{showSelection && !multiSelect && <TableCell padding='checkbox' sx={{ width: 48 }} />}
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.length > 0 &&
								paginatedRows.map((row, index) => {
									const isSelected = multiSelect
										? selectedIds.includes(row.id)
										: Boolean(showSelection && selectedId && String(selectedId) === String(row.id));

									return (
										<TableRow
											key={row.id || index}
											hover={showSelection}
											selected={isSelected}
											role={showSelection ? 'button' : undefined}
											sx={{ cursor: showSelection ? 'pointer' : 'default' }}
											onClick={
												showSelection && onSelectRow && !multiSelect
													? () => onSelectRow(row.id)
													: undefined
											}
										>
											{showSelection && multiSelect && (
												<TableCell padding='checkbox' onClick={(e) => e.stopPropagation()}>
													<Checkbox
														checked={isSelected}
														onChange={() => onSelectRow && onSelectRow(row.id)}
														size='small'
														color='primary'
													/>
												</TableCell>
											)}
											{renderRow(row, index)}
											{showSelection && !multiSelect && (
												<TableCell padding='checkbox' onClick={(e) => e.stopPropagation()}>
													<Radio
														checked={isSelected}
														onClick={() => onSelectRow && onSelectRow(row.id)}
														size='small'
														color='primary'
													/>
												</TableCell>
											)}
										</TableRow>
									);
								})}
							{rows.length === 0 && (
								<TableRow>
									<TableCell colSpan={headCells.length + (showSelection ? 1 : 0)}>
										<Typography variant='body2' color='text.secondary' align='center'>
											{emptyMessage}
										</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					component='div'
					count={rows.length}
					page={page}
					onPageChange={onPageChange}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={onRowsPerPageChange}
					rowsPerPageOptions={[10, 25, 50]}
					labelRowsPerPage={UI_LABELS.BUTTONS.pagination.rows_per_page}
					labelDisplayedRows={({ from, to, count }) =>
						UI_LABELS.BUTTONS.pagination.displayed_rows({ from, to, count })
					}
					sx={{
						'.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
							fontSize: { xs: '0.75rem', sm: '0.875rem' },
						},
					}}
				/>
			</Paper>

			{isLoading && (
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: alpha(theme.palette.white, 0.8),
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1,
					}}
				>
					<CircularProgress />
				</Box>
			)}
		</Box>
	);
};

export default DataExportTable;
