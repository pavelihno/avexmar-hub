import React, { useState, useEffect } from 'react';
import {
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Grid,
	Alert,
	Fade,
	Box,
} from '@mui/material';

const AdminEntityForm = ({
	title,
	fields,
	initialData,
	onSave,
	onClose,
	isEditing,
}) => {
	const [formData, setFormData] = useState(initialData || {});
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		setFormData(initialData || {});
	}, [initialData]);

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = () => {
		try {
			onSave(formData);
			setSuccessMessage(
				isEditing
					? 'Данные успешно обновлены'
					: 'Запись успешно добавлена'
			);
			setErrorMessage('');

			if (!isEditing) {
				setTimeout(() => onClose(), 1000);
			}
		} catch (error) {
			setErrorMessage(error);
			setSuccessMessage('');
		}
	};

	return (
		<>
			<DialogTitle>
				{isEditing ? `Редактировать ${title}` : `Добавить ${title}`}
			</DialogTitle>

			<Box sx={{ px: 3 }}>
				<Fade in={!!errorMessage} timeout={300}>
					<div>
						{errorMessage && (
							<Alert severity='error'>
								{errorMessage}
							</Alert>
						)}
					</div>
				</Fade>

				<Fade in={!!successMessage} timeout={300}>
					<div>
						{successMessage && (
							<Alert severity='success'>
								{successMessage}
							</Alert>
						)}
					</div>
				</Fade>
			</Box>

			<DialogContent>
				<Grid container spacing={2} sx={{ mt: 1 }}>
					{fields.map((field, index) => (
						<Grid
							item
							xs={12}
							sm={field.fullWidth ? 12 : 6}
							key={index}
						>
							{field.renderField({
								value:
									formData[field.name] ||
									field.defaultValue ||
									'',
								onChange: (value) =>
									handleChange(field.name, value),
								fullWidth: true,
							})}
						</Grid>
					))}
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Отмена</Button>
				<Button
					onClick={handleSubmit}
					variant='contained'
					disabled={!!successMessage}
				>
					Сохранить
				</Button>
			</DialogActions>
		</>
	);
};

export default AdminEntityForm;
