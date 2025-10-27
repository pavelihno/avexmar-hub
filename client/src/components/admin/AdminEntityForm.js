import React, { useState, useEffect } from 'react';
import {
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Grid2,
	Alert,
	Fade,
	Box,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { UI_LABELS } from '../../constants';
import { validateFormFields, extractErrorMessage } from './utils';

const AdminEntityForm = ({
	fields,
	initialData,
	onSave,
	onChange,
	onClose,
	isEditing,
	addButtonText,
	editButtonText,
	externalUpdates = {},
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const getInitialFormData = () => {
		if (isEditing && initialData?.id) {
			return initialData;
		}
		return fields.reduce((acc, field) => {
			if (field.defaultValue !== undefined && acc[field.name] === undefined) {
				acc[field.name] = field.defaultValue;
			}
			return acc;
		}, {});
	};

	const [formData, setFormData] = useState(getInitialFormData);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [validationErrors, setValidationErrors] = useState({});

	useEffect(() => {
		if (Object.keys(externalUpdates).length > 0) {
			setFormData((prev) => ({ ...prev, ...externalUpdates }));
		}
	}, [externalUpdates]);

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		if (successMessage) {
			setSuccessMessage('');
		}

		if (onChange) {
			onChange(field, value);
		}

		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: '' }));
		}
	};

	const handleSubmit = async () => {
		setValidationErrors({});
		const errors = validateFormFields(fields, formData);
		if (Object.keys(errors).length > 0) {
			setValidationErrors(errors);
			return;
		}

		setValidationErrors({});

		try {
			await onSave(formData);
			setSuccessMessage(isEditing ? UI_LABELS.SUCCESS.update : UI_LABELS.SUCCESS.add);
			setErrorMessage('');

			setTimeout(() => onClose(), 1000);
		} catch (error) {
			setErrorMessage(extractErrorMessage(error) || UI_LABELS.ERRORS.unknown);
			setSuccessMessage('');
		}
	};

	return (
		<>
			<DialogTitle>{isEditing ? editButtonText : addButtonText}</DialogTitle>
			<Box sx={{ px: 3 }}>
				<Fade in={!!errorMessage} timeout={300}>
					<div>{errorMessage && <Alert severity='error'>{errorMessage}</Alert>}</div>
				</Fade>

				<Fade in={!!successMessage} timeout={300}>
					<div>{successMessage && <Alert severity='success'>{successMessage}</Alert>}</div>
				</Fade>
			</Box>
			<DialogContent>
				<Grid2 container spacing={isMobile ? 1.5 : 2} sx={{ mt: 1 }}>
					{fields.map((field, index) => (
						<Grid2
							key={index}
							size={{
								xs: 12,
								sm: field.fullWidth ? 12 : 6,
							}}
						>
							{field.renderField({
								value: formData[field.name] ?? '',
								onChange: (value) => handleChange(field.name, value),
								fullWidth: true,
								error: !!validationErrors[field.name],
								helperText: validationErrors[field.name],
							})}
						</Grid2>
					))}
				</Grid2>
			</DialogContent>
			<DialogActions
				sx={{
					flexDirection: { xs: 'column-reverse', sm: 'row' },
					alignItems: { xs: 'stretch', sm: 'center' },
					gap: { xs: 1, sm: 2 },
					px: { xs: 3, sm: 3 },
					pb: { xs: 3, sm: 3 },
				}}
			>
				<Button onClick={onClose} sx={{ width: { xs: '100%', sm: 'auto' } }}>
					{UI_LABELS.BUTTONS.cancel}
				</Button>
				<Button
					onClick={handleSubmit}
					variant='contained'
					disabled={!!successMessage}
					sx={{ width: { xs: '100%', sm: 'auto' } }}
				>
					{UI_LABELS.BUTTONS.save}
				</Button>
			</DialogActions>
		</>
	);
};

export default AdminEntityForm;
