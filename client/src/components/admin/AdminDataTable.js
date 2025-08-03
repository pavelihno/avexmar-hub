import { useState, useRef } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import ClearAllIcon from '@mui/icons-material/ClearAll';

import Base from '../Base';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { createFieldRenderer, FIELD_TYPES } from '../utils';
import { formatDate } from '../utils';
import { isDev } from '../../redux/reducers/auth';

const AdminDataTable = ({
	title,
	data,
	columns,
	onAdd,
	onEdit,
	onDelete,
	onDeleteAll = null,
	renderForm,
	getUploadTemplate = () => {},
        onUpload = () => Promise.resolve(),
        addButtonText = null,
        uploadButtonText = null,
        uploadTemplateButtonText = null,
        isLoading = false,
}) => {
	const [openDialog, setOpenDialog] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState({
		open: false,
		itemId: null,
	});
	const [showFilters, setShowFilters] = useState(false);
	const [deleteAllDialog, setDeleteAllDialog] = useState(false);
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

	const [uploadDialog, setUploadDialog] = useState(false);
	const [uploading, setUploading] = useState(false);

	const handleOpenDialog = (item) => {
		setCurrentItem(item);
		setIsEditing(!!item);
		setOpenDialog(true);
	};

	const fileInputRef = useRef();

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
		setUploading(false);
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		await processFile(file);
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

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleSave = (formData) => {
		if (isEditing) return onEdit(formData);
		else return onAdd(formData);
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

	const handleDeleteAll = () => {
		try {
			const result = onDeleteAll();
			result
				.then(() => {
					showNotification(UI_LABELS.SUCCESS.delete_all, 'success');
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
				if (col.type === FIELD_TYPES.DATE) {
					return itemValue === formatDate(value, 'yyyy-MM-dd');
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

		const getSortValue = (item) => {
			const raw = item[sortConfig.field];
			if (!column) return raw;
			if (column.formatter) return column.formatter(raw);
			if (column.type === FIELD_TYPES.SELECT) {
				const opt = column.options?.find((o) => o.value === raw);
				return opt ? opt.label : raw;
			}
			if (column.type === FIELD_TYPES.BOOLEAN) {
				return raw ? ENUM_LABELS.BOOLEAN.true : ENUM_LABELS.BOOLEAN.false;
			}
			return raw;
		};

		return [...items].sort((a, b) => {
			const aVal = getSortValue(a);
			const bVal = getSortValue(b);
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	};

	const filteredData = applyFilters(data);
	const sortedData = applySorting(filteredData);
	const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<Base maxWidth='xl'>
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
							onClick={() => openUploadDialog()}
							sx={{ ml: 2 }}
						>
							{uploadButtonText}
						</Button>
					</>
				)}

				{isDev && onDeleteAll && (
					<Button
						variant='outlined'
						color='error'
						size='small'
						startIcon={<DeleteIcon />}
						onClick={handleOpenDeleteAllDialog}
						sx={{
							ml: 2,
							fontSize: '0.75rem',
							fontWeight: 400,
							minHeight: 28,
							px: 1.5,
							py: 0.5,
						}}
					>
						{UI_LABELS.BUTTONS.delete_all}
					</Button>
				)}
                               <Box sx={{ position: 'relative' }}>
                                       <Box sx={{ visibility: isLoading ? 'hidden' : 'visible' }}>
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
                                                       <Table stickyHeader sx={{ tableLayout: 'auto' }}>
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
									{columns.map((col, idx) => {
										if (col.type === FIELD_TYPES.CUSTOM) return null;

										let options = [];
										if (col.type === FIELD_TYPES.SELECT || col.type === FIELD_TYPES.BOOLEAN) {
											options = col.options
												? [...col.options]
												: [
														{ value: true, label: ENUM_LABELS.BOOLEAN.true },
														{ value: false, label: ENUM_LABELS.BOOLEAN.false },
												  ];
											options.sort((a, b) => a.label.localeCompare(b.label));
											col = {
												...col,
												options: [{ value: '', label: UI_LABELS.ADMIN.filter.all }, ...options],
											};
										}

										const renderField = createFieldRenderer(col);

										return (
											<TableCell key={idx} align={col.align || 'left'}>
												{renderField({
													value: filters[col.field] ?? '',
													onChange: (val) => handleFilterChange(col.field, val, col.type),
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
											{UI_LABELS.ADMIN.filter.clear}
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
                                               </TableContainer>
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
                                       </Box>
                                       {isLoading && (
                                               <Box
                                                       sx={{
                                                               position: 'absolute',
                                                               top: 0,
                                                               left: 0,
                                                               right: 0,
                                                               bottom: 0,
                                                               backgroundColor: 'rgba(255, 255, 255, 0.8)',
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

				{/* Delete all dialog */}
				<Dialog open={deleteAllDialog} onClose={handleCloseDeleteAllDialog}>
					<DialogTitle id='delete-all-dialog-title'>{UI_LABELS.MESSAGES.confirm_action}</DialogTitle>
					<DialogContent>
						<Typography id='delete-all-dialog-description'>
							{UI_LABELS.MESSAGES.confirm_delete_all}
						</Typography>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseDeleteAllDialog} color='primary'>
							{UI_LABELS.BUTTONS.cancel}
						</Button>
						<Button onClick={confirmDeleteAll} color='error' variant='contained'>
							{UI_LABELS.BUTTONS.delete}
						</Button>
					</DialogActions>
				</Dialog>

				{/* Upload dialog */}
				<Dialog open={uploadDialog} onClose={closeUploadDialog}>
					<DialogTitle>{UI_LABELS.ADMIN.upload.title}</DialogTitle>
					<DialogContent>
						<Box
							onDragOver={(e) => e.preventDefault()}
							onDrop={(e) => {
								e.preventDefault();
								processFile(e.dataTransfer.files[0]);
								closeUploadDialog();
							}}
							sx={{
								border: '2px dashed',
								borderColor: 'grey.400',
								p: 4,
								textAlign: 'center',
							}}
						>
							<Typography sx={{ mb: 2 }}>{UI_LABELS.ADMIN.upload.drag}</Typography>
							<Button variant='outlined' onClick={() => fileInputRef.current?.click()}>
								{UI_LABELS.ADMIN.upload.select}
							</Button>
							<input
								type='file'
								ref={fileInputRef}
								style={{ display: 'none' }}
								onChange={handleFileChange}
							/>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button onClick={closeUploadDialog}>{UI_LABELS.BUTTONS.cancel}</Button>
					</DialogActions>
				</Dialog>

				<Backdrop open={uploading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
