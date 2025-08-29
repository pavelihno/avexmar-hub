import React, { useMemo } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Grid,
	Typography,
	Box,
	Chip,
	Divider,
	Button,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

import { FIELD_LABELS, ENUM_LABELS, UI_LABELS } from '../../constants';
import { formatDate } from '../utils';
import { getPassengerFormConfig } from '../utils/businessLogic';

const PassengerDetailsModal = ({ passenger, onClose }) => {
	if (!passenger) return null;

	const formOrder = useMemo(() => getPassengerFormConfig(passenger.document_type)?.show || [], [passenger]);

	const labelMap = {
		lastName: FIELD_LABELS.PASSENGER.last_name,
		firstName: FIELD_LABELS.PASSENGER.first_name,
		patronymicName: FIELD_LABELS.PASSENGER.patronymic_name,
		gender: FIELD_LABELS.PASSENGER.gender,
		birthDate: FIELD_LABELS.PASSENGER.birth_date,
		documentType: FIELD_LABELS.PASSENGER.document_type,
		documentNumber: FIELD_LABELS.PASSENGER.document_number,
		documentExpiryDate: FIELD_LABELS.PASSENGER.document_expiry_date,
		citizenshipId: FIELD_LABELS.PASSENGER.citizenship_id,
	};

	const valueMap = {
		lastName: passenger.last_name,
		firstName: passenger.first_name,
		patronymicName: passenger.patronymic_name,
		gender: ENUM_LABELS.GENDER[passenger.gender] || passenger.gender,
		birthDate: passenger.birth_date ? formatDate(passenger.birth_date) : '',
		documentType: ENUM_LABELS.DOCUMENT_TYPE[passenger.document_type] || passenger.document_type,
		documentNumber: passenger.document_number,
		documentExpiryDate: passenger.document_expiry_date ? formatDate(passenger.document_expiry_date) : '',
		citizenshipId: passenger.citizenship?.name || passenger.citizenship_id,
	};

	const orderedFields = formOrder
		.map((key) => ({ key, label: labelMap[key], value: valueMap[key] }))
		.filter((f) => f.label);

	const personalKeys = ['gender', 'birthDate', 'citizenshipId'];
	const documentKeys = ['documentType', 'documentNumber', 'documentExpiryDate'];

	const personalFields = orderedFields.filter((f) => personalKeys.includes(f.key));
	const documentFields = orderedFields.filter((f) => documentKeys.includes(f.key));

	const fullName = `${passenger.last_name || ''} ${passenger.first_name || ''} ${
		passenger.patronymic_name || ''
	}`.trim();
	const documentBadge = `${ENUM_LABELS.DOCUMENT_TYPE[passenger.document_type] || passenger.document_type}${
		passenger.document_number ? ` · ${passenger.document_number}` : ''
	}`;

	return (
		<Dialog open={!!passenger} onClose={onClose} fullWidth maxWidth='sm'>
			<DialogTitle>{fullName || UI_LABELS.PROFILE.passenger_details}</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						{passenger.gender && (
							<Chip size='small' label={ENUM_LABELS.GENDER[passenger.gender] || passenger.gender} />
						)}
						{passenger.birth_date && (
							<Chip size='small' color='default' label={formatDate(passenger.birth_date)} />
						)}
						{documentBadge && (
							<Chip size='small' color='primary' variant='outlined' label={documentBadge} />
						)}
						{passenger.citizenship?.name && (
							<Chip size='small' variant='outlined' label={passenger.citizenship.name} />
						)}
					</Box>

					<Divider />

					{!!personalFields.length && (
						<Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
								<PersonOutlineIcon fontSize='small' color='action' />
								<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.PROFILE.personal || 'Личные данные'}
								</Typography>
							</Box>
							<Grid container spacing={2}>
								{personalFields.map(({ key, label, value }) => (
									<Grid item xs={12} sm={6} key={key}>
										<Typography
											variant='subtitle2'
											sx={{ fontWeight: 'bold', color: 'text.secondary' }}
										>
											{label}
										</Typography>
										<Typography variant='body1'>{value || '-'}</Typography>
									</Grid>
								))}
							</Grid>
						</Box>
					)}

					{!!documentFields.length && (
						<Box>
							<Divider sx={{ my: 2 }} />
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
								<AssignmentIndIcon fontSize='small' color='action' />
								<Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
									{UI_LABELS.PROFILE.document || 'Документ'}
								</Typography>
							</Box>
							<Grid container spacing={2}>
								{documentFields.map(({ key, label, value }) => (
									<Grid item xs={12} sm={6} key={key}>
										<Typography
											variant='subtitle2'
											sx={{ fontWeight: 'bold', color: 'text.secondary' }}
										>
											{label}
										</Typography>
										<Typography variant='body1'>{value || '-'}</Typography>
									</Grid>
								))}
							</Grid>
						</Box>
					)}
				</Box>
			</DialogContent>
			<Divider />
			<DialogActions>
				<Button onClick={onClose}>{UI_LABELS.BUTTONS.close}</Button>
			</DialogActions>
		</Dialog>
	);
};

export default PassengerDetailsModal;
