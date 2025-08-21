import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { UI_LABELS, ENUM_LABELS } from '../../constants';
import { formatDate } from '../utils';

const PassengersTable = ({ passengers = [] }) => {
	if (!Array.isArray(passengers) || passengers.length === 0) {
		return null;
	}

	return (
		<Table size='small' sx={{ mb: 4 }}>
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
	);
};

export default PassengersTable;
