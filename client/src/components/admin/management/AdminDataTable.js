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
	TableSortLabel,
	TableRow,
	TablePagination,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Snackbar,
	Alert,
	Backdrop,
	CircularProgress,
	Stack,
	Paper,
	useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import ClearAllIcon from '@mui/icons-material/ClearAll';

import Base from '../../Base';
import { ADMIN, BUTTONS, SUCCESS, WARNINGS, ERRORS, MESSAGES, ENUM_LABELS, DATE_API_FORMAT } from '../../../constants';
import { FILE_NAMES } from '../../../constants/files';
import {
	createFieldRenderer,
	FIELD_TYPES,
	parseTime,
	formatDate,
	parseDate,
	DragAndDropUploadField,
} from '../../utils';
import { isDev } from '../../../redux/reducers/auth';
import { useTheme, alpha } from '@mui/material/styles';

const AdminDataTable = ({
	title,
	data,
	columns,
	onAdd,
	onEdit,
	onDelete,
	onDeleteAll = null,
	onDeleteFiltered = null,
	renderForm,
	getUploadTemplate = () => {},
	onUpload = () => Promise.resolve(),
	addButtonText = null,
	uploadButtonText = null,
	uploadTemplateButtonText = null,
	downloadButtonText = null,
	onDownload = null,
	isLoading = false,
}) => {
	const [openDialog, setOpenDialog] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState({
		open: false,
		itemId: null,
	});
	const [showFilters, setShowFilters] = useState(false);
	const [deleteAllDialog, setDeleteAllDialog] = useState(false);
	const [deleteFilteredDialog, setDeleteFilteredDialog] = useState(false);
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
	const theme = useTheme();
	const isMediumDown = useMediaQuery(theme.breakpoints.down('md'));
	const isSmallDown = useMediaQuery(theme.breakpoints.down('sm'));
	const devMode = isDev();

	const [uploadDialog, setUploadDialog] = useState(false);
	const [uploading, setUploading] = useState(false);

	const handleOpenDialog = (item) => {
		setCurrentItem(item);
		setIsEditing(!!item);
		setOpenDialog(true);
	};

	const openUploadDialog = () => {
		setUploadDialog(true);
	};

	const closeUploadDialog = () => {
		setUploadDialog(false);
	};

	const processFile = async (file) => {
		if (!file) return;
		setUploading(true);
		try {
			const result = await onUpload(file);

			if (result?.errorFile) {
				const url = window.URL.createObjectURL(result.errorFile);
				const link = document.createElement('a');
				link.href = url;
				link.setAttribute('download', FILE_NAMES.UPLOAD_ERRORS);
				document.body.appendChild(link);
				link.click();
				link.remove();
				window.URL.revokeObjectURL(url);

				showNotification(WARNINGS.upload, 'warning');
			} else {
				showNotification(SUCCESS.upload, 'success');
			}
		} catch (error) {
			showNotification(`${ERRORS.save}: ${error.message}`, 'error');
		}
		setUploading(false);
	};

	const handleUploadSelection = async (selected) => {
		if (!selected) return;
		await processFile(selected);
		closeUploadDialog();
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
	const handleOpenDeleteAllDialog = () => {
		setDeleteAllDialog(true);
	};

	const handleCloseDeleteAllDialog = () => {
		setDeleteAllDialog(false);
	};

	const confirmDeleteAll = () => {
		handleDeleteAll();
		setDeleteAllDialog(false);
	};

	const handleOpenDeleteFilteredDialog = () => {
		setDeleteFilteredDialog(true);
	};

	const handleCloseDeleteFilteredDialog = () => {
		setDeleteFilteredDialog(false);
	};

	const confirmDeleteFiltered = (ids) => {
		handleDeleteFiltered(ids);
		setDeleteFilteredDialog(false);
	};

	const handleSort = (field) => {
		const column = columns.find((c) => c.field === field);
		if (!column || column.type === FIELD_TYPES.CUSTOM) return;

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

	const handleFilterChange = (field, value, type = null) => {
		setFilters((prev) => {
			if (
				(type === FIELD_TYPES.SELECT || type === FIELD_TYPES.BOOLEAN) &&
				(value === '' || value === undefined || value === null)
			) {
				const updated = { ...prev };
				delete updated[field];
				return updated;
			}
			return { ...prev, [field]: value };
		});
		setPage(0);
	};

	const handleSave = (formData) => {
		return isEditing ? onEdit(formData) : onAdd(formData);
	};

	const handleDelete = (id) => {
		try {
			const result = onDelete(id);

			result
				.then(() => {
					showNotification(SUCCESS.delete, 'success');
				})
				.catch((error) => {
					showNotification(`${ERRORS.delete}: ${error.message}`, 'error');
				});
		} catch (error) {
			showNotification(`${ERRORS.delete}: ${error.message}`, 'error');
		}
	};

	const handleDeleteAll = () => {
		try {
			const result = onDeleteAll();
			result
				.then(() => {
					showNotification(SUCCESS.delete_all, 'success');
				})
				.catch((error) => {
					showNotification(`${ERRORS.delete}: ${error.message}`, 'error');
				});
		} catch (error) {
			showNotification(`${ERRORS.delete}: ${error.message}`, 'error');
		}
	};

	const handleDeleteFiltered = (ids) => {
		if (!onDeleteFiltered || !Array.isArray(ids) || ids.length === 0) return;
		try {
			const result = onDeleteFiltered(ids);
			result
				.then(() => {
					showNotification(SUCCESS.delete_filtered || SUCCESS.delete, 'success');
				})
				.catch((error) => {
					showNotification(`${ERRORS.delete}: ${error.message}`, 'error');
				});
		} catch (error) {
			showNotification(`${ERRORS.delete}: ${error.message}`, 'error');
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
				if (col.type === FIELD_TYPES.DATE) {
					return itemValue === formatDate(value, DATE_API_FORMAT);
				}
				return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
			})
		);
	};

	const clearFilters = () => {
		setFilters({});
		setPage(0);
	};

	const applySorting = (items) => {
		if (!sortConfig.field) return items;
		const column = columns.find((c) => c.field === sortConfig.field);
		if (!column || column.type === FIELD_TYPES.CUSTOM) return items;

		const getSortValue = (item) => {
			const raw = item[sortConfig.field];
			switch (column.type) {
				case FIELD_TYPES.DATE:
					return raw ? parseDate(raw) : 0;
				case FIELD_TYPES.TIME:
					return raw ? parseTime(raw) : 0;
				case FIELD_TYPES.NUMBER:
					return raw === undefined || raw === null ? 0 : Number(raw);
				case FIELD_TYPES.BOOLEAN:
					return raw ? 1 : 0;
				case FIELD_TYPES.SELECT: {
					const opt = column.options?.find((o) => o.value === raw);
					const label = opt ? opt.label : column.formatter ? column.formatter(raw) : raw;
					return label ? String(label).toLowerCase() : '';
				}
				case FIELD_TYPES.TEXT:
				case FIELD_TYPES.TEXT_AREA:
				case FIELD_TYPES.EMAIL:
				case FIELD_TYPES.PHONE:
					return raw ? String(raw).toLowerCase() : '';
				default:
					return raw;
			}
		};

		return [...items].sort((a, b) => {
			const aVal = getSortValue(a);
			const bVal = getSortValue(b);

			if (typeof aVal === 'string' && typeof bVal === 'string') {
				const comparison = aVal.localeCompare(bVal);
				return sortConfig.direction === 'asc' ? comparison : -comparison;
			}
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	};

	const filteredData = applyFilters(data);
	const filteredIds = Array.from(new Set(filteredData.map((item) => item?.id).filter((id) => id != null)));
	const hasActiveFilters =
		Object.keys(filters).length > 0 &&
		Object.values(filters).some((value) => value !== '' && value !== null && value !== undefined);
	const sortedData = applySorting(filteredData);
	const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const renderColumnValue = (column, item) => {
		if (!column) return '—';
		if (typeof column.render === 'function') {
			return column.render(item);
		}
		if (typeof column.formatter === 'function') {
			return column.formatter(item[column.field]);
		}
		const raw = item[column.field];
		if (raw === undefined || raw === null || raw === '') {
			return '—';
		}
		if (typeof raw === 'boolean') {
			return raw ? ENUM_LABELS.BOOLEAN.true : ENUM_LABELS.BOOLEAN.false;
		}
		return raw;
	};

	return (
		<Base maxWidth='xl'>
			<Box sx={{ p: { xs: 2, md: 3 } }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: 1.5,
						mb: { xs: 2, md: 3 },
					}}
				>
					<IconButton component={Link} to='/admin' sx={{ mr: { xs: 0, md: 2 } }}>
						<ArrowBackIcon />
					</IconButton>
					<Typography variant='h4'>{title}</Typography>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						gap: 1.5,
						mb: 2,
						alignItems: { xs: 'stretch', md: 'center' },
					}}
				>
					{addButtonText && (
						<Button
							variant='contained'
							color='primary'
							startIcon={<AddIcon />}
							onClick={(e) => {
								e.currentTarget.blur();
								handleOpenDialog();
							}}
							sx={{
								flexShrink: 0,
								width: { xs: '100%', md: 'auto' },
								minHeight: 48,
							}}
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
								sx={{
									flexShrink: 0,
									width: { xs: '100%', md: 'auto' },
									minHeight: 48,
								}}
							>
								{uploadTemplateButtonText}
							</Button>

							<Button
								variant='outlined'
								color='secondary'
								startIcon={<UploadIcon />}
								onClick={() => openUploadDialog()}
								sx={{
									flexShrink: 0,
									width: { xs: '100%', md: 'auto' },
									minHeight: 48,
								}}
							>
								{uploadButtonText}
							</Button>
						</>
					)}

					{downloadButtonText && onDownload && (
						<Button
							variant='outlined'
							color='success'
							startIcon={<DownloadIcon />}
							onClick={() => onDownload()}
							sx={{
								flexShrink: 0,
								width: { xs: '100%', md: 'auto' },
								minHeight: 48,
							}}
						>
							{downloadButtonText}
						</Button>
					)}

					{onDeleteAll && (
						<Button
							variant='outlined'
							color='error'
							size='small'
							startIcon={<DeleteIcon />}
							onClick={handleOpenDeleteAllDialog}
							disabled={hasActiveFilters || data.length === 0}
							sx={{
								fontSize: '0.75rem',
								fontWeight: 400,
								px: 1.5,
								py: 0.5,
								flexShrink: 0,
								width: { xs: '100%', md: 'auto' },
								minHeight: { xs: 40, md: 28 },
							}}
						>
							{BUTTONS.delete_all}
						</Button>
					)}
					{onDeleteFiltered && (
						<Button
							variant='outlined'
							color='error'
							size='small'
							startIcon={<DeleteSweepIcon />}
							onClick={handleOpenDeleteFilteredDialog}
							disabled={!hasActiveFilters || filteredIds.length === 0}
							sx={{
								fontSize: '0.75rem',
								fontWeight: 400,
								px: 1.5,
								py: 0.5,
								flexShrink: 0,
								width: { xs: '100%', md: 'auto' },
								minHeight: { xs: 40, md: 28 },
							}}
						>
							{BUTTONS.delete_filtered}
						</Button>
					)}
				</Box>
				<Box sx={{ position: 'relative' }}>
					<Box sx={{ visibility: isLoading ? 'hidden' : 'visible' }}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: { xs: 'stretch', md: 'flex-end' },
								alignItems: 'center',
								mb: 1.5,
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
									minHeight: { xs: 40, md: 28 },
									px: 1.5,
									py: 0.5,
									width: { xs: '100%', sm: 'auto' },
								}}
							>
								{showFilters ? ADMIN.filter.hide : ADMIN.filter.show}
							</Button>
						</Box>

						{showFilters && isMediumDown && (
							<Paper
								variant='outlined'
								sx={{
									mb: 2,
									p: 2,
									borderRadius: 2,
									display: { xs: 'block', md: 'none' },
								}}
							>
								<Stack spacing={1.5}>
									{columns
										.filter((col) => col.type !== FIELD_TYPES.CUSTOM)
										.map((col, idx) => {
											let preparedColumn = col;
											if (col.type === FIELD_TYPES.SELECT || col.type === FIELD_TYPES.BOOLEAN) {
												const options = col.options
													? [...col.options]
													: [
															{ value: true, label: ENUM_LABELS.BOOLEAN.true },
															{ value: false, label: ENUM_LABELS.BOOLEAN.false },
													  ];
												options.sort((a, b) => a.label.localeCompare(b.label));
												preparedColumn = {
													...col,
													options: [{ value: '', label: ADMIN.filter.all }, ...options],
												};
											}
											const renderField = createFieldRenderer(preparedColumn);
											return (
												<Box key={`mobile-filter-${preparedColumn.field || idx}`}>
													{renderField({
														value: filters[preparedColumn.field] ?? '',
														onChange: (val) =>
															handleFilterChange(
																preparedColumn.field,
																val,
																preparedColumn.type
															),
														size: 'small',
														fullWidth: true,
														sx: {
															width: '100%',
														},
														inputProps: {
															style: {
																fontSize: '0.875rem',
															},
														},
														displayEmpty: true,
														simpleSelect: true,
														MenuProps: preparedColumn.MenuProps,
														MenuItemProps: preparedColumn.MenuItemProps,
													})}
												</Box>
											);
										})}
								</Stack>
								<Button
									variant='outlined'
									color='primary'
									size='small'
									startIcon={<ClearAllIcon />}
									onClick={clearFilters}
									sx={{
										mt: 2,
										width: '100%',
										minHeight: 40,
									}}
								>
									{ADMIN.filter.clear}
								</Button>
							</Paper>
						)}

						<TableContainer
							sx={{
								maxHeight: 800,
								mb: 2,
								display: { xs: 'none', md: 'block' },
							}}
						>
							<Table size='small' stickyHeader sx={{ tableLayout: 'auto' }}>
								<TableHead>
									<TableRow>
										{columns.map((column, index) => (
											<TableCell
												key={index}
												align={column.align || 'left'}
												sx={{
													fontWeight: 'bold',
													cursor: column.type === FIELD_TYPES.CUSTOM ? 'default' : 'pointer',
												}}
												{...(column.type !== FIELD_TYPES.CUSTOM
													? { onClick: () => handleSort(column.field) }
													: {})}
											>
												{column.type !== FIELD_TYPES.CUSTOM ? (
													<TableSortLabel
														active={sortConfig.field === column.field}
														direction={sortConfig.direction}
													>
														{column.header}
													</TableSortLabel>
												) : (
													column.header
												)}
											</TableCell>
										))}
										<TableCell align='right' sx={{ fontWeight: 'bold' }}>
											{ADMIN.actions}
										</TableCell>
									</TableRow>
									{showFilters && (
										<TableRow
											sx={{
												display: { xs: 'none', md: 'table-row' },
											}}
										>
											{columns.map((col, idx) => {
												if (col.type === FIELD_TYPES.CUSTOM)
													return <TableCell key={idx} align={col.align || 'left'} />;

												let options = [];
												if (
													col.type === FIELD_TYPES.SELECT ||
													col.type === FIELD_TYPES.BOOLEAN
												) {
													options = col.options
														? [...col.options]
														: [
																{ value: true, label: ENUM_LABELS.BOOLEAN.true },
																{ value: false, label: ENUM_LABELS.BOOLEAN.false },
														  ];
													options.sort((a, b) => a.label.localeCompare(b.label));
													col = {
														...col,
														options: [{ value: '', label: ADMIN.filter.all }, ...options],
													};
												}

												const renderField = createFieldRenderer(col);

												return (
													<TableCell key={idx} align={col.align || 'left'}>
														{renderField({
															value: filters[col.field] ?? '',
															onChange: (val) =>
																handleFilterChange(col.field, val, col.type),
															size: 'small',
															fullWidth: true,
															sx: {
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
															},
															inputProps: {
																style: {
																	fontSize: '0.75rem',
																	padding: '4px 8px',
																	height: 20,
																	boxSizing: 'border-box',
																},
															},
															displayEmpty: true,
															simpleSelect: true,
															MenuProps: {
																PaperProps: {
																	sx: { fontSize: '0.75rem' },
																},
															},
															MenuItemProps: {
																sx: {
																	fontSize: '0.75rem',
																	minHeight: 28,
																	height: 28,
																},
															},
														})}
													</TableCell>
												);
											})}
											<TableCell align='right'>
												<Button
													variant='contained'
													color='action'
													size='small'
													startIcon={<ClearAllIcon />}
													onClick={clearFilters}
													sx={{
														fontSize: '0.75rem',
														fontWeight: 400,
														minHeight: 28,
														px: 1.5,
														py: 0.5,
													}}
												>
													{ADMIN.filter.clear}
												</Button>
											</TableCell>
										</TableRow>
									)}
								</TableHead>
								<TableBody>
									{paginatedData.map((item) => (
										<TableRow key={item.id}>
											{columns.map((column, index) => (
												<TableCell key={index} align={column.align || 'left'}>
													{renderColumnValue(column, item)}
												</TableCell>
											))}
											<TableCell align='right'>
												<IconButton
													color='info'
													onClick={(e) => {
														e.currentTarget.blur();
														handleOpenDialog(item);
													}}
												>
													<EditIcon />
												</IconButton>
												<IconButton
													color='error'
													onClick={() => handleOpenDeleteDialog(item.id)}
												>
													<DeleteIcon />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						<Box
							sx={{
								display: { xs: 'flex', md: 'none' },
								flexDirection: 'column',
								gap: 2,
								mb: 2,
							}}
						>
							{paginatedData.length === 0 ? (
								<Paper variant='outlined' sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
									<Typography variant='body2' color='text.secondary'>
										{ADMIN.empty.no_records}
									</Typography>
								</Paper>
							) : (
								paginatedData.map((item, index) => (
									<Paper
										variant='outlined'
										key={item.id ?? `mobile-row-${index}`}
										sx={{ p: 2, borderRadius: 2 }}
									>
										<Stack spacing={1.5}>
											{columns.map((column, colIndex) => {
												const value = renderColumnValue(column, item);
												const content = React.isValidElement(value) ? (
													value
												) : (
													<Typography variant='body2' color='text.primary'>
														{value}
													</Typography>
												);

												return (
													<Box
														key={`${item.id ?? index}-${column.field || colIndex}`}
														sx={{
															display: 'flex',
															flexDirection: 'column',
															gap: 0.5,
															width: '100%',
															maxWidth: '100%',
														}}
													>
														<Typography variant='caption' color='text.secondary'>
															{column.header}
														</Typography>
														<Box sx={{ width: '100%', maxWidth: '100%' }}>{content}</Box>
													</Box>
												);
											})}
											<Stack
												direction='row'
												spacing={1}
												justifyContent='flex-end'
												sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}
											>
												<IconButton
													color='info'
													size='small'
													onClick={(e) => {
														e.currentTarget.blur();
														handleOpenDialog(item);
													}}
												>
													<EditIcon fontSize='small' />
												</IconButton>
												<IconButton
													color='error'
													size='small'
													onClick={() => handleOpenDeleteDialog(item.id)}
												>
													<DeleteIcon fontSize='small' />
												</IconButton>
											</Stack>
										</Stack>
									</Paper>
								))
							)}
						</Box>

						<TablePagination
							component='div'
							count={sortedData.length}
							page={page}
							onPageChange={(e, newPage) => setPage(newPage)}
							rowsPerPage={rowsPerPage}
							onRowsPerPageChange={(e) => {
								setRowsPerPage(parseInt(e.target.value));
								setPage(0);
							}}
							rowsPerPageOptions={[10, 25, 50, 100]}
							labelRowsPerPage={BUTTONS.pagination.rows_per_page}
							labelDisplayedRows={BUTTONS.pagination.displayed_rows}
							sx={{
								mt: 1,
								'& .MuiTablePagination-toolbar': {
									flexWrap: { xs: 'wrap', md: 'nowrap' },
									justifyContent: { xs: 'center', md: 'flex-end' },
									gap: { xs: 1, md: 0 },
								},
								'& .MuiTablePagination-displayedRows': {
									marginTop: { xs: 0.5, md: 0 },
								},
							}}
						/>
					</Box>
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
				{/* Add/edit dialog */}
				<Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth fullScreen={isSmallDown}>
					{renderForm({
						isEditing: isEditing,
						currentItem: currentItem,
						onSave: handleSave,
						onClose: handleCloseDialog,
						formKey: `form-${isEditing ? currentItem?.id : 'new'}`,
					})}
				</Dialog>
				{/* Delete dialog */}
				<Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog} fullScreen={isSmallDown}>
					<DialogTitle id='delete-dialog-title'>{MESSAGES.confirm_action}</DialogTitle>

					<DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
						<Typography id='delete-dialog-description'>{MESSAGES.confirm_delete}</Typography>
					</DialogContent>
					<DialogActions
						sx={{
							flexDirection: { xs: 'column-reverse', sm: 'row' },
							alignItems: { xs: 'stretch', sm: 'center' },
							gap: { xs: 1, sm: 2 },
							px: { xs: 2, sm: 3 },
							pb: { xs: 2, sm: 3 },
						}}
					>
						<Button
							onClick={handleCloseDeleteDialog}
							color='primary'
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{BUTTONS.cancel}
						</Button>
						<Button
							onClick={confirmDelete}
							color='error'
							variant='contained'
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{BUTTONS.delete}
						</Button>
					</DialogActions>
				</Dialog>
				{/* Delete all dialog */}
				<Dialog open={deleteAllDialog} onClose={handleCloseDeleteAllDialog} fullScreen={isSmallDown}>
					<DialogTitle id='delete-all-dialog-title'>{MESSAGES.confirm_action}</DialogTitle>
					<DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
						<Typography id='delete-all-dialog-description'>{MESSAGES.confirm_delete_all}</Typography>
					</DialogContent>
					<DialogActions
						sx={{
							flexDirection: { xs: 'column-reverse', sm: 'row' },
							alignItems: { xs: 'stretch', sm: 'center' },
							gap: { xs: 1, sm: 2 },
							px: { xs: 2, sm: 3 },
							pb: { xs: 2, sm: 3 },
						}}
					>
						<Button
							onClick={handleCloseDeleteAllDialog}
							color='primary'
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{BUTTONS.cancel}
						</Button>
						<Button
							onClick={confirmDeleteAll}
							color='error'
							variant='contained'
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{BUTTONS.delete}
						</Button>
					</DialogActions>
				</Dialog>
				{/* Delete filtered dialog */}
				<Dialog open={deleteFilteredDialog} onClose={handleCloseDeleteFilteredDialog} fullScreen={isSmallDown}>
					<DialogTitle id='delete-filtered-dialog-title'>{MESSAGES.confirm_action}</DialogTitle>
					<DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
						<Typography id='delete-filtered-dialog-description'>
							{MESSAGES.confirm_delete_filtered}
						</Typography>
					</DialogContent>
					<DialogActions
						sx={{
							flexDirection: { xs: 'column-reverse', sm: 'row' },
							alignItems: { xs: 'stretch', sm: 'center' },
							gap: { xs: 1, sm: 2 },
							px: { xs: 2, sm: 3 },
							pb: { xs: 2, sm: 3 },
						}}
					>
						<Button
							onClick={handleCloseDeleteFilteredDialog}
							color='primary'
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{BUTTONS.cancel}
						</Button>
						<Button
							onClick={() => confirmDeleteFiltered(filteredIds)}
							color='error'
							variant='contained'
							disabled={!filteredIds.length}
							sx={{ width: { xs: '100%', sm: 'auto' } }}
						>
							{BUTTONS.delete}
						</Button>
					</DialogActions>
				</Dialog>
				{/* Upload dialog */}
				<Dialog open={uploadDialog} onClose={closeUploadDialog} fullScreen={isSmallDown}>
					<DialogTitle>{ADMIN.upload.title}</DialogTitle>
					<DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
						<DragAndDropUploadField
							dragText={ADMIN.upload.drag}
							buttonText={ADMIN.upload.select}
							onFileSelect={handleUploadSelection}
							disabled={uploading}
						/>
					</DialogContent>
					<DialogActions
						sx={{
							flexDirection: { xs: 'column-reverse', sm: 'row' },
							alignItems: { xs: 'stretch', sm: 'center' },
							gap: { xs: 1, sm: 2 },
							px: { xs: 2, sm: 3 },
							pb: { xs: 2, sm: 3 },
						}}
					>
						<Button onClick={closeUploadDialog} sx={{ width: { xs: '100%', sm: 'auto' } }}>
							{BUTTONS.cancel}
						</Button>
					</DialogActions>
				</Dialog>
				<Backdrop
					open={uploading}
					sx={{ color: theme.palette.white, zIndex: (theme) => theme.zIndex.modal + 1 }}
				>
					<CircularProgress color='inherit' />
				</Backdrop>
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
