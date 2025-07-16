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

import Base from '../Base';
import { UI_LABELS } from '../../constants';

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
	const [currentItem, setCurrentItem] = useState(null);
	const [isEditing, setIsEditing] = useState(false);

	const [notification, setNotification] = useState({
		open: false,
		message: '',
		severity: 'success',
	});

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
			await onUpload(file);
			showNotification(UI_LABELS.SUCCESS.upload, 'success');
		} catch (error) {
			showNotification(`${UI_LABELS.ERRORS.save}: ${error}`, 'error');
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

	const handleSave = (formData) => {
		try {
			if (isEditing) {
				onEdit(formData);
			} else {
				onAdd(formData);
			}
		} catch (error) {
			showNotification(
				`${UI_LABELS.ERRORS.save}: ${error.message}`,
				'error'
			);
		}
	};

	const handleDelete = (id) => {
		try {
			const result = onDelete(id);

			result
				.then(() => {
					showNotification(UI_LABELS.SUCCESS.delete, 'success');
				})
				.catch((error) => {
					showNotification(
						`${UI_LABELS.ERRORS.delete}: ${error.message}`,
						'error'
					);
				});
		} catch (error) {
			showNotification(
				`${UI_LABELS.ERRORS.delete}: ${error.message}`,
				'error'
			);
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

	return (
		<Base>
			<Box sx={{ p: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
						sx={{ mb: 3 }}
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
							sx={{ mb: 3, ml: 2 }}
						>
							{uploadTemplateButtonText}
						</Button>

						<Button
							variant='outlined'
							color='secondary'
							startIcon={<UploadIcon />}
							onClick={() => handleUploadDialog()}
							sx={{ mb: 3, ml: 2 }}
						>
							{uploadButtonText}
						</Button>
						<input
							type='file'
							ref={fileInputRef}
							style={{ display: 'none' }}
							onChange={handleFileChange}
						/>
					</>
				)}

				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								{columns.map((column, index) => (
									<TableCell
										key={index}
										align={column.align || 'left'}
										sx={{ fontWeight: 'bold' }}
									>
										{column.header}
									</TableCell>
								))}
								<TableCell
									align='right'
									sx={{ fontWeight: 'bold' }}
								>
									{UI_LABELS.ADMIN.actions}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.map((item) => (
								<TableRow key={item.id}>
									{columns.map((column, index) => (
										<TableCell
											key={index}
											align={column.align || 'left'}
										>
											{column.render
												? column.render(item)
												: column.formatter
												? column.formatter(
														item[column.field]
												  )
												: item[column.field]}
										</TableCell>
									))}
									<TableCell align='right'>
										<IconButton
											color='info'
											onClick={() =>
												handleOpenDialog(item)
											}
										>
											<EditIcon />
										</IconButton>
										<IconButton
											color='error'
											onClick={() =>
												handleOpenDeleteDialog(item.id)
											}
										>
											<DeleteIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>

				{/* Add/edit dialog */}
				<Dialog
					open={openDialog}
					onClose={handleCloseDialog}
					maxWidth='md'
					fullWidth
				>
					{renderForm({
						isEditing: isEditing,
						currentItem: currentItem,
						onClose: handleCloseDialog,
						onSave: handleSave,
					})}
				</Dialog>

				{/* Delete dialog */}
				<Dialog
					open={deleteDialog.open}
					onClose={handleCloseDeleteDialog}
				>
					<DialogTitle id='delete-dialog-title'>
						{UI_LABELS.MESSAGES.confirm_action}
					</DialogTitle>

					<DialogContent>
						<Typography id='delete-dialog-description'>
							{UI_LABELS.MESSAGES.confirm_delete}
						</Typography>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={handleCloseDeleteDialog}
							color='primary'
						>
							{UI_LABELS.BUTTONS.cancel}
						</Button>
						<Button
							onClick={confirmDelete}
							color='error'
							variant='contained'
						>
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
					<Alert
						onClose={handleCloseNotification}
						severity={notification.severity}
						sx={{ width: '100%' }}
					>
						{notification.message}
					</Alert>
				</Snackbar>
			</Box>
		</Base>
	);
};

export default AdminDataTable;
