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
	Snackbar,
	Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Base from '../Base';

const AdminDataTable = ({
	title,
	data,
	columns,
	onAdd,
	onEdit,
	onDelete,
	renderForm,
	addButtonText = 'Добавить',
}) => {
	const [openDialog, setOpenDialog] = useState(false);
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

	const handleCloseDialog = () => {
		setOpenDialog(false);
	};

	const handleSave = (formData) => {
		try {
			if (isEditing) {
				onEdit(formData);
			} else {
				onAdd(formData);
			}
		} catch (error) {
			showNotification(error.message || 'Ошибка при сохранении', 'error');
		}
	};

	const handleDelete = (id) => {
		try {
			const result = onDelete(id);

			result
				.then(() => {
					showNotification('Запись успешно удалена', 'success');
				})
				.catch((error) => {
					showNotification(
						`Ошибка: ${
							error.message || 'Не удалось удалить запись'
						}`,
						'error'
					);
				});
		} catch (error) {
			showNotification(
				`Ошибка: ${error.message || 'Не удалось удалить запись'}`,
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

				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={() => handleOpenDialog()}
					sx={{ mb: 3 }}
				>
					{addButtonText}
				</Button>

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
									Действия
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
												: item[column.field]}
										</TableCell>
									))}
									<TableCell align='right'>
										<IconButton
											onClick={() =>
												handleOpenDialog(item)
											}
										>
											<EditIcon />
										</IconButton>
										<IconButton
											onClick={() =>
												handleDelete(item.id)
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

				<Dialog
					open={openDialog}
					onClose={handleCloseDialog}
					maxWidth='md'
					fullWidth
				>
					{renderForm({
						isEditing,
						currentItem,
						onClose: handleCloseDialog,
						onSave: handleSave,
					})}
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
