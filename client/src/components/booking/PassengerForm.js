import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';

import { Box, Grid, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { FIELD_LABELS, getEnumOptions, UI_LABELS, VALIDATION_MESSAGES, DATE_API_FORMAT } from '../../constants';
import {
        createFormFields,
        FIELD_TYPES,
        isCyrillicText,
        isLatinText,
        isCyrillicDocument,
        getPassengerFormConfig,
        getAgeError,
        validateDate,
        parseDate,
        formatDate,
} from '../utils';
import { addYears, subYears } from 'date-fns';

const typeLabels = UI_LABELS.BOOKING.passenger_form.type_labels;

const genderOptions = getEnumOptions('GENDER');
const docTypeOptions = getEnumOptions('DOCUMENT_TYPE');

const normalizePassenger = (p = {}) => ({
	id: p.id || '',
	category: p.category || 'adult',
	lastName: p.lastName || '',
	firstName: p.firstName || '',
	patronymicName: p.patronymicName || '',
	gender: p.gender || genderOptions[0]?.value || '',
	birthDate: p.birthDate || '',
	documentType: p.documentType || docTypeOptions[0]?.value || '',
	documentNumber: p.documentNumber || '',
	documentExpiryDate: p.documentExpiryDate || '',
	citizenshipId: p.citizenshipId || '',
});

const PassengerForm = ({ passenger, onChange, citizenshipOptions = [], flights = [] }, ref) => {
	const [data, setData] = useState(normalizePassenger(passenger));

	const [errors, setErrors] = useState({});
	const [showErrors, setShowErrors] = useState(false);
	const [focusedField, setFocusedField] = useState(null);

	useEffect(() => {
		if (!passenger) return;
		const normalized = normalizePassenger(passenger);
		['lastName', 'firstName', 'patronymicName'].forEach((k) => {
			if (normalized[k]) normalized[k] = String(normalized[k]).toUpperCase();
		});
		setData((prev) => ({ ...prev, ...normalized }));
	}, [passenger]);

	const requiresCyrillic = isCyrillicDocument(data.documentType);
	const formConfig = getPassengerFormConfig(data.documentType);

	const { minFlightDate, maxFlightDate } = useMemo(() => {
		const validDates = flights
			.map((f) => parseDate(f.scheduled_departure))
			.filter((date) => date instanceof Date && !isNaN(date));

		if (validDates.length === 0) {
			return { minFlightDate: null, maxFlightDate: null };
		}

		return {
			minFlightDate: parseDate(Math.min(...validDates)),
			maxFlightDate: parseDate(Math.max(...validDates)),
		};
	}, [flights]);

        const formFields = useMemo(() => {
                const today = new Date();
                const flightDate = minFlightDate ? parseDate(minFlightDate) : today;

                let birthMinDate;
                let birthMaxDate;
                if (data.category === 'adult') {
                        birthMaxDate = formatDate(subYears(flightDate, 12), DATE_API_FORMAT);
                        birthMinDate = formatDate(subYears(flightDate, 120), DATE_API_FORMAT);
                } else if (data.category === 'child') {
                        birthMaxDate = formatDate(subYears(flightDate, 2), DATE_API_FORMAT);
                        birthMinDate = formatDate(subYears(flightDate, 12), DATE_API_FORMAT);
                } else if (['infant', 'infant_seat'].includes(data.category)) {
                        birthMaxDate = formatDate(flightDate, DATE_API_FORMAT);
                        birthMinDate = formatDate(subYears(flightDate, 2), DATE_API_FORMAT);
                } else {
                        birthMaxDate = formatDate(today, DATE_API_FORMAT);
                        birthMinDate = formatDate(subYears(today, 120), DATE_API_FORMAT);
                }

                const docMinDate = formatDate(
                        maxFlightDate && parseDate(maxFlightDate) > today ? parseDate(maxFlightDate) : today,
                        DATE_API_FORMAT
                );
                const docMaxDate = formatDate(addYears(today, 20), DATE_API_FORMAT);

                const allFields = {
			lastName: {
				key: 'lastName',
				label: UI_LABELS.BOOKING.passenger_form.last_name,
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
				label: UI_LABELS.BOOKING.passenger_form.first_name,
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
				label: UI_LABELS.BOOKING.passenger_form.patronymic_name,
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
				validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.gender.REQUIRED : ''),
			},
                        birthDate: {
                                key: 'birthDate',
                                label: FIELD_LABELS.PASSENGER.birth_date,
                                type: FIELD_TYPES.DATE,
                                minDate: birthMinDate,
                                maxDate: birthMaxDate,
                                validate: (v) => {
                                        if (!v) return VALIDATION_MESSAGES.PASSENGER.birth_date.REQUIRED;
                                        if (!validateDate(v)) return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
                                        const birth = parseDate(v);
                                        if (birthMinDate && birth < parseDate(birthMinDate))
                                                return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
                                        if (birthMaxDate && birth > parseDate(birthMaxDate))
                                                return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
                                        if (birth > new Date()) return VALIDATION_MESSAGES.PASSENGER.birth_date.FUTURE;
                                        return getAgeError(data.category, v, minFlightDate);
                                },
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
                        documentExpiryDate: {
                                key: 'documentExpiryDate',
                                label: FIELD_LABELS.PASSENGER.document_expiry_date,
                                type: FIELD_TYPES.DATE,
                                minDate: docMinDate,
                                maxDate: docMaxDate,
                                validate: (v) => {
                                        if (!v) return VALIDATION_MESSAGES.PASSENGER.document_expiry_date.REQUIRED;
                                        if (!validateDate(v)) return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
                                        const exp = parseDate(v);
                                        if (exp < new Date()) return VALIDATION_MESSAGES.PASSENGER.document_expiry_date.EXPIRED;
                                        if (maxFlightDate && exp < parseDate(maxFlightDate))
                                                return VALIDATION_MESSAGES.PASSENGER.document_expiry_date.AFTER_FLIGHT;
                                        if (exp > parseDate(docMaxDate)) return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
                                        return '';
                                },
                        },
			citizenshipId: {
				key: 'citizenshipId',
				label: FIELD_LABELS.PASSENGER.citizenship_id,
				type: FIELD_TYPES.SELECT,
				options: citizenshipOptions,
				validate: (v) => (!v ? VALIDATION_MESSAGES.PASSENGER.citizenship_id.REQUIRED : ''),
			},
		};
		const visibleList = Object.values(allFields).filter((f) =>
			!formConfig?.show ? true : formConfig.show.includes(f.key)
		);
		const arr = createFormFields(visibleList);
		return arr.reduce((acc, f) => ({ ...acc, [f.name]: f }), {});
	}, [data.category, requiresCyrillic, citizenshipOptions, minFlightDate, maxFlightDate, formConfig.show]);

	const handleFieldChange = (field, value) => {
		const isNameField = ['lastName', 'firstName', 'patronymicName'].includes(field);
		const normalizedValue = isNameField && typeof value === 'string' ? value.toUpperCase() : value;
		const next = { ...data, [field]: normalizedValue };
		setData(next);
		if (onChange) onChange(field, normalizedValue, next);
		if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
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
			setShowErrors(true);
			return Object.keys(errs).length === 0;
		},
		[formFields, data]
	);

	useImperativeHandle(ref, () => ({ validate }), [validate]);

	const theme = useTheme();

	const showFields = formConfig.show || [];

	return (
		<Box sx={{ p: 2, border: `1px solid ${theme.palette.grey[200]}`, borderRadius: 2, mb: 3 }}>
			<Typography variant='h4' sx={{ mb: 2 }}>
				{typeLabels[data.category]}
			</Typography>

			<Grid container spacing={2}>
                                {showFields.map((fieldName) => {
                                        const isNameField = ['lastName', 'firstName', 'patronymicName'].includes(fieldName);
                                        const fieldDef = formFields[fieldName];
                                        const control = fieldDef.renderField({
                                                value: data[fieldName],
                                                onChange: (value) => handleFieldChange(fieldName, value),
                                                fullWidth: true,
                                                size: 'small',
                                                error: showErrors && !!errors[fieldName],
                                                helperText: showErrors ? errors[fieldName] : '',
                                                minDate: fieldDef.minDate,
                                                maxDate: fieldDef.maxDate,
                                        });

					return (
						<Grid item xs={12} sm={4} key={fieldName}>
							{isNameField ? (
								<Box
									onFocusCapture={() => setFocusedField(fieldName)}
									onBlurCapture={() => setFocusedField((prev) => (prev === fieldName ? null : prev))}
								>
									<Tooltip
										open={focusedField === fieldName}
										title={UI_LABELS.BOOKING.passenger_form.name_hint(requiresCyrillic)}
										placement='top'
										arrow
										disableInteractive
									>
										<Box>{control}</Box>
									</Tooltip>
								</Box>
							) : (
								control
							)}
						</Grid>
					);
				})}
			</Grid>
		</Box>
	);
};

export default forwardRef(PassengerForm);
