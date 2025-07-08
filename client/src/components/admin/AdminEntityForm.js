import React, { useState, useEffect } from 'react';
import {
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Grid,
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

	useEffect(() => {
		setFormData(initialData || {});
	}, [initialData]);

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = () => {
		onSave(formData);
	};

	return (
		<>
			<DialogTitle>
				{isEditing ? `Редактировать ${title}` : `Добавить ${title}`}
			</DialogTitle>
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
				<Button onClick={handleSubmit} variant='contained'>
					Сохранить
				</Button>
			</DialogActions>
		</>
	);
};

export default AdminEntityForm;
