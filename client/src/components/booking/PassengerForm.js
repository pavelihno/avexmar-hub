import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Grid, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import { differenceInYears } from 'date-fns';

import { FIELD_LABELS, getEnumOptions, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';
import { fetchCountries } from '../../redux/actions/country';
import { createFormFields, FIELD_TYPES, isCyrillicText, isLatinText, isCyrillicDocument, getDocumentFieldConfig } from '../utils';

const typeLabels = UI_LABELS.BOOKING.passenger_form.type_labels;

const genderOptions = getEnumOptions('GENDER');
const docTypeOptions = getEnumOptions('DOCUMENT_TYPE');

const getAgeError = (type, birthDate) => {
	if (!birthDate) return VALIDATION_MESSAGES.PASSENGER.birth_date.REQUIRED;
	const age = differenceInYears(new Date(), new Date(birthDate));
	if (type === 'ADULT' && age < 12) return VALIDATION_MESSAGES.PASSENGER.birth_date.ADULT;
	if (type === 'CHILD' && (age < 2 || age > 12)) return VALIDATION_MESSAGES.PASSENGER.birth_date.CHILD;
	if (type === 'INFANT' && age >= 2) return VALIDATION_MESSAGES.PASSENGER.birth_date.INFANT;
	return '';
};

const PassengerForm = ({ passenger, onChange, onRemove, onSelectDocument, onValid }) => {
        const dispatch = useDispatch();
        const { countries } = useSelector((state) => state.countries);
        useEffect(() => {
                if (!countries || countries.length === 0) {
                        dispatch(fetchCountries());
                }
        }, [countries, dispatch]);

        const citizenshipOptions = (countries || []).map((c) => ({ value: c.id, label: c.name }));

        const [data, setData] = useState({
                id: passenger?.id || '',
                type: passenger?.type || 'ADULT',
                lastName: passenger?.lastName || '',
                firstName: passenger?.firstName || '',
                patronymicName: passenger?.patronymicName || '',
                gender: passenger?.gender || genderOptions[0]?.value || '',
                birthDate: passenger?.birthDate || '',
                documentType: passenger?.documentType || docTypeOptions[0]?.value || '',
                documentNumber: passenger?.documentNumber || '',
                documentExpiryDate: passenger?.documentExpiryDate || '',
                citizenshipId: passenger?.citizenshipId || '',
        });

	const [errors, setErrors] = useState({});

	useEffect(() => {
		setData((prev) => ({ ...prev, ...passenger }));
	}, [passenger]);

        const formFields = useMemo(() => {
                const requiresCyrillic = isCyrillicDocument(data.documentType);
                const { showExpiryDate, showCitizenship } = getDocumentFieldConfig(data.documentType);

                const fields = {
                        lastName: {
                                key: 'lastName',
                                label: FIELD_LABELS.PASSENGER.last_name,
                                validate: (v) => {
                                        if (!v) return VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED;
                                        const valid = requiresCyrillic ? isCyrillicText(v) : isLatinText(v);
                                        return valid
                                                ? ''
                                                : requiresCyrillic
                                                        ? VALIDATION_MESSAGES.PASSENGER.name_language.CYRILLIC
                                                        : VALIDATION_MESSAGES.PASSENGER.name_language.LATIN;
                                },
                        },
                        firstName: {
                                key: 'firstName',
                                label: FIELD_LABELS.PASSENGER.first_name,
                                validate: (v) => {
                                        if (!v) return VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED;
                                        const valid = requiresCyrillic ? isCyrillicText(v) : isLatinText(v);
                                        return valid
                                                ? ''
                                                : requiresCyrillic
                                                        ? VALIDATION_MESSAGES.PASSENGER.name_language.CYRILLIC
                                                        : VALIDATION_MESSAGES.PASSENGER.name_language.LATIN;
                                },
                        },
                        patronymicName: {
                                key: 'patronymicName',
                                label: FIELD_LABELS.PASSENGER.patronymic_name,
                                validate: (v) => {
                                        if (!v) return '';
                                        const valid = requiresCyrillic ? isCyrillicText(v) : isLatinText(v);
                                        return valid
                                                ? ''
                                                : requiresCyrillic
                                                        ? VALIDATION_MESSAGES.PASSENGER.name_language.CYRILLIC
                                                        : VALIDATION_MESSAGES.PASSENGER.name_language.LATIN;
                                },
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
                        ...(showExpiryDate && {
                                documentExpiryDate: {
                                        key: 'documentExpiryDate',
                                        label: FIELD_LABELS.PASSENGER.document_expiry_date,
                                        type: FIELD_TYPES.DATE,
                                },
                        }),
                        ...(showCitizenship && {
                                citizenshipId: {
                                        key: 'citizenshipId',
                                        label: FIELD_LABELS.PASSENGER.citizenship_id,
                                        type: FIELD_TYPES.SELECT,
                                        options: citizenshipOptions,
                                },
                        }),
                };
                const arr = createFormFields(fields);
                return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
        }, [data.type, data.documentType, citizenshipOptions]);

        const handleFieldChange = (field, value) => {
                const next = { ...data, [field]: value };
                setData(next);
                if (onChange) onChange(field, value, next);
                if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
                if (validate(next) && onValid) onValid(next);
        };

        const validate = useCallback(
                (d = data) => {
                        const errs = {};
                        Object.values(formFields).forEach((f) => {
                                if (f.validate) {
                                        const err = f.validate(d[f.name]);
                                        if (err) errs[f.name] = err;
                                }
                        });
                        setErrors(errs);
                        return Object.keys(errs).length === 0;
                },
                [formFields, data]
        );

        useEffect(() => {
                validate();
        }, [data.type, data.birthDate, data.documentType, validate]);

        useEffect(() => {
                if (formFields.citizenshipId && !data.citizenshipId && citizenshipOptions.length) {
                        setData((prev) => ({ ...prev, citizenshipId: citizenshipOptions[0].value }));
                }
        }, [formFields.citizenshipId, citizenshipOptions, data.citizenshipId]);

	const theme = useTheme();

        const nameFields = ['lastName', 'firstName', 'patronymicName'];
        const docConfig = getDocumentFieldConfig(data.documentType);
        const docFieldNames = ['documentType', 'documentNumber'];
        if (docConfig.showExpiryDate) docFieldNames.push('documentExpiryDate');
        if (docConfig.showCitizenship) docFieldNames.push('citizenshipId');
        const docGridSize = 12 / docFieldNames.length;

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
                        <Grid container spacing={1}>
                                {nameFields.map((fieldName) => (
                                        <Grid item xs={12} sm={4} key={fieldName}>
                                                {formFields[fieldName].renderField({
                                                        value: data[fieldName],
                                                        onChange: (value) => handleFieldChange(fieldName, value),
                                                        fullWidth: true,
                                                        size: 'small',
                                                        error: !!errors[fieldName],
                                                        helperText: errors[fieldName],
                                                })}
                                        </Grid>
                                ))}
                                {['gender', 'birthDate'].map((fieldName) => (
                                        <Grid item xs={12} sm={6} key={fieldName}>
                                                {formFields[fieldName].renderField({
                                                        value: data[fieldName],
                                                        onChange: (value) =>
                                                                handleFieldChange(
                                                                        fieldName,
                                                                        fieldName === 'birthDate' && value
                                                                                ? value.toISOString().slice(0, 10)
                                                                                : value
                                                                ),
                                                        fullWidth: true,
                                                        size: 'small',
                                                        error: !!errors[fieldName],
                                                        helperText: errors[fieldName],
                                                })}
                                        </Grid>
                                ))}
                                {docFieldNames.map((fieldName) => (
                                        <Grid item xs={12} sm={docGridSize} key={fieldName}>
                                                {formFields[fieldName].renderField({
                                                        value: data[fieldName],
                                                        onChange: (value) =>
                                                                handleFieldChange(
                                                                        fieldName,
                                                                        fieldName === 'documentExpiryDate' && value
                                                                                ? value.toISOString().slice(0, 10)
                                                                                : value
                                                                ),
                                                        fullWidth: true,
                                                        size: 'small',
                                                        error: !!errors[fieldName],
                                                        helperText: errors[fieldName],
                                                })}
                                        </Grid>
                                ))}
                        </Grid>
                </Box>
        );
};

export default PassengerForm;
