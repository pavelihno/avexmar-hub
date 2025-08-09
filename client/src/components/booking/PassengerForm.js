import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Box, Grid, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import { differenceInYears } from 'date-fns';

import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';
import { createFormFields, FIELD_TYPES } from '../utils';

const typeLabels = UI_LABELS.BOOKING.passenger_form.type_labels;

const genderOptions = UI_LABELS.BOOKING.passenger_form.genders;

const docTypeOptions = Object.entries(ENUM_LABELS.DOCUMENT_TYPE).map(([value, label]) => ({ value, label }));

const getAgeError = (type, birthDate) => {
	if (!birthDate) return VALIDATION_MESSAGES.PASSENGER.birth_date.REQUIRED;
	const age = differenceInYears(new Date(), new Date(birthDate));
	if (type === 'ADULT' && age < 12) return VALIDATION_MESSAGES.PASSENGER.birth_date.ADULT;
	if (type === 'CHILD' && (age < 2 || age > 12)) return VALIDATION_MESSAGES.PASSENGER.birth_date.CHILD;
	if (type === 'INFANT' && age >= 2) return VALIDATION_MESSAGES.PASSENGER.birth_date.INFANT;
	return '';
};

const PassengerForm = ({ passenger, onChange, onRemove, onSelectDocument }) => {
	const [data, setData] = useState({
		id: passenger?.id || '',
		type: passenger?.type || 'ADULT',
		lastName: passenger?.lastName || '',
		firstName: passenger?.firstName || '',
		gender: passenger?.gender || 'MALE',
		birthDate: passenger?.birthDate || '',
		documentType: passenger?.documentType || 'passport',
		documentNumber: passenger?.documentNumber || '',
	});

        const [errors, setErrors] = useState({});

        useEffect(() => {
                setData((prev) => ({ ...prev, ...passenger }));
        }, [passenger]);

        const formFields = useMemo(() => {
                const fields = {
                        lastName: {
                                key: 'lastName',
                                label: FIELD_LABELS.PASSENGER.last_name,
                                validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED : ''),
                        },
                        firstName: {
                                key: 'firstName',
                                label: FIELD_LABELS.PASSENGER.first_name,
                                validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED : ''),
                        },
                        gender: {
                                key: 'gender',
                                label: FIELD_LABELS.PASSENGER.gender,
                                type: FIELD_TYPES.SELECT,
                                options: genderOptions,
                        },
                        birthDate: {
                                key: 'birthDate',
                                label: FIELD_LABELS.PASSENGER.birth_date,
                                type: FIELD_TYPES.DATE,
                                validate: (v) => getAgeError(data.type, v),
                        },
                        documentType: {
                                key: 'documentType',
                                label: FIELD_LABELS.PASSENGER.document_type,
                                type: FIELD_TYPES.SELECT,
                                options: docTypeOptions,
                                validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.document_type.REQUIRED : ''),
                        },
                        documentNumber: {
                                key: 'documentNumber',
                                label: FIELD_LABELS.PASSENGER.document_number,
                                validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.document_number.REQUIRED : ''),
                        },
                };
                const arr = createFormFields(fields);
                return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
        }, [data.type]);

        const handleFieldChange = (field, value) => {
                const next = { ...data, [field]: value };
                setData(next);
                if (onChange) onChange(field, value, next);
                if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
        };

        const validate = useCallback(() => {
                const errs = {};
                Object.values(formFields).forEach((f) => {
                        if (f.validate) {
                                const err = f.validate(data[f.name]);
                                if (err) errs[f.name] = err;
                        }
                });
                setErrors(errs);
                return Object.keys(errs).length === 0;
        }, [formFields, data]);

        useEffect(() => {
                validate();
        }, [data.type, data.birthDate, validate]);

	const theme = useTheme();

	return (
		<Box sx={{ p: 2, border: `1px solid ${theme.palette.grey[200]}`, borderRadius: 2, mb: 3 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 2,
				}}
			>
				<Typography variant='h6'>{typeLabels[data.type]}</Typography>
				<Box>
					{onSelectDocument && (
						<IconButton onClick={onSelectDocument} size='small'>
							<DescriptionIcon />
						</IconButton>
					)}
					{onRemove && (
						<IconButton onClick={onRemove} size='small'>
							<DeleteIcon />
						</IconButton>
					)}
				</Box>
			</Box>
                        <Grid container spacing={2}>
                                {Object.values(formFields).map((field) => (
                                        <Grid item xs={12} sm={6} key={field.name}>
                                                {field.renderField({
                                                        value: data[field.name],
                                                        onChange: (value) =>
                                                                handleFieldChange(
                                                                        field.name,
                                                                        field.name === 'birthDate' && value
                                                                                ? value.toISOString().slice(0, 10)
                                                                                : value,
                                                                ),
                                                        fullWidth: true,
                                                        error: !!errors[field.name],
                                                        helperText: errors[field.name],
                                                })}
                                        </Grid>
                                ))}
                        </Grid>
                </Box>
        );
};

export default PassengerForm;
