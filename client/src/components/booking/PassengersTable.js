import React from 'react';
import {
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	TableContainer,
	Box,
	Typography,
	Paper,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { formatDate } from '../utils';

const PassengersTable = ({ passengers = [] }) => {
	if (!Array.isArray(passengers) || passengers.length === 0) {
		return null;
	}

	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));

	if (isXs) {
		// Mobile card view
		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
				{passengers.map((p, idx) => {
					const {
						id,
						last_name = '',
						first_name = '',
						birth_date,
						gender: genderKey,
						document_type: docType,
						document_number: docNumber = '',
						citizenship,
					} = p;

					const passengerName = `${last_name} ${first_name}`.trim() || '—';
					const birthDate = birth_date ? formatDate(birth_date) : '';
					const gender = ENUM_LABELS.GENDER_SHORT?.[genderKey] ?? '';
					const docTypeLabel = ENUM_LABELS.DOCUMENT_TYPE?.[docType] ?? '';
					const codeA3 = docType === 'foreign_passport' ? citizenship?.code_a3 : undefined;
					const documentDetails = [
						docTypeLabel && (codeA3 ? `${docTypeLabel} (${codeA3})` : docTypeLabel),
						docNumber,
					]
						.filter(Boolean)
						.join(', ');

					return (
						<Paper key={id ?? idx} variant='outlined' sx={{ p: 1.5 }}>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 1,
									mb: 0.5,
									flexWrap: 'wrap',
								}}
							>
								<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
									{passengerName}
								</Typography>
							</Box>

							{(birthDate || gender) && (
								<Typography variant='body2' sx={{ color: 'text.secondary' }}>
									{[birthDate, gender].filter(Boolean).join(' · ')}
								</Typography>
							)}
							{documentDetails && (
								<Typography
									variant='caption'
									sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
								>
									{documentDetails}
								</Typography>
							)}
						</Paper>
					);
				})}
			</Box>
		);
	}

	// Desktop table view
	return (
		<TableContainer sx={{ overflowX: 'auto', mb: 2 }}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>{UI_LABELS.BOOKING.confirmation.passenger_columns.name}</TableCell>
						<TableCell>{UI_LABELS.BOOKING.confirmation.passenger_columns.birth_date}</TableCell>
						<TableCell>{UI_LABELS.BOOKING.confirmation.passenger_columns.gender}</TableCell>
						<TableCell>{UI_LABELS.BOOKING.confirmation.passenger_columns.document}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{passengers.map((p, idx) => {
						const {
							id,
							last_name = '',
							first_name = '',
							birth_date,
							gender: genderKey,
							document_type: docType,
							document_number: docNumber = '',
							citizenship,
						} = p;

						const passengerName = `${last_name} ${first_name}`.trim();
						const birthDate = birth_date ? formatDate(birth_date) : '';
						const gender = ENUM_LABELS.GENDER_SHORT?.[genderKey] ?? '';

						const docTypeLabel = ENUM_LABELS.DOCUMENT_TYPE?.[docType] ?? '';
						const codeA3 = docType === 'foreign_passport' ? citizenship?.code_a3 : undefined;

						const documentDetails = [
							docTypeLabel && (codeA3 ? `${docTypeLabel} (${codeA3})` : docTypeLabel),
							docNumber,
						]
							.filter(Boolean)
							.join(', ');

						return (
							<TableRow key={id ?? idx}>
								<TableCell>{passengerName}</TableCell>
								<TableCell>{birthDate}</TableCell>
								<TableCell>{gender}</TableCell>
								<TableCell>{documentDetails}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default PassengersTable;
