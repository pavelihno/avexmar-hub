import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import {
	Box,
	Typography,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TableSortLabel,
	TablePagination,
	TextField,
	Select,
	MenuItem,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Snackbar,
	Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

import Base from '../Base';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { FIELD_TYPES } from './utils';

const AdminDataTable = ({
	title,
	data,
	columns,
	onAdd,
	onEdit,
	onDelete,
	renderForm,
	getUploadTemplate = () => {},
	onUpload = () => Promise.resolve(),
	addButtonText = null,
	uploadButtonText = null,
	uploadTemplateButtonText = null,
}) => {
	const [openDialog, setOpenDialog] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState({
		open: false,
		itemId: null,
	});
	const [showFilters, setShowFilters] = useState(false);
	const [currentItem, setCurrentItem] = useState(null);
	const [isEditing, setIsEditing] = useState(false);

	const [notification, setNotification] = useState({
		open: false,
		message: '',
		severity: 'success',
	});

	const [sortConfig, setSortConfig] = useState({
		field: null,
		direction: 'asc',
	});
	const [filters, setFilters] = useState({});
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleOpenDialog = (item) => {
		setCurrentItem(item);
		setIsEditing(!!item);
		setOpenDialog(true);
	};

	const fileInputRef = React.useRef();

	const handleUploadDialog = () => {
		if (fileInputRef.current) {
			fileInputRef.current.value = null;
			fileInputRef.current.click();
		}
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		try {
			const result = await onUpload(file);

			if (result?.errorFile) {
				const url = window.URL.createObjectURL(result.errorFile);
				const link = document.createElement('a');
				link.href = url;
				link.setAttribute('download', 'upload_errors.xlsx');
				document.body.appendChild(link);
				link.click();
				link.remove();

				showNotification(UI_LABELS.WARNINGS.upload, 'warning');
			} else {
				showNotification(UI_LABELS.SUCCESS.upload, 'success');
			}
		} catch (error) {
			showNotification(`${UI_LABELS.ERRORS.save}: ${error.message}`, 'error');
		}
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
	};

	const handleOpenDeleteDialog = (id) => {
		setDeleteDialog({ open: true, itemId: id });
	};

	const handleCloseDeleteDialog = () => {
		setDeleteDialog({ open: false, itemId: null });
	};

	const confirmDelete = () => {
		handleDelete(deleteDialog.itemId);
		handleCloseDeleteDialog();
	};

	const handleSort = (field) => {
		setSortConfig((prev) => {
			if (prev.field === field) {
				return {
					field,
					direction: prev.direction === 'asc' ? 'desc' : 'asc',
				};
			}
			return { field, direction: 'asc' };
		});
	};

	const handleFilterChange = (field, value) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
		setPage(0);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

        const handleSave = (formData) => {
                if (isEditing) {
                        return onEdit(formData);
                }
                return onAdd(formData);
        };

	const handleDelete = (id) => {
		try {
			const result = onDelete(id);

			result
				.then(() => {
					showNotification(UI_LABELS.SUCCESS.delete, 'success');
				})
				.catch((error) => {
					showNotification(`${UI_LABELS.ERRORS.delete}: ${error.message}`, 'error');
				});
		} catch (error) {
			showNotification(`${UI_LABELS.ERRORS.delete}: ${error.message}`, 'error');
		}
	};

	const showNotification = (message, severity = 'success') => {
		setNotification({
			open: true,
			message,
			severity,
		});
	};

	const handleCloseNotification = () => {
		setNotification({
			...notification,
			open: false,
		});
	};

	const applyFilters = (items) => {
		return items.filter((item) =>
			columns.every((col) => {
				if (col.type === FIELD_TYPES.CUSTOM) return true;
				const value = filters[col.field];
				if (value === undefined || value === '' || value === null) return true;
				const itemValue = item[col.field];
				if (col.type === FIELD_TYPES.SELECT || col.type === FIELD_TYPES.BOOLEAN) {
					return itemValue === value;
				}
				return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
			})
		);
	};

	const applySorting = (items) => {
		if (!sortConfig.field) return items;
		return [...items].sort((a, b) => {
			const aVal = a[sortConfig.field];
			const bVal = b[sortConfig.field];
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	};

	const filteredData = applyFilters(data);
	const sortedData = applySorting(filteredData);
	const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<Base>
			<Box sx={{ p: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<IconButton component={Link} to='/admin' sx={{ mr: 2 }}>
						<ArrowBackIcon />
					</IconButton>
					<Typography variant='h4'>{title}</Typography>
				</Box>

				{addButtonText && (
					<Button
						variant='contained'
						color='primary'
						startIcon={<AddIcon />}
						onClick={() => handleOpenDialog()}
					>
						{addButtonText}
					</Button>
				)}

				{uploadButtonText && uploadTemplateButtonText && (
					<>
						<Button
							variant='outlined'
							startIcon={<DownloadIcon />}
							onClick={() => getUploadTemplate()}
							sx={{ ml: 2 }}
						>
							{uploadTemplateButtonText}
						</Button>

						<Button
							variant='outlined'
							color='secondary'
							startIcon={<UploadIcon />}
							onClick={() => handleUploadDialog()}
							sx={{ ml: 2 }}
						>
							{uploadButtonText}
						</Button>
						<input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
					</>
				)}
				<TableContainer sx={{ maxHeight: 800, mb: 2 }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'flex-end',
							alignItems: 'center',
						}}
					>
						<Button
							variant='contained'
							color='action'
							size='small'
							startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
							onClick={() => setShowFilters((prev) => !prev)}
							sx={{
								fontSize: '0.75rem',
								fontWeight: 400,
								minHeight: 28,
								px: 1.5,
								py: 0.5,
							}}
						>
							{showFilters ? UI_LABELS.ADMIN.filter.hide : UI_LABELS.ADMIN.filter.show}
						</Button>
					</Box>
					<Table stickyHeader sx={{ tableLayout: 'fixed' }}>
						<TableHead>
							<TableRow>
								{columns.map((column, index) => (
									<TableCell
										key={index}
										align={column.align || 'left'}
										sx={{
											fontWeight: 'bold',
											cursor: 'pointer',
										}}
										onClick={() => handleSort(column.field)}
									>
										<TableSortLabel
											active={sortConfig.field === column.field}
											direction={sortConfig.direction}
										>
											{column.header}
										</TableSortLabel>
									</TableCell>
								))}
								<TableCell align='right' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.ADMIN.actions}
								</TableCell>
							</TableRow>
							{showFilters && (
								<TableRow>
									{columns.map((column, index) =>
										column.type === FIELD_TYPES.CUSTOM ? null : (
											<TableCell key={index} align={column.align || 'left'}>
												{column.type === FIELD_TYPES.SELECT ||
												column.type === FIELD_TYPES.BOOLEAN ? (
													<Select
														value={filters[column.field] || ''}
														onChange={(e) =>
															handleFilterChange(column.field, e.target.value)
														}
														displayEmpty
														size='small'
														fullWidth
														sx={{
															fontSize: '0.75rem',
															minHeight: 28,
															height: 28,
															py: 0,
														}}
														MenuProps={{
															PaperProps: {
																sx: {
																	fontSize: '0.75rem',
																},
															},
														}}
													>
														<MenuItem
															value=''
															sx={{
																fontSize: '0.75rem',
																minHeight: 28,
																height: 28,
															}}
														>
															{UI_LABELS.ADMIN.filter.all}
														</MenuItem>
														{(
															column.options ||
															(column.type === FIELD_TYPES.BOOLEAN
																? [
																		{
																			value: true,
																			label: ENUM_LABELS.BOOLEAN.true,
																		},
																		{
																			value: false,
																			label: ENUM_LABELS.BOOLEAN.false,
																		},
																  ]
																: [])
														).map((opt) => (
															<MenuItem
																key={opt.value}
																value={opt.value}
																sx={{
																	fontSize: '0.75rem',
																	minHeight: 28,
																	height: 28,
																}}
															>
																{opt.label}
															</MenuItem>
														))}
													</Select>
												) : (
													<TextField
														value={filters[column.field] || ''}
														onChange={(e) =>
															handleFilterChange(column.field, e.target.value)
														}
														size='small'
														fullWidth
														inputProps={{
															style: {
																fontSize: '0.75rem',
																padding: '4px 8px',
																height: 20,
																boxSizing: 'border-box',
															},
														}}
														sx={{
															minWidth: 0,
															maxWidth: 150,
															'& .MuiInputBase-root': {
																fontSize: '0.75rem',
																height: 28,
																minHeight: 28,
																padding: '0 8px',
															},
															'& .MuiInputBase-input': {
																fontSize: '0.75rem',
																height: 20,
																padding: '4px 0',
															},
														}}
													/>
												)}
											</TableCell>
										)
									)}
									<TableCell align='right' />
								</TableRow>
							)}
						</TableHead>
						<TableBody>
							{paginatedData.map((item) => (
								<TableRow key={item.id}>
									{columns.map((column, index) => (
										<TableCell key={index} align={column.align || 'left'}>
											{column.render
												? column.render(item)
												: column.formatter
												? column.formatter(item[column.field])
												: item[column.field]}
										</TableCell>
									))}
									<TableCell align='right'>
										<IconButton color='info' onClick={() => handleOpenDialog(item)}>
											<EditIcon />
										</IconButton>
										<IconButton color='error' onClick={() => handleOpenDeleteDialog(item.id)}>
											<DeleteIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<TablePagination
						component='div'
						count={sortedData.length}
						page={page}
						onPageChange={handleChangePage}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={handleChangeRowsPerPage}
						rowsPerPageOptions={[10, 25, 50]}
						labelRowsPerPage={UI_LABELS.ADMIN.rows.per_page}
						labelDisplayedRows={({ from, to, count }) =>
							`${from}-${to} ${UI_LABELS.ADMIN.rows.from} ${
								count !== -1 ? count : `${UI_LABELS.ADMIN.rows.more_than} ${to}`
							}`
						}
					/>
				</TableContainer>

				{/* Add/edit dialog */}
				<Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth>
					{renderForm({
						isEditing: isEditing,
						currentItem: currentItem,
						onClose: handleCloseDialog,
						onSave: handleSave,
					})}
				</Dialog>

				{/* Delete dialog */}
				<Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
					<DialogTitle id='delete-dialog-title'>{UI_LABELS.MESSAGES.confirm_action}</DialogTitle>

					<DialogContent>
						<Typography id='delete-dialog-description'>{UI_LABELS.MESSAGES.confirm_delete}</Typography>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseDeleteDialog} color='primary'>
							{UI_LABELS.BUTTONS.cancel}
						</Button>
						<Button onClick={confirmDelete} color='error' variant='contained'>
							{UI_LABELS.BUTTONS.delete}
						</Button>
					</DialogActions>
				</Dialog>

				<Snackbar
					open={notification.open}
					autoHideDuration={4000}
					onClose={handleCloseNotification}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
						{notification.message}
					</Alert>
				</Snackbar>
			</Box>
		</Base>
	);
};

export default AdminDataTable;
