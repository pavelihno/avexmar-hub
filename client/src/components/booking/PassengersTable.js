import React from 'react';
import {
        Table,
        TableHead,
        TableRow,
        TableCell,
        TableBody,
} from '@mui/material';
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
                                        <TableCell>
                                                {UI_LABELS.BOOKING.confirmation.passenger_columns.name}
                                        </TableCell>
                                        <TableCell>
                                                {UI_LABELS.BOOKING.confirmation.passenger_columns.birth_date}
                                        </TableCell>
                                        <TableCell>
                                                {UI_LABELS.BOOKING.confirmation.passenger_columns.gender}
                                        </TableCell>
                                        <TableCell>
                                                {UI_LABELS.BOOKING.confirmation.passenger_columns.document}
                                        </TableCell>
                                </TableRow>
                        </TableHead>
                        <TableBody>
                                {passengers.map((p, idx) => (
                                        <TableRow key={p.id || idx}>
                                                <TableCell>{`${p.last_name || ''} ${p.first_name || ''}`}</TableCell>
                                                <TableCell>{formatDate(p.birth_date)}</TableCell>
                                                <TableCell>{ENUM_LABELS.GENDER_SHORT[p.gender]}</TableCell>
                                                <TableCell>{`${ENUM_LABELS.DOCUMENT_TYPE[p.document_type]}, ${p.document_number || ''}`}</TableCell>
                                        </TableRow>
                                ))}
                        </TableBody>
                </Table>
        );
};

export default PassengersTable;

