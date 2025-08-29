import React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Grid,
	Typography,
} from '@mui/material';

import { FIELD_LABELS, ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatDate } from '../utils';

const PassengerDetailsModal = ({ passenger, onClose }) => {
	if (!passenger) return null;

	const fields = [
		{ label: FIELD_LABELS.PASSENGER.last_name, value: passenger.last_name },
		{ label: FIELD_LABELS.PASSENGER.first_name, value: passenger.first_name },
		{
			label: FIELD_LABELS.PASSENGER.patronymic_name,
			value: passenger.patronymic_name,
		},
		{
			label: FIELD_LABELS.PASSENGER.gender,
			value: ENUM_LABELS.GENDER[passenger.gender] || passenger.gender,
		},
		{
			label: FIELD_LABELS.PASSENGER.birth_date,
			value: passenger.birth_date ? formatDate(passenger.birth_date) : '',
		},
		{
			label: FIELD_LABELS.PASSENGER.document_type,
			value:
				ENUM_LABELS.DOCUMENT_TYPE[passenger.document_type] ||
				passenger.document_type,
		},
		{
			label: FIELD_LABELS.PASSENGER.document_number,
			value: passenger.document_number,
		},
		{
			label: FIELD_LABELS.PASSENGER.document_expiry_date,
			value: passenger.document_expiry_date
				? formatDate(passenger.document_expiry_date)
				: '',
		},
		{
			label: FIELD_LABELS.PASSENGER.citizenship_id,
			value: passenger.citizenship?.name,
		},
	];

	return (
		<Dialog open={!!passenger} onClose={onClose} fullWidth maxWidth='sm'>
			<DialogTitle>
				{`${passenger.last_name || ''} ${passenger.first_name || ''}`.trim() ||
					UI_LABELS.PROFILE.passenger_details}
			</DialogTitle>
			<DialogContent>
				<Grid container spacing={2}>
					{fields.map(({ label, value }) => (
						<Grid item xs={12} sm={6} key={label}>
							<Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
								{label}
							</Typography>
							<Typography variant='body1'>{value || '-'}</Typography>
						</Grid>
					))}
				</Grid>
			</DialogContent>
		</Dialog>
	);
};

export default PassengerDetailsModal;
